const express = require('express');
const router = express.Router();
const { supabase, handleSupabaseError } = require('../supabase');

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
router.post('/lead', async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  if (!checkRate(ip)) {
    return res.status(429).json({ success: false, erro: 'Muitas requisições. Tente novamente em breve.' });
  }

  // Validação de chave secreta (opcional — só ativa se LEAD_WEBHOOK_SECRET estiver definido no .env)
  const webhookSecret = process.env.LEAD_WEBHOOK_SECRET;
  if (webhookSecret) {
    const providedKey = req.headers['x-webhook-key'] || '';
    if (providedKey !== webhookSecret) {
      return res.status(401).json({ success: false, erro: 'Chave de webhook inválida' });
    }
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

  // Extrai campos específicos de consórcio do body
  const { tipo_de_bem, valor_da_carta, recurso_para_lance, restricao_cpf, urgencia } = body;

  try {
    // Webhooks públicos: org_id vem da env — cada instância serve uma org
    const organizationId = process.env.SUPABASE_ORGANIZATION_ID;
    if (!organizationId) {
      return res.status(503).json({ success: false, erro: 'Servidor não configurado para receber leads' });
    }

    const payload = {
      organization_id: organizationId,
      nome: nomeResolvido,
      instagram: instagram || null,
      whatsapp: whatsapp || null,
      temperatura: 'frio',
      etapa_funil: 'Lead Anúncio',
      tipo_de_bem: tipo_de_bem || null,
      valor_da_carta: valor_da_carta ? Number(valor_da_carta) : null,
      recurso_para_lance: recurso_para_lance ? Number(recurso_para_lance) : null,
      restricao_cpf: Boolean(restricao_cpf),
      urgencia: urgencia || null,
      observacoes,
      origem: 'anuncio',
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select('id')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao inserir lead do webhook');
    return res.status(201).json({ success: true, lead_id: data.id });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao inserir lead do webhook');
  }
});

module.exports = router;
