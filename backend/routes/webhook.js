const express = require('express');
const router = express.Router();
const { run } = require('../database');

// Campos que mapeiam diretamente para colunas da tabela leads
const CAMPOS_COLUNA = new Set(['nome', 'instagram', 'whatsapp']);

// Rate limiting simples em memória (por IP)
const _rateMap = new Map();
function checkRate(ip, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const entry = _rateMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  _rateMap.set(ip, entry);
  return entry.count <= limit;
}

// POST /api/webhook/lead
router.post('/lead', (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({ success: false, erro: 'Muitas requisições. Tente novamente em breve.' });
  }

  const body = req.body || {};
  const { nome, instagram, whatsapp, email, ...resto } = body;

  // Ao menos um identificador é obrigatório
  if (!nome && !whatsapp && !email) {
    return res.status(400).json({
      success: false,
      erro: 'Forneça ao menos nome, whatsapp ou email',
    });
  }

  // Deriva nome se não fornecido
  const nomeResolvido = nome || email || whatsapp;

  // Monta observacoes com campos extras (email + tudo que não é coluna direta)
  const linhasObs = [];
  if (email) linhasObs.push(`Email: ${email}`);
  for (const [k, v] of Object.entries(resto)) {
    if (v !== null && v !== undefined && v !== '') {
      const label = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');
      linhasObs.push(`${label}: ${v}`);
    }
  }
  const observacoes = (body.observacoes) || (linhasObs.length ? linhasObs.join(' | ') : null);

  const result = run(
    `INSERT INTO leads (nome, instagram, whatsapp, temperatura, etapa_funil, observacoes, origem)
     VALUES (?, ?, ?, 'frio', 'Lead Anúncio', ?, 'anuncio')`,
    nomeResolvido,
    instagram || null,
    whatsapp || null,
    observacoes
  );

  res.status(201).json({ success: true, lead_id: result.lastInsertRowid });
});

module.exports = router;
