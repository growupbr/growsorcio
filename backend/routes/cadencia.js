const express = require('express');
const router = express.Router();
const { handleSupabaseError } = require('../supabase');

// PATCH /api/cadencia/:id/concluir
router.patch('/:id/concluir', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: item, error: findError } = await db
      .from('cadencia_itens')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id))
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao concluir item');
    if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

    const { data, error } = await db
      .from('cadencia_itens')
      .update({ concluido: true })
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id))
      .select('*')
      .single();

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

    const { data: item, error: findError } = await db
      .from('cadencia_itens')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id))
      .maybeSingle();

    if (findError) return handleSupabaseError(res, findError, 'Erro ao reabrir item');
    if (!item) return res.status(404).json({ erro: 'Item não encontrado' });

    const { data, error } = await db
      .from('cadencia_itens')
      .update({ concluido: false })
      .eq('organization_id', organizationId)
      .eq('id', Number(req.params.id))
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao reabrir item');
    return res.json(data);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao reabrir item');
  }
});

module.exports = router;
