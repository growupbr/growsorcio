'use strict';
const express = require('express');
const router  = express.Router();

// GET /api/profile — retorna perfil do usuário autenticado
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('profiles')
      .select('full_name, phone_number, avatar_url, role, meta_mensal')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    res.json({
      full_name:    data?.full_name    || '',
      email:        req.user.email     || '',
      phone_number: data?.phone_number || '',
      avatar_url:   data?.avatar_url   || null,
      role:         data?.role         || 'member',
      meta_mensal:  data?.meta_mensal  ?? 0,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PUT /api/profile — atualiza full_name, phone_number e/ou avatar_url
router.put('/', async (req, res) => {
  const { full_name, phone_number, avatar_url, meta_mensal } = req.body;

  const updates = {};

  if (full_name !== undefined) {
    updates.full_name = String(full_name || '').slice(0, 100).trim();
  }

  if (phone_number !== undefined) {
    updates.phone_number = String(phone_number || '').slice(0, 30).trim() || null;
  }

  if (avatar_url !== undefined) {
    if (avatar_url === null) {
      updates.avatar_url = null;
    } else if (
      typeof avatar_url === 'string' &&
      avatar_url.startsWith('data:image/')
    ) {
      // Rejeita imagens excessivamente grandes (base64 ~400 KB → imagem ~300 KB)
      if (avatar_url.length > 400_000) {
        return res.status(400).json({ erro: 'Imagem muito grande (máx. ~300 KB)' });
      }
      updates.avatar_url = avatar_url;
    } else {
      return res.status(400).json({ erro: 'Formato de avatar inválido' });
    }
  }

  if (meta_mensal !== undefined) {
    const val = parseInt(meta_mensal, 10);
    if (isNaN(val) || val < 0) {
      return res.status(400).json({ erro: 'Meta mensal inválida' });
    }
    updates.meta_mensal = val;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await req.supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ erro: error.message });

  res.json({ ok: true });
});

module.exports = router;
