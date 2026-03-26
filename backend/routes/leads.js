const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

const MOTIVOS_DESCARTE = [
  'Sem margem', 'Restrição CPF', 'Apenas curioso',
  'Parou de responder', 'Optou por financiamento', 'Sem recurso para lance',
  'Urgência incompatível', 'Outro',
];

// Temperatura automática por etapa
const TEMP_AUTO = {
  'Lead Anúncio':       'frio',
  'Analisar Perfil':    'frio',
  'Seguiu Perfil':      'frio',
  'Abordagem Enviada':  'frio',
  'Respondeu':          'morno',
  'Em Desenvolvimento': 'morno',
  'Follow-up Ativo':    'morno',
  'Lead Capturado':     'morno',
  'Reunião Agendada':   'quente',
  'Reunião Realizada':  'quente',
  'Proposta Enviada':   'quente',
  'Follow-up Proposta': 'quente',
  'Fechado':            'quente',
  'Perdido':            'frio',
};

const DEFAULT_STAGE_META = {
  'Lead Anúncio':       { color: '#a78bfa', is_lost: false },
  'Analisar Perfil':    { color: '#f97316', is_lost: false },
  'Seguiu Perfil':      { color: '#f97316', is_lost: false },
  'Abordagem Enviada':  { color: '#f97316', is_lost: false },
  'Respondeu':          { color: '#38bdf8', is_lost: false },
  'Em Desenvolvimento': { color: '#38bdf8', is_lost: false },
  'Follow-up Ativo':    { color: '#38bdf8', is_lost: false },
  'Lead Capturado':     { color: '#38bdf8', is_lost: false },
  'Reunião Agendada':   { color: '#f59e0b', is_lost: false },
  'Reunião Realizada':  { color: '#f59e0b', is_lost: false },
  'Proposta Enviada':   { color: '#f59e0b', is_lost: false },
  'Follow-up Proposta': { color: '#f59e0b', is_lost: false },
  'Fechado':            { color: '#22c55e', is_lost: false },
  'Perdido':            { color: '#52525b', is_lost: true },
};

function resolverTemperatura(etapa, temperaturaAtual) {
  return TEMP_AUTO[etapa] ?? temperaturaAtual;
}

function stageFallback(etapaName) {
  const nome = String(etapaName || '').trim();
  return { name: nome, is_lost: nome === 'Perdido' };
}

// Valida se uma etapa pertence à org e retorna o registro (ou null se inválida)
async function validarEtapa(db, organizationId, etapaName) {
  if (!etapaName) return null;
  const { data } = await db
    .from('funnel_stages')
    .select('id, name, is_lost')
    .eq('organization_id', organizationId)
    .eq('name', etapaName)
    .maybeSingle();
  return data;
}

async function garantirEtapa(db, organizationId, etapaName) {
  const nome = String(etapaName || '').trim();
  if (!nome) return null;

  const existente = await validarEtapa(db, organizationId, nome);
  if (existente) return existente;

  const defaults = DEFAULT_STAGE_META[nome] || { color: '#52525b', is_lost: false };

  const { data: last } = await db
    .from('funnel_stages')
    .select('display_order')
    .eq('organization_id', organizationId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const display_order = last ? last.display_order + 1 : 0;

  const { error } = await db
    .from('funnel_stages')
    .insert({
      organization_id: organizationId,
      name: nome,
      color: defaults.color,
      is_lost: defaults.is_lost,
      display_order,
    });

  if (error) {
    // Em corrida de requests, outro insert pode acontecer primeiro.
    // Nessa situação, apenas tenta ler novamente.
    const retry = await validarEtapa(db, organizationId, nome);
    if (retry) return retry;
    return null;
  }

  return validarEtapa(db, organizationId, nome);
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

function scopedByOwner(query, req) {
  let q = query.eq('organization_id', req.organizationId);
  if (req.userScopeEnabled) {
    q = q.eq('owner_user_id', req.userId);
  }
  return q;
}

function withOwnerField(payload, req) {
  if (!req.userScopeEnabled) return payload;
  return { ...payload, owner_user_id: req.userId };
}

async function criarCadenciaReuniao(db, req, leadId, dataReuniao) {
  const { organizationId } = req;
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

  const payload = itens.map(([descricao, data_prevista, etapa_relacionada]) => withOwnerField({
    organization_id: organizationId,
    lead_id: leadId,
    descricao,
    data_prevista,
    etapa_relacionada,
  }, req));

  const { error } = await db.from('cadencia_itens').insert(payload);
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

// Retorna { inicio, fim } do período ANTERIOR (fim é exclusivo = início do período atual)
function limitesPeriodoAnterior(periodo) {
  const hoje = new Date();
  switch (periodo) {
    case 'hoje': {
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      return {
        inicio: ontem.toISOString().slice(0, 10),
        fim: hoje.toISOString().slice(0, 10),
      };
    }
    case 'semana': {
      const inicioAtual = new Date(hoje);
      inicioAtual.setDate(hoje.getDate() - hoje.getDay());
      const inicioAnterior = new Date(inicioAtual);
      inicioAnterior.setDate(inicioAtual.getDate() - 7);
      return {
        inicio: inicioAnterior.toISOString().slice(0, 10),
        fim: inicioAtual.toISOString().slice(0, 10),
      };
    }
    case 'mes': {
      const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      return {
        inicio: inicioMesAnterior.toISOString().slice(0, 10),
        fim: inicioMesAtual.toISOString().slice(0, 10),
      };
    }
    default:
      return null; // 'total' não tem período anterior comparável
  }
}

// ─── ROTAS FIXAS ANTES DE /:id ────────────────────────────────────────────────

// GET /api/leads/stats/resumo
router.get('/stats/resumo', async (req, res) => {
  const { periodo = 'total' } = req.query;
  const dataInicio = dataInicioPeriodo(periodo);
  const hoje = new Date().toISOString().slice(0, 10);
  try {
    const { supabase: db, organizationId } = req;

    const { data: leads, error: leadsError } = await scopedByOwner(
      db.from('leads').select('*'),
      req
    );
    if (leadsError) return handleSupabaseError(res, leadsError, 'Erro ao calcular resumo');

    const leadList = leads || [];
    const recorte = dataInicio
      ? leadList.filter((l) => toDateOnly(l.criado_em) >= dataInicio)
      : leadList;

    // ── Período anterior (para delta nos KPIs) ────────────────────────────────
    const limAnterior = limitesPeriodoAnterior(periodo);
    const recorteAnterior = limAnterior
      ? leadList.filter((l) => {
          const d = toDateOnly(l.criado_em);
          return d >= limAnterior.inicio && d < limAnterior.fim;
        })
      : null;
    const porEtapaAnterior = recorteAnterior ? groupCount(recorteAnterior, 'etapa_funil') : null;

    const porEtapa = groupCount(recorte, 'etapa_funil');
    const porTemperatura = groupCount(recorte, 'temperatura');
    const totaisGerais = groupCount(leadList, 'etapa_funil');
    const totaisTemp = groupCount(leadList, 'temperatura');
    const porOrigem = groupCount(leadList, 'origem');

    const followUpVencidos = leadList.filter(
      (l) =>
        l.data_proxima_acao &&
        l.data_proxima_acao <= hoje &&
        !['Fechado', 'Perdido'].includes(l.etapa_funil)
    );

    const reunioesHoje = leadList.filter(
      (l) => l.data_proxima_acao === hoje && l.tipo_proxima_acao === 'Reunião'
    );

    const totalAnuncio = leadList.filter((l) => l.origem === 'anuncio').length;
    const anuncioResponderam = leadList.filter(
      (l) =>
        l.origem === 'anuncio' &&
        !['Lead Anúncio', 'Analisar Perfil', 'Perdido'].includes(l.etapa_funil)
    ).length;

    const etapasReuniao = new Set([
      'Reunião Agendada',
      'Reunião Realizada',
      'Proposta Enviada',
      'Follow-up Proposta',
      'Fechado',
    ]);

    const reunioesPorOrigem = groupCount(
      leadList.filter((l) => etapasReuniao.has(l.etapa_funil)),
      'origem'
    );
    const fechadosPorOrigem = groupCount(
      leadList.filter((l) => l.etapa_funil === 'Fechado'),
      'origem'
    );

    const porTipoBem = groupCount(
      leadList.filter((l) => l.tipo_de_bem),
      'tipo_de_bem'
    );

    const comRestricaoCPF = leadList.filter((l) => Boolean(l.restricao_cpf)).length;
    const snoozados = leadList.filter(
      (l) => l.snooze_ate && l.snooze_ate > hoje && ['Follow-up Ativo', 'Follow-up Proposta'].includes(l.etapa_funil)
    ).length;

    let cadenciaQuery = db
      .from('cadencia_itens')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('concluido', false)
      .lte('data_prevista', hoje);
    if (req.userScopeEnabled) cadenciaQuery = cadenciaQuery.eq('owner_user_id', req.userId);

    const { data: cadenciaRows, error: cadenciaError } = await cadenciaQuery;
    if (cadenciaError) return handleSupabaseError(res, cadenciaError, 'Erro ao calcular resumo');

    const leadNameById = new Map(leadList.map((l) => [l.id, l.nome]));
    const cadenciaHoje = (cadenciaRows || []).map((c) => ({
      ...c,
      lead_nome: leadNameById.get(c.lead_id) || null,
    }));

    return res.json({
      por_etapa: porEtapa,
      por_etapa_total: totaisGerais,
      por_etapa_anterior: porEtapaAnterior,
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
    const { supabase: db, organizationId } = req;
    const minDate = new Date(Date.now() - 56 * 86400000).toISOString();

    const { data: leads, error } = await scopedByOwner(
      db.from('leads').select('criado_em').gte('criado_em', minDate),
      req
    );
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
    const { supabase: db, organizationId } = req;
    const { data: csvLeads, error } = await scopedByOwner(
      db.from('leads').select('*').order('criado_em', { ascending: false }),
      req
    );

    if (error) return handleSupabaseError(res, error, 'Erro ao exportar CSV');

  const cols = [
    'id','tenant_id','nome','whatsapp','email','instagram',
    'tipo_de_bem','valor_da_carta','recurso_para_lance','restricao_cpf','urgencia',
    'temperatura','etapa_funil','motivo_descarte','snooze_ate',
    'data_proxima_acao','hora_proxima_acao','tipo_proxima_acao','observacoes','origem',
    'criado_em','atualizado_em',
  ];
  const esc = (v) => {
    if (v == null) return '';
    let s = String(v);
    // Prevent CSV formula injection (OWASP: prefix dangerous leading chars)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
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

// POST /api/leads/bulk-update — atualização em lote (mudar_etapa | arquivar)
// body: { ids: number[], action: 'mudar_etapa'|'arquivar', etapa_funil?, motivo_descarte? }
// retorna apenas os diffs dos registros alterados
router.post('/bulk-update', async (req, res) => {
  const { ids, action, etapa_funil, motivo_descarte } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ erro: 'ids é obrigatório e deve ser um array não vazio' });
  }
  if (!['mudar_etapa', 'arquivar'].includes(action)) {
    return res.status(400).json({ erro: 'action inválida. Use mudar_etapa ou arquivar' });
  }
  if (ids.length > 500) {
    return res.status(400).json({ erro: 'Máximo de 500 leads por operação em lote' });
  }

  const validIds = ids.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (validIds.length === 0) {
    return res.status(400).json({ erro: 'Nenhum ID válido fornecido' });
  }

  try {
    const { supabase: db, organizationId } = req;

    let updatePayload;
    let novaEtapa;

    if (action === 'mudar_etapa') {
      if (!etapa_funil) return res.status(400).json({ erro: 'etapa_funil é obrigatório para mudar_etapa' });
      const stage = await garantirEtapa(db, organizationId, etapa_funil) || stageFallback(etapa_funil);
      if (stage.is_lost && !motivo_descarte) {
        return res.status(400).json({ erro: 'motivo_descarte é obrigatório para etapa de descarte' });
      }
      novaEtapa = etapa_funil;
      updatePayload = {
        etapa_funil,
        temperatura: resolverTemperatura(etapa_funil, 'morno'),
        ...(stage.is_lost ? { motivo_descarte: motivo_descarte || null } : {}),
      };
    } else {
      // arquivar: busca a primeira etapa is_lost=true da org
      const { data: lostStage } = await db
        .from('funnel_stages')
        .select('name')
        .eq('organization_id', organizationId)
        .eq('is_lost', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      novaEtapa = lostStage?.name || 'Perdido';
      updatePayload = {
        etapa_funil: novaEtapa,
        temperatura: 'frio',
        motivo_descarte: motivo_descarte || 'Arquivado',
      };
    }

    // UPDATE em lote — 1 query SQL com IN(ids), isolado à org
    let bulkQuery = db
      .from('leads')
      .update(updatePayload)
      .eq('organization_id', organizationId)
      .in('id', validIds)
      .select('id, etapa_funil, motivo_descarte, temperatura, atualizado_em');
    if (req.userScopeEnabled) bulkQuery = bulkQuery.eq('owner_user_id', req.userId);

    const { data, error } = await bulkQuery;

    if (error) return handleSupabaseError(res, error, 'Erro na atualização em lote');

    return res.json({
      updated: data?.length ?? 0,
      diffs: data || [],
    });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro na atualização em lote');
  }
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/leads
router.get('/', async (req, res) => {
  const { etapa, temperatura, busca, ordem, origem, periodo, tipo_de_bem } = req.query;
  try {
    const { supabase: db, organizationId } = req;
    let query = scopedByOwner(db.from('leads').select('*'), req);

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
    const { supabase: db, organizationId } = req;
    const leadId = Number(req.params.id);

    const { data: lead, error: leadError } = await scopedByOwner(
      db.from('leads').select('*').eq('id', leadId),
      req
    ).maybeSingle();

    if (leadError) return handleSupabaseError(res, leadError, 'Erro ao buscar lead');
    if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

    const [{ data: interacoes, error: intError }, { data: cadencia, error: cadError }] = await Promise.all([
      (req.userScopeEnabled
        ? db
            .from('interacoes')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('owner_user_id', req.userId)
            .eq('lead_id', leadId)
            .order('data', { ascending: false })
            .order('id', { ascending: false })
        : db
            .from('interacoes')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('lead_id', leadId)
            .order('data', { ascending: false })
            .order('id', { ascending: false })),
      (req.userScopeEnabled
        ? db
            .from('cadencia_itens')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('owner_user_id', req.userId)
            .eq('lead_id', leadId)
            .order('data_prevista', { ascending: true })
        : db
            .from('cadencia_itens')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('lead_id', leadId)
            .order('data_prevista', { ascending: true })),
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
    data_proxima_acao, hora_proxima_acao, tipo_proxima_acao, observacoes, origem,
  } = req.body;

  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });

  try {
    const { supabase: db, organizationId } = req;

    if (etapa_funil) {
      const stage = await garantirEtapa(db, organizationId, etapa_funil) || stageFallback(etapa_funil);
      if (stage.is_lost && !motivo_descarte) {
        return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
      }
    }

    if (whatsapp || email) {
      let dupQuery = scopedByOwner(
        db
          .from('leads')
          .select('id, nome')
          .limit(1),
        req
      );

      // Sanitize values before embedding in PostgREST .or() filter to prevent filter injection
      if (whatsapp && email) {
        const safeWa = String(whatsapp).replace(/"/g, '');
        const safeMail = String(email).replace(/"/g, '');
        dupQuery = dupQuery.or(`whatsapp.eq."${safeWa}",email.eq."${safeMail}"`);
      } else if (whatsapp) {
        dupQuery = dupQuery.eq('whatsapp', whatsapp);
      } else {
        dupQuery = dupQuery.eq('email', email);
      }

      const { data: dup, error: dupError } = await dupQuery.maybeSingle();
      if (dupError) return handleSupabaseError(res, dupError, 'Erro ao validar duplicidade');
      if (dup) {
        return res.status(409).json({
          erro: `Lead já cadastrado: ${dup.nome} (ID #${dup.id})`,
          lead_id: dup.id,
        });
      }
    }

    const etapaFinal = etapa_funil || 'Analisar Perfil';
    const tempFinal = resolverTemperatura(etapaFinal, temperatura || 'frio');

    const payload = withOwnerField({
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
      hora_proxima_acao: hora_proxima_acao || null,
      tipo_proxima_acao: tipo_proxima_acao || null,
      observacoes: observacoes || null,
      origem: origem || 'prospeccao',
    }, req);

    const { data: lead, error } = await db
      .from('leads')
      .insert(payload)
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao criar lead');

    if (etapaFinal === 'Reunião Agendada') {
      await criarCadenciaReuniao(db, req, lead.id, data_proxima_acao);
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
    data_proxima_acao, hora_proxima_acao, tipo_proxima_acao, observacoes, origem,
  } = req.body;

  try {
    const { supabase: db, organizationId } = req;
    const leadId = Number(req.params.id);

    const { data: atual, error: findError } = await scopedByOwner(
      db.from('leads').select('*').eq('id', leadId),
      req
    ).maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao atualizar lead');
    if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

    let stageValidado = null;
    if (etapa_funil) {
      stageValidado = await garantirEtapa(db, organizationId, etapa_funil) || stageFallback(etapa_funil);
    }

    const etapaFinal = etapa_funil ?? atual.etapa_funil;
    if (stageValidado?.is_lost && !(motivo_descarte || atual.motivo_descarte)) {
      return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
    }

    // Se o usuário enviou temperatura explicitamente, respeita a escolha.
    // Só auto-resolve pela etapa quando temperatura não foi enviada.
    const tempFinal = temperatura !== undefined
      ? temperatura
      : etapa_funil
        ? resolverTemperatura(etapa_funil, atual.temperatura)
        : atual.temperatura;

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
      // Usar !== undefined para distinguir "não enviado" de "enviado vazio".
      // Campos de DATE precisam de || null para converter "" → null (Postgres rejeita string vazia em DATE)
      data_proxima_acao: data_proxima_acao !== undefined ? (data_proxima_acao || null) : atual.data_proxima_acao,
      hora_proxima_acao: hora_proxima_acao !== undefined ? (hora_proxima_acao || null) : atual.hora_proxima_acao,
      tipo_proxima_acao: tipo_proxima_acao !== undefined ? (tipo_proxima_acao || null) : atual.tipo_proxima_acao,
      observacoes: observacoes !== undefined ? (observacoes || null) : atual.observacoes,
      origem: origem ?? atual.origem,
    };

    const { data: updated, error } = await scopedByOwner(
      db.from('leads').update(payload).eq('id', leadId),
      req
    ).select('*').single();

    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar lead');

    if (etapa_funil === 'Reunião Agendada' && atual.etapa_funil !== 'Reunião Agendada') {
      await criarCadenciaReuniao(db, req, atual.id, data_proxima_acao || atual.data_proxima_acao);
    }

    return res.json(updated);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao atualizar lead');
  }
});

// PATCH /api/leads/:id/etapa
router.patch('/:id/etapa', async (req, res) => {
  const { etapa_funil, motivo_descarte } = req.body;
  if (!etapa_funil) return res.status(400).json({ erro: 'Etapa é obrigatória' });

  try {
    const { supabase: db, organizationId } = req;
    const leadId = Number(req.params.id);

    const stage = await garantirEtapa(db, organizationId, etapa_funil) || stageFallback(etapa_funil);
    if (stage.is_lost && !motivo_descarte) {
      return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
    }

    const { data: atual, error: findError } = await scopedByOwner(
      db.from('leads').select('*').eq('id', leadId),
      req
    ).maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao atualizar etapa');
    if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

    const novaTemp = resolverTemperatura(etapa_funil, atual.temperatura);

    const { data: updated, error } = await scopedByOwner(
      db
        .from('leads')
        .update({
          etapa_funil,
          temperatura: novaTemp,
          motivo_descarte: motivo_descarte || atual.motivo_descarte,
        })
        .eq('id', leadId),
      req
    ).select('*').single();

    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');

    if (etapa_funil === 'Reunião Agendada' && atual.etapa_funil !== 'Reunião Agendada') {
      await criarCadenciaReuniao(db, req, atual.id, atual.data_proxima_acao);
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
    const { supabase: db, organizationId } = req;
    const leadId = Number(req.params.id);

    const { data: atual, error: findError } = await scopedByOwner(
      db.from('leads').select('*').eq('id', leadId),
      req
    ).maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao aplicar snooze');
    if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

    const payload = {
      snooze_ate: snooze_ate || null,
      etapa_funil: snooze_ate && atual.etapa_funil !== 'Follow-up Ativo'
        ? 'Follow-up Ativo'
        : atual.etapa_funil,
    };

    const { data: updated, error } = await scopedByOwner(
      db.from('leads').update(payload).eq('id', leadId),
      req
    ).select('*').single();

    if (error) return handleSupabaseError(res, error, 'Erro ao aplicar snooze');
    return res.json(updated);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao aplicar snooze');
  }
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const leadId = Number(req.params.id);

    const { data: lead, error: findError } = await scopedByOwner(
      db.from('leads').select('id').eq('id', leadId),
      req
    ).maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao remover lead');
    if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

    const { error } = await scopedByOwner(
      db.from('leads').delete().eq('id', leadId),
      req
    );

    if (error) return handleSupabaseError(res, error, 'Erro ao remover lead');
    return res.json({ mensagem: 'Lead removido com sucesso' });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao remover lead');
  }
});

module.exports = router;
