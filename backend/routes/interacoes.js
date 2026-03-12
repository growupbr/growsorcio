const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database');

const TIPOS_VALIDOS = ['DM', 'WhatsApp', 'Ligação', 'Reunião', 'E-mail', 'Anotação'];

// GET /api/interacoes?lead_id=X
router.get('/', (req, res) => {
  const { lead_id } = req.query;
  if (!lead_id) return res.status(400).json({ erro: 'lead_id é obrigatório' });

  res.json(all('SELECT * FROM interacoes WHERE lead_id = ? ORDER BY data DESC, id DESC', lead_id));
});

// POST /api/interacoes
router.post('/', (req, res) => {
  const { lead_id, data, tipo, descricao, proxima_acao } = req.body;

  if (!lead_id || !data || !tipo || !descricao) {
    return res.status(400).json({ erro: 'Campos obrigatórios: lead_id, data, tipo, descricao' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo inválido' });
  }

  const result = run(
    `INSERT INTO interacoes (lead_id, data, tipo, descricao, proxima_acao) VALUES (?, ?, ?, ?, ?)`,
    lead_id, data, tipo, descricao, proxima_acao || null
  );

  res.status(201).json(get('SELECT * FROM interacoes WHERE id = ?', result.lastInsertRowid));
});

// PUT /api/interacoes/:id
router.put('/:id', (req, res) => {
  const interacao = get('SELECT * FROM interacoes WHERE id = ?', req.params.id);
  if (!interacao) return res.status(404).json({ erro: 'Interação não encontrada' });

  const { data, tipo, descricao, proxima_acao } = req.body;
  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo inválido' });
  }

  run(
    `UPDATE interacoes SET data = ?, tipo = ?, descricao = ?, proxima_acao = ? WHERE id = ?`,
    data ?? interacao.data,
    tipo ?? interacao.tipo,
    descricao ?? interacao.descricao,
    proxima_acao !== undefined ? proxima_acao : interacao.proxima_acao,
    req.params.id
  );

  res.json(get('SELECT * FROM interacoes WHERE id = ?', req.params.id));
});

// DELETE /api/interacoes/:id
router.delete('/:id', (req, res) => {
  const interacao = get('SELECT * FROM interacoes WHERE id = ?', req.params.id);
  if (!interacao) return res.status(404).json({ erro: 'Interação não encontrada' });

  run('DELETE FROM interacoes WHERE id = ?', req.params.id);
  res.json({ mensagem: 'Interação removida' });
});

module.exports = router;
