const express = require('express');
const router = express.Router();
const { supabase, getOrganizationId, handleSupabaseError } = require('../supabase');

const ETAPAS_VALIDAS = [
  'Lead Novo',
  'Tentativa de Contato',
  'Em Qualificação',
  'Reunião Agendada',
  'Reunião Realizada',
  'Simulação Enviada',
  'Follow-up / Negociação',
  'Análise de Crédito / Docs',
  'Fechado (Ganho)',
  'Descartado (Perda)',
];

const MOTIVOS_DESCARTE = [
  'Sem margem', 'Restrição CPF', 'Apenas curioso',
  'Parou de responder', 'Optou por financiamento', 'Sem recurso para lance',
  'Urgência incompatível', 'Outro',
];

// Temperatura automática por etapa
const TEMP_AUTO = {
  'Lead Novo':                 'frio',
  'Tentativa de Contato':      'frio',
  'Em Qualificação':           'morno',
  'Reunião Agendada':          'morno',
  'Reunião Realizada':         'quente',
  'Simulação Enviada':         'quente',
  'Follow-up / Negociação':    'quente',
  'Análise de Crédito / Docs': 'quente',
  'Fechado (Ganho)':           'quente',
  'Descartado (Perda)':        'frio',
};

function resolverTemperatura(etapa, temperaturaAtual) {
  return TEMP_AUTO[etapa] ?? temperaturaAtual;
}

function toDateOnly(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function groupCount(rows, key) {
  const acc = new Map();
  for (const row of rows) {
    const value = row[key];
    if (value == null || value === '') continue;
    acc.set(value, (acc.get(value) || 0) + 1);
  }
  return Array.from(acc.entries()).map(([k, total]) => ({ [key]: k, total }));
}

function dateKeyForWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

async function criarCadenciaReuniao(organizationId, leadId, dataReuniao) {
  const base = dataReuniao ? new Date(dataReuniao) : new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const add = (n) => {
    const r = new Date(base);
    r.setDate(r.getDate() + n);
    return r;
  };
  const sub = (n) => {
    const r = new Date(base);
    r.setDate(r.getDate() - n);
    return r;
  };

  const itens = [
    ['Enviar material explicativo sobre consórcio', fmt(sub(3)), 'Pré-reunião'],
    ['Confirmar reunião e enviar pauta', fmt(sub(1)), 'Pré-reunião'],
    ['Lembrete da reunião (manhã do dia)', fmt(base), 'Pré-reunião'],
    ['Realizar diagnóstico: lance próprio vs embutido', fmt(base), 'Reunião'],
    ['Enviar simulação comparativa Consórcio vs Financiamento', fmt(add(1)), 'Pós-reunião'],
    ['Follow-up simulação — tirar dúvidas', fmt(add(3)), 'Pós-reunião'],
    ['Enviar case de contemplação de cliente similar', fmt(add(7)), 'Pós-reunião'],
    ['Verificar decisão — criar senso de urgência (assembleia)', fmt(add(14)), 'Negociação'],
    ['Follow-up final — solicitar documentos para adesão', fmt(add(21)), 'Negociação'],
  ];

  const payload = itens.map(([descricao, data_prevista, etapa_relacionada]) => ({
    organization_id: organizationId,
    lead_id: leadId,
    descricao,
    data_prevista,
    etapa_relacionada,
  }));

  const { error } = await supabase.from('cadencia_itens').insert(payload);
  if (error) throw error;
}

function dataInicioPeriodo(periodo) {
  const hoje = new Date();
  switch (periodo) {
    case 'hoje':
      return hoje.toISOString().slice(0, 10);
    case 'semana': {
      const d = new Date(hoje);
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().slice(0, 10);
    }
    case 'mes':
      return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
    default:
      return null;
  }
}

// ─── ROTAS FIXAS ANTES DE /:id ────────────────────────────────────────────────

// GET /api/leads/stats/resumo
router.get('/stats/resumo', async (req, res) => {
  const { periodo = 'total' } = req.query;
  const dataInicio = dataInicioPeriodo(periodo);
  const hoje = new Date().toISOString().slice(0, 10);
  try {
    const organizationId = await getOrganizationId();

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId);
    if (leadsError) return handleSupabaseError(res, leadsError, 'Erro ao calcular resumo');

    const leadList = leads || [];
    const recorte = dataInicio
      ? leadList.filter((l) => toDateOnly(l.criado_em) >= dataInicio)
      : leadList;

    const porEtapa = groupCount(recorte, 'etapa_funil');
    const porTemperatura = groupCount(recorte, 'temperatura');
    const totaisGerais = groupCount(leadList, 'etapa_funil');
    const totaisTemp = groupCount(leadList, 'temperatura');
    const porOrigem = groupCount(leadList, 'origem');

    const followUpVencidos = leadList.filter(
      (l) =>
        l.data_proxima_acao &&
        l.data_proxima_acao <= hoje &&
        !['Fechado (Ganho)', 'Descartado (Perda)'].includes(l.etapa_funil)
    );

    const reunioesHoje = leadList.filter(
      (l) => l.data_proxima_acao === hoje && l.tipo_proxima_acao === 'Reunião'
    );

    const totalAnuncio = leadList.filter((l) => l.origem === 'anuncio').length;
    const anuncioResponderam = leadList.filter(
      (l) =>
        l.origem === 'anuncio' &&
        !['Lead Novo', 'Tentativa de Contato', 'Descartado (Perda)'].includes(l.etapa_funil)
    ).length;

    const etapasReuniao = new Set([
      'Reunião Agendada',
      'Reunião Realizada',
      'Simulação Enviada',
      'Follow-up / Negociação',
      'Análise de Crédito / Docs',
      'Fechado (Ganho)',
    ]);

    const reunioesPorOrigem = groupCount(
      leadList.filter((l) => etapasReuniao.has(l.etapa_funil)),
      'origem'
    );
    const fechadosPorOrigem = groupCount(
      leadList.filter((l) => l.etapa_funil === 'Fechado (Ganho)'),
      'origem'
    );

    const porTipoBem = groupCount(
      leadList.filter((l) => l.tipo_de_bem),
      'tipo_de_bem'
    );

    const comRestricaoCPF = leadList.filter((l) => Boolean(l.restricao_cpf)).length;
    const snoozados = leadList.filter(
      (l) => l.snooze_ate && l.snooze_ate > hoje && l.etapa_funil === 'Follow-up / Negociação'
    ).length;

    const { data: cadenciaRows, error: cadenciaError } = await supabase
      .from('cadencia_itens')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('concluido', false)
      .lte('data_prevista', hoje);
    if (cadenciaError) return handleSupabaseError(res, cadenciaError, 'Erro ao calcular resumo');

    const leadNameById = new Map(leadList.map((l) => [l.id, l.nome]));
    const cadenciaHoje = (cadenciaRows || []).map((c) => ({
      ...c,
      lead_nome: leadNameById.get(c.lead_id) || null,
    }));

    return res.json({
      por_etapa: porEtapa,
      por_etapa_total: totaisGerais,
      por_temperatura: porTemperatura,
      por_temperatura_total: totaisTemp,
      follow_ups_vencidos: followUpVencidos,
      cadencia_hoje: cadenciaHoje,
      reunioes_hoje: reunioesHoje,
      periodo,
      por_origem: porOrigem,
      total_anuncio: totalAnuncio,
      anuncio_responderam: anuncioResponderam,
      taxa_resposta_anuncio: totalAnuncio > 0 ? Math.round((anuncioResponderam / totalAnuncio) * 100) : 0,
      reunioes_por_origem: reunioesPorOrigem,
      fechados_por_origem: fechadosPorOrigem,
      por_tipo_bem: porTipoBem,
      com_restricao_cpf: comRestricaoCPF,
      snoozados,
    });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao calcular resumo');
  }
});

// GET /api/leads/stats/evolucao
router.get('/stats/evolucao', async (req, res) => {
  try {
    const organizationId = await getOrganizationId();
    const minDate = new Date(Date.now() - 56 * 86400000).toISOString();

    const { data: leads, error } = await supabase
      .from('leads')
      .select('criado_em')
      .eq('organization_id', organizationId)
      .gte('criado_em', minDate);
    if (error) return handleSupabaseError(res, error, 'Erro ao calcular evolução');

    const counts = new Map();
    for (const row of leads || []) {
      const key = dateKeyForWeek(new Date(row.criado_em));
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const semanas = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const chave = dateKeyForWeek(d);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      semanas.push({ semana: `${dd}/${mm}`, total: counts.get(chave) || 0 });
    }

    return res.json(semanas);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao calcular evolução');
  }
});

// GET /api/leads/export/csv
router.get('/export/csv', async (req, res) => {
  try {
    const organizationId = await getOrganizationId();
    const { data: csvLeads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('criado_em', { ascending: false });

    if (error) return handleSupabaseError(res, error, 'Erro ao exportar CSV');

  const cols = [
    'id','tenant_id','nome','whatsapp','email','instagram',
    'tipo_de_bem','valor_da_carta','recurso_para_lance','restricao_cpf','urgencia',
    'temperatura','etapa_funil','motivo_descarte','snooze_ate',
    'data_proxima_acao','tipo_proxima_acao','observacoes','origem',
    'criado_em','atualizado_em',
  ];
  const esc = (v) => {
    if (v == null) return '';
    const s = String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [cols.join(','), ...csvLeads.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads-growsorcio.csv"');
    return res.send('\uFEFF' + csv);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao exportar CSV');
  }
});

// GET /api/leads/motivos-descarte
router.get('/motivos-descarte', (req, res) => {
  res.json(MOTIVOS_DESCARTE);
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/leads
router.get('/', async (req, res) => {
  const { etapa, temperatura, busca, ordem, origem, periodo, tipo_de_bem } = req.query;
  try {
    const organizationId = await getOrganizationId();
    let query = supabase.from('leads').select('*').eq('organization_id', organizationId);

    if (etapa) query = query.eq('etapa_funil', etapa);
    if (temperatura) query = query.eq('temperatura', temperatura);
    if (origem) query = query.eq('origem', origem);
    if (tipo_de_bem) query = query.eq('tipo_de_bem', tipo_de_bem);

    if (busca) {
      const term = String(busca).replaceAll(',', ' ');
      query = query.or(`nome.ilike.%${term}%,whatsapp.ilike.%${term}%,email.ilike.%${term}%`);
    }

    if (periodo) {
      const hoje = new Date().toISOString().slice(0, 10);
      const fim = new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10);
      if (periodo === 'vencido') query = query.lt('data_proxima_acao', hoje);
      else if (periodo === 'hoje') query = query.eq('data_proxima_acao', hoje);
      else if (periodo === 'semana') query = query.gte('data_proxima_acao', hoje).lte('data_proxima_acao', fim);
    }

    const ordemMap = {
      proxima_acao: { column: 'data_proxima_acao', ascending: true },
      criado_em: { column: 'criado_em', ascending: false },
      nome: { column: 'nome', ascending: true },
      valor_carta: { column: 'valor_da_carta', ascending: false },
    };
    const order = ordemMap[ordem] || ordemMap.criado_em;
    query = query.order(order.column, { ascending: order.ascending, nullsFirst: false });

    const { data, error } = await query;
    if (error) return handleSupabaseError(res, error, 'Erro ao listar leads');
    return res.json(data || []);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao listar leads');
  }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  try {
    const organizationId = await getOrganizationId();
    const leadId = Number(req.params.id);

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .maybeSingle();

    if (leadError) return handleSupabaseError(res, leadError, 'Erro ao buscar lead');
    if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

    const [{ data: interacoes, error: intError }, { data: cadencia, error: cadError }] = await Promise.all([
      supabase
        .from('interacoes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('lead_id', leadId)
        .order('data', { ascending: false })
        .order('id', { ascending: false }),
      supabase
        .from('cadencia_itens')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('lead_id', leadId)
        .order('data_prevista', { ascending: true }),
    ]);

    if (intError) return handleSupabaseError(res, intError, 'Erro ao buscar lead');
    if (cadError) return handleSupabaseError(res, cadError, 'Erro ao buscar lead');

    return res.json({ ...lead, interacoes: interacoes || [], cadencia: cadencia || [] });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao buscar lead');
  }
});

// POST /api/leads
router.post('/', async (req, res) => {
  const {
    nome, whatsapp, email, instagram,
    tipo_de_bem, valor_da_carta, recurso_para_lance, restricao_cpf, urgencia,
    temperatura, etapa_funil, motivo_descarte,
    data_proxima_acao, tipo_proxima_acao, observacoes, origem,
  } = req.body;

  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
    return res.status(400).json({ erro: 'Etapa inválida' });
  }
  if (etapa_funil === 'Descartado (Perda)' && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }

  try {
    const organizationId = await getOrganizationId();

    if (whatsapp || email) {
      let dupQuery = supabase
        .from('leads')
        .select('id, nome')
        .eq('organization_id', organizationId)
        .limit(1);

      if (whatsapp && email) dupQuery = dupQuery.or(`whatsapp.eq.${whatsapp},email.eq.${email}`);
      else if (whatsapp) dupQuery = dupQuery.eq('whatsapp', whatsapp);
      else dupQuery = dupQuery.eq('email', email);

      const { data: dup, error: dupError } = await dupQuery.maybeSingle();
      if (dupError) return handleSupabaseError(res, dupError, 'Erro ao validar duplicidade');
      if (dup) {
        return res.status(409).json({
          erro: `Lead já cadastrado: ${dup.nome} (ID #${dup.id})`,
          lead_id: dup.id,
        });
      }
    }

    const etapaFinal = etapa_funil || 'Lead Novo';
    const tempFinal = resolverTemperatura(etapaFinal, temperatura || 'frio');

    const payload = {
      organization_id: organizationId,
      nome,
      whatsapp: whatsapp || null,
      email: email || null,
      instagram: instagram || null,
      tipo_de_bem: tipo_de_bem || null,
      valor_da_carta: valor_da_carta != null ? Number(valor_da_carta) : null,
      recurso_para_lance: recurso_para_lance != null ? Number(recurso_para_lance) : null,
      restricao_cpf: Boolean(restricao_cpf),
      urgencia: urgencia || null,
      temperatura: tempFinal,
      etapa_funil: etapaFinal,
      motivo_descarte: motivo_descarte || null,
      data_proxima_acao: data_proxima_acao || null,
      tipo_proxima_acao: tipo_proxima_acao || null,
      observacoes: observacoes || null,
      origem: origem || 'prospeccao',
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(payload)
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao criar lead');

    if (etapaFinal === 'Reunião Agendada') {
      await criarCadenciaReuniao(organizationId, lead.id, data_proxima_acao);
    }

    return res.status(201).json(lead);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao criar lead');
  }
});

// PUT /api/leads/:id
router.put('/:id', async (req, res) => {

  const {
    nome, whatsapp, email, instagram,
    tipo_de_bem, valor_da_carta, recurso_para_lance, restricao_cpf, urgencia,
    temperatura, etapa_funil, motivo_descarte,
    data_proxima_acao, tipo_proxima_acao, observacoes, origem,
  } = req.body;

  if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
    return res.status(400).json({ erro: 'Etapa inválida' });
  }
  try {
    const organizationId = await getOrganizationId();
    const leadId = Number(req.params.id);

    const { data: atual, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao atualizar lead');
    if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

    const etapaFinal = etapa_funil ?? atual.etapa_funil;
    if (etapaFinal === 'Descartado (Perda)' && !(motivo_descarte || atual.motivo_descarte)) {
      return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
    }

    const tempFinal = etapa_funil
      ? resolverTemperatura(etapa_funil, atual.temperatura)
      : (temperatura ?? atual.temperatura);

    const payload = {
      nome: nome ?? atual.nome,
      whatsapp: whatsapp ?? atual.whatsapp,
      email: email ?? atual.email,
      instagram: instagram ?? atual.instagram,
      tipo_de_bem: tipo_de_bem !== undefined ? tipo_de_bem : atual.tipo_de_bem,
      valor_da_carta: valor_da_carta != null ? Number(valor_da_carta) : atual.valor_da_carta,
      recurso_para_lance: recurso_para_lance != null ? Number(recurso_para_lance) : atual.recurso_para_lance,
      restricao_cpf: restricao_cpf !== undefined ? Boolean(restricao_cpf) : Boolean(atual.restricao_cpf),
      urgencia: urgencia !== undefined ? urgencia : atual.urgencia,
      temperatura: tempFinal,
      etapa_funil: etapaFinal,
      motivo_descarte: motivo_descarte !== undefined ? motivo_descarte : atual.motivo_descarte,
      data_proxima_acao: data_proxima_acao ?? atual.data_proxima_acao,
      tipo_proxima_acao: tipo_proxima_acao ?? atual.tipo_proxima_acao,
      observacoes: observacoes ?? atual.observacoes,
      origem: origem ?? atual.origem,
    };

    const { data: updated, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar lead');

    if (etapa_funil === 'Reunião Agendada' && atual.etapa_funil !== 'Reunião Agendada') {
      await criarCadenciaReuniao(organizationId, atual.id, data_proxima_acao || atual.data_proxima_acao);
    }

    return res.json(updated);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao atualizar lead');
  }
});

// PATCH /api/leads/:id/etapa
router.patch('/:id/etapa', async (req, res) => {
  const { etapa_funil, motivo_descarte } = req.body;
  if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
    return res.status(400).json({ erro: 'Etapa inválida' });
  }
  if (etapa_funil === 'Descartado (Perda)' && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
  }

  try {
    const organizationId = await getOrganizationId();
    const leadId = Number(req.params.id);

    const { data: atual, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao atualizar etapa');
    if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

    const novaTemp = resolverTemperatura(etapa_funil, atual.temperatura);

    const { data: updated, error } = await supabase
      .from('leads')
      .update({
        etapa_funil,
        temperatura: novaTemp,
        motivo_descarte: motivo_descarte || atual.motivo_descarte,
      })
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');

    if (etapa_funil === 'Reunião Agendada' && atual.etapa_funil !== 'Reunião Agendada') {
      await criarCadenciaReuniao(organizationId, atual.id, atual.data_proxima_acao);
    }

    return res.json(updated);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/leads/:id/snooze — congela o lead no Follow-up/Negociação
router.patch('/:id/snooze', async (req, res) => {
  const { snooze_ate } = req.body;
  try {
    const organizationId = await getOrganizationId();
    const leadId = Number(req.params.id);

    const { data: atual, error: findError } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao aplicar snooze');
    if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

    const payload = {
      snooze_ate: snooze_ate || null,
      etapa_funil: snooze_ate && atual.etapa_funil !== 'Follow-up / Negociação'
        ? 'Follow-up / Negociação'
        : atual.etapa_funil,
    };

    const { data: updated, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao aplicar snooze');
    return res.json(updated);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao aplicar snooze');
  }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  try {
    const organizationId = await getOrganizationId();
    const leadId = Number(req.params.id);

    const { data: lead, error: findError } = await supabase
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', leadId)
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao remover lead');
    if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', leadId);

    if (error) return handleSupabaseError(res, error, 'Erro ao remover lead');
    return res.json({ mensagem: 'Lead removido com sucesso' });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao remover lead');
  }
});

module.exports = router;
