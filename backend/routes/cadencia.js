const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

function scopedByOwner(query, req) {
  let q = query.eq('organization_id', req.organizationId);
  if (req.userScopeEnabled) {
    q = q.eq('owner_user_id', req.userId);
  }
  return q;
}

// GET /api/cadencia/pendentes?lead_id=X (lead_id opcional)
// Retorna todos os itens com concluido=false escopados pela org do JWT.
router.get('/pendentes', async (req, res) => {
  const { lead_id } = req.query;
  try {
    const { supabase: db } = req;
    let q = scopedByOwner(
      db.from('cadencia_itens').select('*').eq('concluido', false),
      req
    ).order('data_prevista', { ascending: true });
    if (lead_id) q = q.eq('lead_id', Number(lead_id));
    const { data, error } = await q;
    if (error) return handleSupabaseError(res, error, 'Erro ao listar pendentes');
    return res.json(data || []);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao listar pendentes');
  }
});

// PATCH /api/cadencia/:id/concluir
router.patch('/:id/concluir', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: item, error: findError } = await scopedByOwner(
      db
        .from('cadencia_itens')
        .select('*')
        .eq('id', Number(req.params.id)),
      req
    ).maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao concluir item');
    if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

    const { data, error } = await scopedByOwner(
      db
        .from('cadencia_itens')
        .update({ concluido: true })
        .eq('id', Number(req.params.id)),
      req
    ).select('*').single();

    if (error) return handleSupabaseError(res, error, 'Erro ao concluir item');

    // Registrar interação no histórico do lead (tipo Anotação)
    // organization_id extraído exclusivamente do JWT — nunca do body
    const hoje = new Date().toISOString().slice(0, 10);
    const interacaoPayload = {
      lead_id: item.lead_id,
      organization_id: organizationId,
      data: hoje,
      tipo: 'Anotação',
      descricao: `✅ Atividade concluída: ${item.descricao}`,
    };
    if (req.userScopeEnabled) interacaoPayload.owner_user_id = req.userId;
    // Não bloqueia a resposta se a interação falhar
    db.from('interacoes').insert(interacaoPayload).then(() => {}).catch(() => {});

    return res.json(data);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao concluir item');
  }
});

// PATCH /api/cadencia/:id/reabrir
router.patch('/:id/reabrir', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: item, error: findError } = await scopedByOwner(
      db
        .from('cadencia_itens')
        .select('*')
        .eq('id', Number(req.params.id)),
      req
    ).maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao reabrir item');
    if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

    const { data, error } = await scopedByOwner(
      db
        .from('cadencia_itens')
        .update({ concluido: false })
        .eq('id', Number(req.params.id)),
      req
    ).select('*').single();

    if (error) return handleSupabaseError(res, error, 'Erro ao reabrir item');
    return res.json(data);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao reabrir item');
  }
});

module.exports = router;
