const express = require('express');
const router = express.Router();
const { run, get } = require('../database');

// PATCH /api/cadencia/:id/concluir
router.patch('/:id/concluir', (req, res) => {
  const item = get('SELECT * FROM cadencia_itens WHERE id = ?', req.params.id);
  if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

  run('UPDATE cadencia_itens SET concluido = 1 WHERE id = ?', req.params.id);
  res.json({ ...item, concluido: 1 });
});

// PATCH /api/cadencia/:id/reabrir
router.patch('/:id/reabrir', (req, res) => {
  const item = get('SELECT * FROM cadencia_itens WHERE id = ?', req.params.id);
  if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

  run('UPDATE cadencia_itens SET concluido = 0 WHERE id = ?', req.params.id);
  res.json({ ...item, concluido: 0 });
});

module.exports = router;
