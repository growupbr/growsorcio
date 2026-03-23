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
