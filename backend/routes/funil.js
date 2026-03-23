const express = require('express');
const router = express.Router();
const { supabase: serviceDb, handleSupabaseError } = require('../supabase');

const DEFAULT_FUNNEL_STAGES = [
  { name: 'Lead Anúncio',       display_order: 0,  color: '#a78bfa', is_lost: false },
  { name: 'Analisar Perfil',    display_order: 1,  color: '#f97316', is_lost: false },
  { name: 'Seguiu Perfil',      display_order: 2,  color: '#f97316', is_lost: false },
  { name: 'Abordagem Enviada',  display_order: 3,  color: '#f97316', is_lost: false },
  { name: 'Respondeu',          display_order: 4,  color: '#38bdf8', is_lost: false },
  { name: 'Em Desenvolvimento', display_order: 5,  color: '#38bdf8', is_lost: false },
  { name: 'Follow-up Ativo',    display_order: 6,  color: '#38bdf8', is_lost: false },
  { name: 'Lead Capturado',     display_order: 7,  color: '#38bdf8', is_lost: false },
  { name: 'Reunião Agendada',   display_order: 8,  color: '#f59e0b', is_lost: false },
  { name: 'Reunião Realizada',  display_order: 9,  color: '#f59e0b', is_lost: false },
  { name: 'Proposta Enviada',   display_order: 10, color: '#f59e0b', is_lost: false },
  { name: 'Follow-up Proposta', display_order: 11, color: '#f59e0b', is_lost: false },
  { name: 'Fechado',            display_order: 12, color: '#22c55e', is_lost: false },
  { name: 'Perdido',            display_order: 13, color: '#52525b', is_lost: true  },
];

// GET /api/funil — lista etapas da org, ordenadas por display_order
// Auto-seed default stages if none exist yet for this org
router.get('/', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;
    const { data, error } = await db
      .from('funnel_stages')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true });

    if (error) return handleSupabaseError(res, error, 'Erro ao listar etapas');

    if (data && data.length > 0) return res.json(data);

    // Org still has no stages — seed the defaults using service role (bypass RLS)
    const toInsert = DEFAULT_FUNNEL_STAGES.map((s) => ({ ...s, organization_id: organizationId }));
    const { data: seeded, error: seedError } = await serviceDb
      .from('funnel_stages')
      .insert(toInsert)
      .select('*');

    if (seedError) {
      // Seed failed (e.g. table not migrated yet) — return empty so frontend fallback takes over
      console.error('[funil] Seed failed:', seedError.message);
      return res.json([]);
    }

    return res.json(seeded.sort((a, b) => a.display_order - b.display_order));
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao listar etapas');
  }
});

// POST /api/funil — cria nova etapa
router.post('/', async (req, res) => {
  const { name, color = '#52525b', is_lost = false } = req.body;
  if (!name?.trim()) return res.status(400).json({ erro: 'Nome da etapa é obrigatório' });

  try {
    const { supabase: db, organizationId } = req;

    // Descobre o próximo display_order
    const { data: last } = await db
      .from('funnel_stages')
      .select('display_order')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const display_order = last ? last.display_order + 1 : 0;

    const { data, error } = await db
      .from('funnel_stages')
      .insert({ organization_id: organizationId, name: name.trim(), color, is_lost, display_order })
      .select('*')
      .single();

    if (error) return handleSupabaseError(res, error, 'Erro ao criar etapa');
    return res.status(201).json(data);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao criar etapa');
  }
});

// PUT /api/funil/:id — atualiza nome, cor ou is_lost
router.put('/:id', async (req, res) => {
  const { name, color, is_lost } = req.body;

  try {
    const { supabase: db, organizationId } = req;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;
    if (is_lost !== undefined) updates.is_lost = Boolean(is_lost);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }
    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({ erro: 'Nome não pode ser vazio' });
    }

    const { data, error } = await db
      .from('funnel_stages')
      .update(updates)
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .select('*')
      .maybeSingle();

    if (error) return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
    if (!data) return res.status(404).json({ erro: 'Etapa não encontrada' });
    return res.json(data);
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao atualizar etapa');
  }
});

// PATCH /api/funil/reorder — reordena etapas em lote
// body: [{ id: uuid, display_order: number }, ...]
router.patch('/reorder', async (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ erro: 'Array de itens é obrigatório' });
  }

  try {
    const { supabase: db, organizationId } = req;

    const updates = await Promise.all(
      items.map(({ id, display_order }) =>
        db
          .from('funnel_stages')
          .update({ display_order })
          .eq('organization_id', organizationId)
          .eq('id', id)
      )
    );

    const firstError = updates.find(({ error }) => error);
    if (firstError) return handleSupabaseError(res, firstError.error, 'Erro ao reordenar etapas');

    return res.json({ ok: true });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao reordenar etapas');
  }
});

// DELETE /api/funil/:id — remove etapa (bloqueia se houver leads ativos)
router.delete('/:id', async (req, res) => {
  try {
    const { supabase: db, organizationId } = req;

    const { data: stage } = await db
      .from('funnel_stages')
      .select('name')
      .eq('organization_id', organizationId)
      .eq('id', req.params.id)
      .maybeSingle();

    if (!stage) return res.status(404).json({ erro: 'Etapa não encontrada' });

    const { count, error: countError } = await db
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('etapa_funil', stage.name);

    if (countError) return handleSupabaseError(res, countError, 'Erro ao verificar leads');

    if (count > 0) {
      return res.status(409).json({
        erro: `Etapa possui ${count} lead(s) ativo(s). Mova-os para outra etapa antes de excluir.`,
      });
    }

    const { error } = await db
      .from('funnel_stages')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', req.params.id);

    if (error) return handleSupabaseError(res, error, 'Erro ao excluir etapa');
    return res.json({ ok: true });
  } catch (error) {
    return handleSupabaseError(res, error, 'Erro ao excluir etapa');
  }
});

module.exports = router;
