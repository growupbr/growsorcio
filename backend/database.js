const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'crm.db');
const db = new Database(DB_PATH);

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
  exec(`PRAGMA journal_mode = WAL`);
  exec(`PRAGMA foreign_keys = ON`);

  exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      instagram TEXT,
      whatsapp TEXT,
      administradora TEXT,
      tempo_atuacao TEXT,
      volume_mensal TEXT,
      temperatura TEXT DEFAULT 'frio',
      etapa_funil TEXT DEFAULT 'Analisar Perfil',
      data_seguiu TEXT,
      data_proxima_acao TEXT,
      tipo_proxima_acao TEXT,
      observacoes TEXT,
      origem TEXT DEFAULT 'prospeccao',
      criado_em TEXT DEFAULT (datetime('now', 'localtime')),
      atualizado_em TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Migration: adiciona coluna origem se ainda não existir (banco existente)
  try {
    exec(`ALTER TABLE leads ADD COLUMN origem TEXT DEFAULT 'prospeccao'`);
  } catch (_) {
    // Coluna já existe — ignora
  }

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
    ['Carlos Mendes', '@carlosmendes.consorcio', '11999001111', 'Porto Seguro', '3 anos', '8 cartas/mês', 'quente', 'Reunião Agendada', '2026-02-10', '2026-03-07', 'Reunião', 'Muito engajado no Instagram, conteúdo de qualidade. Mencionou interesse em expandir carteira.'],
    ['Ana Paula Freitas', '@anapaula.consorte', '21988002222', 'Embracon', '1.5 anos', '4 cartas/mês', 'morno', 'Em Desenvolvimento', '2026-02-15', '2026-03-08', 'Enviar mensagem', 'Respondeu bem à abordagem inicial, ainda avaliando.'],
    ['Roberto Alves', '@roberto.consorcio.oficial', '31977003333', 'Banco do Brasil', '5 anos', '15 cartas/mês', 'quente', 'Lead Capturado', '2026-02-01', '2026-03-06', 'Agendar reunião', 'Alta produção, parceiros com várias imobiliárias.'],
    ['Fernanda Costa', '@fercosta.consorcio', '41966004444', 'Itaú', '2 anos', '6 cartas/mês', 'frio', 'Follow-up Ativo', '2026-01-20', '2026-03-10', 'Enviar mensagem', 'Parou de responder depois de 2 trocas de mensagem.'],
    ['Marcelo Souza', '@marcelo_especialista', '51955005555', 'Caixa', '4 anos', '10 cartas/mês', 'morno', 'Proposta Enviada', '2026-01-05', '2026-03-07', 'Follow-up proposta', 'Reunião muito positiva. Proposta enviada em 28/02.'],
    ['Juliana Martins', '@juli.consorcio', '85944006666', 'Sompo', '8 meses', '2 cartas/mês', 'frio', 'Abordagem Enviada', '2026-02-28', '2026-03-09', 'Aguardar resposta', 'Perfil novo, pouco histórico. Abordagem enviada hoje.'],
    ['Diego Ramos', '@diego.ramos.consorte', '62933007777', 'Porto Seguro', '3.5 anos', '12 cartas/mês', 'quente', 'Fechado', '2025-12-01', null, null, 'Cliente convertido! Onboarding concluído em jan/2026.'],
    ['Luciana Pereira', '@lu.pereira.consorcio', '71922008888', 'Embracon', '2.5 anos', '5 cartas/mês', 'frio', 'Perdido', '2026-01-10', null, null, 'Não tinha interesse no momento.'],
  ];

  transaction(() => {
    for (const l of leads) {
      run(
        `INSERT INTO leads (nome, instagram, whatsapp, administradora, tempo_atuacao, volume_mensal, temperatura, etapa_funil, data_seguiu, data_proxima_acao, tipo_proxima_acao, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ...l
      );
    }
  });

  // Interações de exemplo
  const interacoes = [
    [1, '2026-02-10', 'DM', 'Seguiu o perfil. Mensagem de boas-vindas enviada.', 'Aguardar resposta'],
    [1, '2026-02-12', 'DM', 'Respondeu positivamente, demonstrou interesse.', 'Agendar reunião'],
    [1, '2026-02-20', 'WhatsApp', 'Reunião agendada para 07/03 às 14h.', 'Preparar material'],
    [2, '2026-02-15', 'DM', 'Abordagem inicial enviada.', 'Aguardar resposta'],
    [2, '2026-02-17', 'DM', 'Respondeu. Iniciando desenvolvimento da conversa.', 'Enviar case'],
    [3, '2026-02-01', 'DM', 'Seguiu e abordou. Resposta imediata.', 'Qualificar'],
    [3, '2026-02-10', 'WhatsApp', 'Dados coletados. Lead qualificado com alto potencial.', 'Agendar reunião'],
    [5, '2026-01-05', 'DM', 'Primeiro contato.', null],
    [5, '2026-02-01', 'Reunião', 'Reunião de qualificação realizada. Muito positiva.', 'Enviar proposta'],
    [5, '2026-02-28', 'WhatsApp', 'Proposta enviada via WhatsApp.', 'Follow-up em 7 dias'],
  ];

  transaction(() => {
    for (const i of interacoes) {
      run(
        `INSERT INTO interacoes (lead_id, data, tipo, descricao, proxima_acao) VALUES (?, ?, ?, ?, ?)`,
        ...i
      );
    }
  });

  // Cadência para o lead 1 (Reunião Agendada em 07/03)
  criarCadenciaReuniao(1, '2026-03-07');

  console.log('Dados de exemplo inseridos.');
}

function criarCadenciaReuniao(leadId, dataReuniao) {
  const base = dataReuniao ? new Date(dataReuniao) : new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const add = (n) => { const r = new Date(base); r.setDate(r.getDate() + n); return r; };
  const sub = (n) => { const r = new Date(base); r.setDate(r.getDate() - n); return r; };

  const itens = [
    ['Enviar resumo sobre a Grow Up', fmt(new Date()), 'Pré-reunião'],
    ['Enviar case de sucesso relevante', fmt(sub(2)), 'Pré-reunião'],
    ['Reforçar pauta da reunião + conteúdo do Instagram', fmt(sub(1)), 'Pré-reunião'],
    ['Lembrete da reunião (manhã do dia)', fmt(base), 'Pré-reunião'],
    ['Ligar para o lead (1h antes, se sem resposta)', fmt(base), 'Pré-reunião'],
    ['Enviar agradecimento e resumo dos pontos', fmt(base), 'Pós-reunião'],
    ['Oferecer esclarecimentos e convidar para nova conversa', fmt(add(3)), 'Pós-reunião'],
    ['Enviar testemunho ou case adicional', fmt(add(7)), 'Pós-reunião'],
    ['Criar senso de urgência para fechamento', fmt(add(14)), 'Pós-reunião'],
    ['Follow-up final e solicitar feedback', fmt(add(21)), 'Pós-reunião'],
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
