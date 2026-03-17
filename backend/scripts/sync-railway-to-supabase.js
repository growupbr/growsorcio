/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

const PROD_API = process.env.PROD_API_URL || 'https://crm-growup-production.up.railway.app';

function asDate(v) {
  if (!v) return null;
  return String(v).slice(0, 10);
}

function asTs(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (s.includes('T')) return s;
  return `${s.replace(' ', 'T')}-03:00`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
  return await res.json();
}

async function run() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env');
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const leads = await fetchJson(`${PROD_API}/api/leads`);
  const details = [];
  for (const lead of leads) {
    const full = await fetchJson(`${PROD_API}/api/leads/${lead.id}`);
    details.push(full);
  }

  const orgName = process.env.SUPABASE_MIGRATION_ORG_NAME || 'GrowSorcio Migrado';
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', orgName)
    .limit(1)
    .maybeSingle();

  if (orgError) throw orgError;
  if (!org) throw new Error(`Organization '${orgName}' nao encontrada no Supabase`);

  const orgId = org.id;

  const { error: delCad } = await supabase
    .from('cadencia_itens')
    .delete()
    .eq('organization_id', orgId);
  if (delCad) throw delCad;

  const { error: delInt } = await supabase
    .from('interacoes')
    .delete()
    .eq('organization_id', orgId);
  if (delInt) throw delInt;

  const { error: delLead } = await supabase
    .from('leads')
    .delete()
    .eq('organization_id', orgId);
  if (delLead) throw delLead;

  const leadRows = details.map((l) => ({
    id: l.id,
    organization_id: orgId,
    nome: l.nome,
    whatsapp: l.whatsapp || null,
    email: l.email || null,
    instagram: l.instagram || null,
    tipo_de_bem: l.tipo_de_bem || null,
    valor_da_carta: l.valor_da_carta != null ? Number(l.valor_da_carta) : null,
    recurso_para_lance: l.recurso_para_lance != null ? Number(l.recurso_para_lance) : null,
    restricao_cpf: Boolean(l.restricao_cpf),
    urgencia: l.urgencia || null,
    temperatura: l.temperatura || 'frio',
    etapa_funil: l.etapa_funil || 'Lead Novo',
    motivo_descarte: l.motivo_descarte || null,
    snooze_ate: asDate(l.snooze_ate),
    data_proxima_acao: asDate(l.data_proxima_acao),
    tipo_proxima_acao: l.tipo_proxima_acao || null,
    observacoes: l.observacoes || null,
    origem: l.origem || 'prospeccao',
    criado_em: asTs(l.criado_em),
    atualizado_em: asTs(l.atualizado_em),
  }));

  const { error: insLead } = await supabase.from('leads').insert(leadRows);
  if (insLead) throw insLead;

  const interacoesRows = details.flatMap((l) =>
    (l.interacoes || []).map((i) => ({
      id: i.id,
      organization_id: orgId,
      lead_id: l.id,
      data: asDate(i.data),
      tipo: i.tipo,
      descricao: i.descricao,
      proxima_acao: i.proxima_acao || null,
      criado_em: asTs(i.criado_em),
    }))
  );

  if (interacoesRows.length) {
    const { error: insInt } = await supabase.from('interacoes').insert(interacoesRows);
    if (insInt) throw insInt;
  }

  const cadenciaRows = details.flatMap((l) =>
    (l.cadencia || []).map((c) => ({
      id: c.id,
      organization_id: orgId,
      lead_id: l.id,
      descricao: c.descricao,
      data_prevista: asDate(c.data_prevista),
      concluido: Boolean(c.concluido),
      etapa_relacionada: c.etapa_relacionada || null,
      criado_em: asTs(c.criado_em),
    }))
  );

  if (cadenciaRows.length) {
    const { error: insCad } = await supabase.from('cadencia_itens').insert(cadenciaRows);
    if (insCad) throw insCad;
  }

  const { error: resetError } = await supabase.rpc('reset_identity_sequences');
  if (resetError) throw resetError;

  const [{ count: leadsCount }, { count: interacoesCount }, { count: cadenciaCount }] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('interacoes').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('cadencia_itens').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
  ]);

  console.log(`Sync concluido | leads=${leadsCount} interacoes=${interacoesCount} cadencia=${cadenciaCount}`);
}

run().catch((e) => {
  console.error('Falha na sincronizacao:', e.message || e);
  process.exit(1);
});
