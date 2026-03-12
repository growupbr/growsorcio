const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'growsorcio.db');
const db = new DatabaseSync(DB_PATH);

// Habilita WAL e FK via PRAGMA
db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

function run(sql, ...params) {
  return db.prepare(sql).run(...params);
}

function get(sql, ...params) {
  return db.prepare(sql).get(...params);
}

function all(sql, ...params) {
  return db.prepare(sql).all(...params);
}

function exec(sql) {
  db.exec(sql);
}

function transaction(fn) {
  exec('BEGIN');
  try {
    fn();
    exec('COMMIT');
  } catch (e) {
    exec('ROLLBACK');
    throw e;
  }
}

function initDb() {
  exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT DEFAULT 'default',
      nome TEXT NOT NULL,
      whatsapp TEXT,
      email TEXT,
      instagram TEXT,
      tipo_de_bem TEXT,
      valor_da_carta REAL,
      recurso_para_lance REAL,
      restricao_cpf INTEGER DEFAULT 0,
      urgencia TEXT,
      temperatura TEXT DEFAULT 'frio',
      etapa_funil TEXT DEFAULT 'Lead Novo',
      motivo_descarte TEXT,
      snooze_ate TEXT,
      data_proxima_acao TEXT,
      tipo_proxima_acao TEXT,
      observacoes TEXT,
      origem TEXT DEFAULT 'prospeccao',
      criado_em TEXT DEFAULT (datetime('now', 'localtime')),
      atualizado_em TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS interacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      proxima_acao TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS cadencia_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      data_prevista TEXT,
      concluido INTEGER DEFAULT 0,
      etapa_relacionada TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  inserirDadosExemplo();
}

function inserirDadosExemplo() {
  const count = get('SELECT COUNT(*) as total FROM leads');
  if (count.total > 0) return;

  const leads = [
    ['Carlos Mendes', '11999001111', 'carlos@email.com', 'Imóvel', 350000, 50000, 0, 'Imediata', 'quente', 'Reunião Agendada', '2026-03-15', 'Reunião', 'Servidor público, renda estável. Quer carta para comprar apartamento na planta. Lance próprio de R$ 50k.', 'anuncio'],
    ['Ana Paula Freitas', '21988002222', 'anapaula@email.com', 'Veículo', 80000, 15000, 0, '3 a 6 meses', 'morno', 'Em Qualificação', '2026-03-13', 'Enviar simulação', 'Quer trocar carro. Avaliando consórcio vs financiamento. Sem restrição no CPF.', 'anuncio'],
    ['Roberto Alves', '31977003333', null, 'Imóvel', 500000, 0, 0, 'Planejamento longo', 'frio', 'Tentativa de Contato', '2026-03-12', 'Ligar', 'Lead via Meta Ads. Ainda não respondeu. 3ª tentativa de contato.', 'anuncio'],
    ['Fernanda Costa', '41966004444', 'fernanda@email.com', 'Imóvel', 280000, 30000, 1, 'Imediata', 'frio', 'Descartado (Perda)', null, null, 'CPF com restrição confirmada. Não pode aderir no momento.', 'anuncio'],
    ['Marcelo Souza', '51955005555', 'marcelo@email.com', 'Veículo', 120000, 25000, 0, '3 a 6 meses', 'quente', 'Simulação Enviada', '2026-03-14', 'Follow-up simulação', 'Simulação enviada em 10/03. Comparativo consórcio vs financiamento no WhatsApp.', 'prospeccao'],
    ['Juliana Martins', '85944006666', null, 'Serviços', 60000, 5000, 0, 'Planejamento longo', 'frio', 'Lead Novo', null, null, null, 'anuncio'],
    ['Diego Ramos', '62933007777', 'diego@email.com', 'Imóvel', 420000, 80000, 0, 'Imediata', 'quente', 'Fechado (Ganho)', null, null, 'Contrato assinado em 05/03/2026. Adesão paga. Grupo 0847.', 'prospeccao'],
    ['Luciana Pereira', '71922008888', null, 'Veículo', 70000, 0, 0, '3 a 6 meses', 'frio', 'Descartado (Perda)', null, null, 'Parou de responder após 5 tentativas. Apenas curioso.', 'anuncio'],
  ];

  transaction(() => {
    for (const l of leads) {
      run(
        `INSERT INTO leads (nome, whatsapp, email, tipo_de_bem, valor_da_carta, recurso_para_lance, restricao_cpf, urgencia, temperatura, etapa_funil, data_proxima_acao, tipo_proxima_acao, observacoes, origem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ...l
      );
    }
    run(`UPDATE leads SET motivo_descarte = 'Restrição CPF' WHERE nome = 'Fernanda Costa'`);
    run(`UPDATE leads SET motivo_descarte = 'Parou de responder' WHERE nome = 'Luciana Pereira'`);
  });

  const interacoes = [
    [1, '2026-03-01', 'WhatsApp', 'Lead entrou pelo Meta Ads. Primeiro contato feito.', 'Qualificar Blessed 4.0'],
    [1, '2026-03-05', 'Ligação', 'Qualificação completa: carta R$350k, lance R$50k, sem restrição. Reunião agendada.', 'Preparar simulação'],
    [2, '2026-03-08', 'WhatsApp', 'Lead respondeu. Aplicando filtro Blessed 4.0.', 'Confirmar valor da carta'],
    [2, '2026-03-10', 'WhatsApp', 'Enviou comprovante de renda. Qualificado parcialmente.', 'Enviar simulação comparativa'],
    [3, '2026-03-10', 'WhatsApp', '1ª tentativa. Sem resposta.', 'Ligar amanhã'],
    [3, '2026-03-11', 'Ligação', '2ª tentativa. Caixa postal.', 'Tentar novamente'],
    [5, '2026-03-08', 'WhatsApp', 'Reunião realizada. Diagnóstico: lance embutido, prazo 180 meses.', 'Montar simulação'],
    [5, '2026-03-10', 'WhatsApp', 'Simulação enviada: consórcio R$120k vs financiamento. Economia de R$45k.', 'Follow-up em 3 dias'],
    [7, '2026-02-20', 'Reunião', 'Reunião de fechamento. Contrato assinado. Adesão paga.', null],
  ];

  transaction(() => {
    for (const i of interacoes) {
      run(
        `INSERT INTO interacoes (lead_id, data, tipo, descricao, proxima_acao) VALUES (?, ?, ?, ?, ?)`,
        ...i
      );
    }
  });

  criarCadenciaReuniao(1, '2026-03-15');

  console.log('GrowSorcio — dados de exemplo inseridos.');
}

function criarCadenciaReuniao(leadId, dataReuniao) {
  const base = dataReuniao ? new Date(dataReuniao) : new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const add = (n) => { const r = new Date(base); r.setDate(r.getDate() + n); return r; };
  const sub = (n) => { const r = new Date(base); r.setDate(r.getDate() - n); return r; };

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

  transaction(() => {
    for (const [desc, data, etapa] of itens) {
      run(
        `INSERT INTO cadencia_itens (lead_id, descricao, data_prevista, etapa_relacionada) VALUES (?, ?, ?, ?)`,
        leadId, desc, data, etapa
      );
    }
  });
}

module.exports = { db, run, get, all, exec, transaction, initDb, criarCadenciaReuniao };
