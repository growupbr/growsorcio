const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

const TIPOS_VALIDOS = ['DM', 'WhatsApp', 'Ligação', 'Reunião', 'E-mail', 'Anotação'];

// GET /api/interacoes?lead_id=X
router.get('/', async (req, res) => {
  const { lead_id } = req.query;
  if (!lead_id) return res.status(400).json({ erro: 'lead_id é obrigatório' });

  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('interacoes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('lead_id', Number(lead_id))
      .order('data', { ascending: false })
      .order('id', { ascending: false });

    if (error) return handleSupabaseError(res, error, 'Erro ao listar interações');
    return res.json(data || []);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao listar interações');
  }
});

// POST /api/interacoes
router.post('/', async (req, res) => {
  const { lead_id, data, tipo, descricao, proxima_acao } = req.body;

  if (!lead_id || !data || !tipo || !descricao) {
    return res.status(400).json({ erro: 'Campos obrigatórios: lead_id, data, tipo, descricao' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo inválido' });
  }

  try {
    const { supabase: db, organizationId } = req;

    const { data: lead, error: leadError } = await db
      .from('leads')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', Number(lead_id))
      .maybeSingle();

    if (leadError) return handleSupabaseError(res, leadError, 'Erro ao validar lead');
    if (!lead) return res.status(404).json({ erro: 'Lead não encontrado' });

    const { data: created, error } = await db
      .from('interacoes')
      .insert({
        organization_id: organizationId,
        lead_id: Number(lead_id),
        data,
        tipo,
        descricao,
        proxima_acao: proxima_acao || null,
      })
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao criar interação');
    return res.status(201).json(created);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao criar interação');
  }
});

// PUT /api/interacoes/:id
router.put('/:id', async (req, res) => {
  const { data, tipo, descricao, proxima_acao } = req.body;
  if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ erro: 'Tipo inválido' });
  }

  try {
    const { supabase: db, organizationId } = req;

    const { data: interacao, error: findError } = await db
      .from('interacoes')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id))
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao buscar interação');
    if (!interacao) return res.status(404).json({ erro: 'Interação não encontrada' });

    const payload = {
      data: data ?? interacao.data,
      tipo: tipo ?? interacao.tipo,
      descricao: descricao ?? interacao.descricao,
      proxima_acao: proxima_acao !== undefined ? proxima_acao : interacao.proxima_acao,
    };

    const { data: updated, error } = await db
      .from('interacoes')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id))
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar interação');
    return res.json(updated);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao atualizar interação');
  }
});

// DELETE /api/interacoes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: interacao, error: findError } = await db
      .from('interacoes')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id))
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao remover interação');
    if (!interacao) return res.status(404).json({ erro: 'Interação não encontrada' });

    const { error } = await db
      .from('interacoes')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id));

    if (error) return handleSupabaseError(res, error, 'Erro ao remover interação');
    return res.json({ mensagem: 'Interação removida' });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao remover interação');
  }
});

module.exports = router;
