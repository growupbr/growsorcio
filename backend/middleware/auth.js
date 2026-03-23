'use strict';

const { supabase } = require('../supabase');

// Cache de organization_id por user_id (5 min TTL)
// Evita query ao banco em cada request sem abrir brechas por tempo longo
const _orgCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
let _hasUserScopeColumns = null;

function mapDistinctOrgIds(rows) {
  return Array.from(new Set((rows || []).map((r) => r.organization_id).filter(Boolean)));
}

async function detectUserScopeColumns() {
  if (_hasUserScopeColumns !== null) return _hasUserScopeColumns;

  const checks = await Promise.all([
    supabase.from('leads').select('owner_user_id').limit(1),
    supabase.from('interacoes').select('owner_user_id').limit(1),
    supabase.from('cadencia_itens').select('owner_user_id').limit(1),
  ]);

  _hasUserScopeColumns = checks.every(({ error }) => {
    if (!error) return true;
    return !/column .* does not exist/i.test(error.message || '');
  });

  return _hasUserScopeColumns;
}

async function inferOrganizationIdFallback() {
  const { data: orgRows } = await supabase
    .from('leads')
    .select('organization_id')
    .not('organization_id', 'is', null)
    .limit(5000);

  const distinctLeadOrgs = mapDistinctOrgIds(orgRows);
  if (distinctLeadOrgs.length === 1) return distinctLeadOrgs[0];

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1);

  return orgs?.[0]?.id || null;
}

async function createOrganizationForUser(user) {
  const emailPrefix = String(user?.email || '').split('@')[0] || `user-${String(user.id).slice(0, 8)}`;
  const orgName = `Workspace ${emailPrefix}`;

  const { data: createdOrg, error } = await supabase
    .from('organizations')
    .insert({ name: orgName })
    .select('id')
    .single();

  if (error || !createdOrg?.id) return null;
  return createdOrg.id;
}

async function ensureUserProfile(user) {
  const userId = user.id;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!error && profile?.organization_id) {
    return profile.organization_id;
  }

  let organizationId = await inferOrganizationIdFallback();
  if (!organizationId) {
    organizationId = await createOrganizationForUser(user);
  }
  if (!organizationId) return null;

  await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      organization_id: organizationId,
      full_name: user?.user_metadata?.full_name || null,
      role: 'owner',
    }, { onConflict: 'user_id' });

  return organizationId;
}

async function healProfileOrganizationIfNeeded(userId, currentOrgId) {
  const { data: leadRows } = await supabase
    .from('leads')
    .select('organization_id')
    .not('organization_id', 'is', null)
    .limit(5000);

  const distinctLeadOrgs = mapDistinctOrgIds(leadRows);
  if (distinctLeadOrgs.length !== 1) return currentOrgId;

  const onlyOrgId = distinctLeadOrgs[0];
  if (!onlyOrgId || onlyOrgId === currentOrgId) return currentOrgId;

  await supabase
    .from('profiles')
    .upsert({ user_id: userId, organization_id: onlyOrgId }, { onConflict: 'user_id' });

  return onlyOrgId;
}

async function resolveOrganizationId(userId) {
  const now = Date.now();
  const cached = _orgCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.organizationId;

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.organization_id) return null;

  _orgCache.set(userId, { organizationId: data.organization_id, expiresAt: now + CACHE_TTL_MS });
  return data.organization_id;
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token de autenticação ausente' });
  }

  // Valida o token com service_role (não cria sessão, apenas verifica)
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }

  let organizationId = await resolveOrganizationId(user.id);
  if (!organizationId) {
    organizationId = await ensureUserProfile(user);
  }
  if (organizationId) {
    organizationId = await healProfileOrganizationIfNeeded(user.id, organizationId);
  }

  if (!organizationId) {
    return res.status(403).json({ erro: 'Usuário não associado a uma organização' });
  }

  _orgCache.set(user.id, { organizationId, expiresAt: Date.now() + CACHE_TTL_MS });

  const userScopeEnabled = await detectUserScopeColumns();

  // Usa o service role client nas rotas de dados — RLS não está configurado no Supabase,
  // o isolamento é garantido pelo filtro manual .eq('organization_id', organizationId)
  req.supabase = supabase;
  req.user = user;
  req.userId = user.id;
  req.organizationId = organizationId;
  req.userScopeEnabled = userScopeEnabled;
  next();
}

module.exports = { authMiddleware };
