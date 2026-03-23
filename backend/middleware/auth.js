'use strict';

const { supabase, createUserClient } = require('../supabase');

// Cache de organization_id por user_id (5 min TTL)
// Evita query ao banco em cada request sem abrir brechas por tempo longo
const _orgCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

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

  const organizationId = await resolveOrganizationId(user.id);
  if (!organizationId) {
    return res.status(403).json({ erro: 'Usuário não associado a uma organização' });
  }

  // Client por-request com JWT do usuário — RLS ativo no banco
  req.supabase = createUserClient(token);
  req.user = user;
  req.organizationId = organizationId;
  next();
}

module.exports = { authMiddleware };
