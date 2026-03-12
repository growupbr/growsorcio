const express = require('express');
const router = express.Router();
const { run, get, all, criarCadenciaReuniao } = require('../database');

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
router.get('/stats/resumo', (req, res) => {
  const { periodo = 'total' } = req.query;
  const dataInicio = dataInicioPeriodo(periodo);
  const hoje = new Date().toISOString().slice(0, 10);

  let porEtapa, porTemperatura;
  if (dataInicio) {
    porEtapa = all(
      `SELECT etapa_funil, COUNT(*) as total FROM leads WHERE criado_em >= ? GROUP BY etapa_funil`,
      dataInicio
    );
    porTemperatura = all(
      `SELECT temperatura, COUNT(*) as total FROM leads WHERE criado_em >= ? GROUP BY temperatura`,
      dataInicio
    );
  } else {
    porEtapa = all('SELECT etapa_funil, COUNT(*) as total FROM leads GROUP BY etapa_funil');
    porTemperatura = all('SELECT temperatura, COUNT(*) as total FROM leads GROUP BY temperatura');
  }

  const followUpVencidos = all(
    `SELECT * FROM leads WHERE data_proxima_acao <= ? AND etapa_funil NOT IN ('Fechado (Ganho)', 'Descartado (Perda)')`,
    hoje
  );
  const cadenciaHoje = all(
    `SELECT c.*, l.nome as lead_nome FROM cadencia_itens c
     JOIN leads l ON c.lead_id = l.id
     WHERE c.data_prevista <= ? AND c.concluido = 0`,
    hoje
  );
  const reunioesHoje = all(
    `SELECT * FROM leads WHERE data_proxima_acao = ? AND tipo_proxima_acao = 'Reunião'`,
    hoje
  );

  const totaisGerais = all('SELECT etapa_funil, COUNT(*) as total FROM leads GROUP BY etapa_funil');
  const totaisTemp = all('SELECT temperatura, COUNT(*) as total FROM leads GROUP BY temperatura');

  const porOrigem = all('SELECT origem, COUNT(*) as total FROM leads GROUP BY origem');
  const totalAnuncio = porOrigem.find(o => o.origem === 'anuncio')?.total || 0;
  const anuncioResponderam = all(
    `SELECT COUNT(*) as total FROM leads WHERE origem = 'anuncio' AND etapa_funil NOT IN ('Lead Novo', 'Tentativa de Contato', 'Descartado (Perda)')`
  )[0]?.total || 0;
  const reunioesPorOrigem = all(
    `SELECT origem, COUNT(*) as total FROM leads
     WHERE etapa_funil IN ('Reunião Agendada','Reunião Realizada','Simulação Enviada','Follow-up / Negociação','Análise de Crédito / Docs','Fechado (Ganho)')
     GROUP BY origem`
  );
  const fechadosPorOrigem = all(
    `SELECT origem, COUNT(*) as total FROM leads WHERE etapa_funil = 'Fechado (Ganho)' GROUP BY origem`
  );

  // Métricas Blessed 4.0
  const porTipoBem = all('SELECT tipo_de_bem, COUNT(*) as total FROM leads WHERE tipo_de_bem IS NOT NULL GROUP BY tipo_de_bem');
  const comRestricaoCPF = all(`SELECT COUNT(*) as total FROM leads WHERE restricao_cpf = 1`)[0]?.total || 0;
  const snoozados = all(`SELECT COUNT(*) as total FROM leads WHERE snooze_ate IS NOT NULL AND snooze_ate > date('now') AND etapa_funil = 'Follow-up / Negociação'`)[0]?.total || 0;

  res.json({
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
});

// GET /api/leads/stats/evolucao
router.get('/stats/evolucao', (req, res) => {
  const rows = all(`
    SELECT
      strftime('%Y-W%W', criado_em) as semana,
      COUNT(*) as total
    FROM leads
    WHERE criado_em >= date('now', '-56 days')
    GROUP BY semana
    ORDER BY semana ASC
  `);

  const semanas = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const ano = d.getFullYear();
    const semNum = String(getWeekNumber(d)).padStart(2, '0');
    const chave = `${ano}-W${semNum}`;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const label = `${dd}/${mm}`;
    const encontrado = rows.find((r) => r.semana === chave);
    semanas.push({ semana: label, total: encontrado ? encontrado.total : 0 });
  }

  res.json(semanas);
});

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// GET /api/leads/export/csv
router.get('/export/csv', (req, res) => {
  const csvLeads = all('SELECT * FROM leads ORDER BY criado_em DESC');
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
  res.send('\uFEFF' + csv);
});

// GET /api/leads/motivos-descarte
router.get('/motivos-descarte', (req, res) => {
  res.json(MOTIVOS_DESCARTE);
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/leads
router.get('/', (req, res) => {
  const { etapa, temperatura, busca, ordem, origem, periodo, tipo_de_bem } = req.query;
  const conds = ['1=1'];
  const params = [];

  if (etapa)       { conds.push('etapa_funil = ?');                   params.push(etapa); }
  if (temperatura) { conds.push('temperatura = ?');                   params.push(temperatura); }
  if (origem)      { conds.push('origem = ?');                        params.push(origem); }
  if (tipo_de_bem) { conds.push('tipo_de_bem = ?');                   params.push(tipo_de_bem); }
  if (busca)       { conds.push('(nome LIKE ? OR whatsapp LIKE ? OR email LIKE ?)'); params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`); }

  if (periodo) {
    const hoje = new Date().toISOString().slice(0, 10);
    const fim  = new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10);
    if (periodo === 'vencido') {
      conds.push('data_proxima_acao < ?');             params.push(hoje);
    } else if (periodo === 'hoje') {
      conds.push('data_proxima_acao = ?');             params.push(hoje);
    } else if (periodo === 'semana') {
      conds.push('data_proxima_acao BETWEEN ? AND ?'); params.push(hoje, fim);
    }
  }

  const ordemMap = {
    proxima_acao: 'data_proxima_acao ASC',
    criado_em:    'criado_em DESC',
    nome:         'nome ASC',
    valor_carta:  'valor_da_carta DESC',
  };
  const sql = `SELECT * FROM leads WHERE ${conds.join(' AND ')} ORDER BY ${ordemMap[ordem] || 'criado_em DESC'}`;
  res.json(all(sql, ...params));
});

// GET /api/leads/:id
router.get('/:id', (req, res) => {
  const lead = get('SELECT * FROM leads WHERE id = ?', req.params.id);
  if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

  const interacoes = all('SELECT * FROM interacoes WHERE lead_id = ? ORDER BY data DESC, id DESC', req.params.id);
  const cadencia   = all('SELECT * FROM cadencia_itens WHERE lead_id = ? ORDER BY data_prevista ASC', req.params.id);

  res.json({ ...lead, interacoes, cadencia });
});

// POST /api/leads
router.post('/', (req, res) => {
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

  // Detecção de duplicatas
  if (whatsapp || email) {
    const dupConds = [];
    const dupParams = [];
    if (whatsapp) { dupConds.push('whatsapp = ?'); dupParams.push(whatsapp); }
    if (email)    { dupConds.push('email = ?');    dupParams.push(email); }
    const dup = get(`SELECT id, nome FROM leads WHERE ${dupConds.join(' OR ')}`, ...dupParams);
    if (dup) {
      return res.status(409).json({
        erro: `Lead já cadastrado: ${dup.nome} (ID #${dup.id})`,
        lead_id: dup.id,
      });
    }
  }

  const etapaFinal = etapa_funil || 'Lead Novo';
  const tempFinal  = resolverTemperatura(etapaFinal, temperatura || 'frio');

  const result = run(
    `INSERT INTO leads (nome, whatsapp, email, instagram,
      tipo_de_bem, valor_da_carta, recurso_para_lance, restricao_cpf, urgencia,
      temperatura, etapa_funil, motivo_descarte,
      data_proxima_acao, tipo_proxima_acao, observacoes, origem)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    nome,
    whatsapp || null, email || null, instagram || null,
    tipo_de_bem || null,
    valor_da_carta != null ? Number(valor_da_carta) : null,
    recurso_para_lance != null ? Number(recurso_para_lance) : null,
    restricao_cpf ? 1 : 0,
    urgencia || null,
    tempFinal, etapaFinal,
    motivo_descarte || null,
    data_proxima_acao || null, tipo_proxima_acao || null,
    observacoes || null, origem || 'prospeccao'
  );

  const lead = get('SELECT * FROM leads WHERE id = ?', result.lastInsertRowid);

  if (etapaFinal === 'Reunião Agendada') {
    criarCadenciaReuniao(lead.id, data_proxima_acao);
  }

  res.status(201).json(lead);
});

// PUT /api/leads/:id
router.put('/:id', (req, res) => {
  const atual = get('SELECT * FROM leads WHERE id = ?', req.params.id);
  if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

  const {
    nome, whatsapp, email, instagram,
    tipo_de_bem, valor_da_carta, recurso_para_lance, restricao_cpf, urgencia,
    temperatura, etapa_funil, motivo_descarte,
    data_proxima_acao, tipo_proxima_acao, observacoes, origem,
  } = req.body;

  if (etapa_funil && !ETAPAS_VALIDAS.includes(etapa_funil)) {
    return res.status(400).json({ erro: 'Etapa inválida' });
  }
  const etapaFinal = etapa_funil ?? atual.etapa_funil;
  if (etapaFinal === 'Descartado (Perda)' && !(motivo_descarte || atual.motivo_descarte)) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório' });
  }

  const tempFinal = etapa_funil
    ? resolverTemperatura(etapa_funil, atual.temperatura)
    : (temperatura ?? atual.temperatura);

  run(
    `UPDATE leads SET
      nome = ?, whatsapp = ?, email = ?, instagram = ?,
      tipo_de_bem = ?, valor_da_carta = ?, recurso_para_lance = ?, restricao_cpf = ?, urgencia = ?,
      temperatura = ?, etapa_funil = ?, motivo_descarte = ?,
      data_proxima_acao = ?, tipo_proxima_acao = ?, observacoes = ?, origem = ?,
      atualizado_em = datetime('now', 'localtime')
     WHERE id = ?`,
    nome ?? atual.nome,
    whatsapp ?? atual.whatsapp, email ?? atual.email, instagram ?? atual.instagram,
    tipo_de_bem !== undefined ? tipo_de_bem : atual.tipo_de_bem,
    valor_da_carta != null ? Number(valor_da_carta) : atual.valor_da_carta,
    recurso_para_lance != null ? Number(recurso_para_lance) : atual.recurso_para_lance,
    restricao_cpf !== undefined ? (restricao_cpf ? 1 : 0) : atual.restricao_cpf,
    urgencia !== undefined ? urgencia : atual.urgencia,
    tempFinal, etapaFinal,
    motivo_descarte !== undefined ? motivo_descarte : atual.motivo_descarte,
    data_proxima_acao ?? atual.data_proxima_acao,
    tipo_proxima_acao ?? atual.tipo_proxima_acao,
    observacoes ?? atual.observacoes,
    origem ?? atual.origem,
    req.params.id
  );

  if (etapa_funil === 'Reunião Agendada' && atual.etapa_funil !== 'Reunião Agendada') {
    criarCadenciaReuniao(atual.id, data_proxima_acao || atual.data_proxima_acao);
  }

  res.json(get('SELECT * FROM leads WHERE id = ?', req.params.id));
});

// PATCH /api/leads/:id/etapa
router.patch('/:id/etapa', (req, res) => {
  const { etapa_funil, motivo_descarte } = req.body;
  if (!etapa_funil || !ETAPAS_VALIDAS.includes(etapa_funil)) {
    return res.status(400).json({ erro: 'Etapa inválida' });
  }
  if (etapa_funil === 'Descartado (Perda)' && !motivo_descarte) {
    return res.status(400).json({ erro: 'Motivo do descarte é obrigatório ao descartar um lead' });
  }

  const atual = get('SELECT * FROM leads WHERE id = ?', req.params.id);
  if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

  const novaTemp = resolverTemperatura(etapa_funil, atual.temperatura);

  run(
    `UPDATE leads SET etapa_funil = ?, temperatura = ?, motivo_descarte = COALESCE(?, motivo_descarte),
     atualizado_em = datetime('now', 'localtime') WHERE id = ?`,
    etapa_funil, novaTemp, motivo_descarte || null, req.params.id
  );

  if (etapa_funil === 'Reunião Agendada' && atual.etapa_funil !== 'Reunião Agendada') {
    criarCadenciaReuniao(atual.id, atual.data_proxima_acao);
  }

  res.json(get('SELECT * FROM leads WHERE id = ?', req.params.id));
});

// PATCH /api/leads/:id/snooze — congela o lead no Follow-up/Negociação
router.patch('/:id/snooze', (req, res) => {
  const { snooze_ate } = req.body;
  const atual = get('SELECT * FROM leads WHERE id = ?', req.params.id);
  if (!atual) return res.status(404).json({ erro: 'Lead não encontrado' });

  run(
    `UPDATE leads SET snooze_ate = ?, atualizado_em = datetime('now', 'localtime') WHERE id = ?`,
    snooze_ate || null,
    req.params.id
  );

  // Se snooze_ate definido e lead não está em Follow-up/Negociação, move para lá
  if (snooze_ate && atual.etapa_funil !== 'Follow-up / Negociação') {
    run(
      `UPDATE leads SET etapa_funil = 'Follow-up / Negociação', atualizado_em = datetime('now', 'localtime') WHERE id = ?`,
      req.params.id
    );
  }

  res.json(get('SELECT * FROM leads WHERE id = ?', req.params.id));
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  const lead = get('SELECT * FROM leads WHERE id = ?', req.params.id);
  if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

  run('DELETE FROM leads WHERE id = ?', req.params.id);
  res.json({ mensagem: 'Lead removido com sucesso' });
});

module.exports = router;
