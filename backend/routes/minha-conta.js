'use strict';

const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');

// ── GET /api/minha-conta/meus-dados ─────────────────────────────────────────
// Portabilidade de dados: retorna todos os dados pessoais do usuário autenticado.
// Base legal: art. 18, V (portabilidade) e art. 18, II (acesso) da LGPD.
router.get('/meus-dados', async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.organizationId;

  try {
    // 1. Perfil
    const { data: perfil } = await req.supabase
      .from('profiles')
      .select('full_name, phone_number, avatar_url, role, meta_mensal, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    // 2. Registros de consentimento (service_role — query administrativa sobre dado próprio do usuário)
    const { data: consentimentos } = await supabase
      .from('consent_records')
      .select('document_type, document_version, accepted_at, ip_address')
      .eq('user_id', userId)
      .order('accepted_at', { ascending: false });

    // 3. Contagem de leads criados pela organização (dados operacionais — não pessoais do corretor)
    const { count: totalLeads } = await req.supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    // 4. Contagem de interações
    const { count: totalInteracoes } = await req.supabase
      .from('interacoes')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return res.json({
      exportado_em: new Date().toISOString(),
      conta: {
        user_id: userId,
        email: req.user.email,
        criado_em: req.user.created_at,
      },
      perfil: perfil ?? {},
      consentimentos: consentimentos ?? [],
      estatisticas: {
        total_leads: totalLeads ?? 0,
        total_interacoes: totalInteracoes ?? 0,
        organization_id: organizationId,
      },
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// ── DELETE /api/minha-conta/excluir-conta ───────────────────────────────────
// Anonimiza dados pessoais do corretor, preserva dados financeiros (5 anos — art. 7º, II LGPD).
// Revoga o acesso imediatamente via Supabase Admin Auth.
router.delete('/excluir-conta', async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.organizationId;
  const confirmacao = req.body?.confirmar;

  // Exige confirmação explícita no body para evitar exclusão acidental
  if (confirmacao !== 'EXCLUIR MINHA CONTA') {
    return res.status(400).json({
      erro: 'Confirmação inválida. Envie { "confirmar": "EXCLUIR MINHA CONTA" } no body.',
    });
  }

  try {
    // 1. Anonimizar dados pessoais do perfil
    const anonEmail = `anonimizado-${userId.slice(0, 8)}@excluido.growsorcio`;
    await supabase
      .from('profiles')
      .update({
        full_name: '[Conta excluída]',
        phone_number: null,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // 2. Atualizar e-mail no Auth para invalidar login (service_role — operação administrativa)
    await supabase.auth.admin.updateUserById(userId, {
      email: anonEmail,
      ban_duration: 'none', // garante que não está banido mas a senha fica inválida
    });

    // 3. Revogar sessões ativas
    await supabase.auth.admin.signOut(userId, 'global');

    // 4. Registrar o evento de exclusão (para auditoria dos 5 anos de dados financeiros)
    await supabase
      .from('consent_records')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        document_type: 'privacy_policy',
        document_version: 'account_deletion',
        accepted_at: new Date().toISOString(),
        ip_address: req.ip || null,
        user_agent: req.get('user-agent') || null,
      });

    return res.json({
      ok: true,
      mensagem: 'Conta excluída. Seus dados pessoais foram anonimizados. Dados financeiros são mantidos por 5 anos conforme exigência legal.',
    });
  } catch (err) {
    console.error('[excluir-conta]', err.message);
    return res.status(500).json({ erro: 'Erro ao processar exclusão. Contate privacidade@growsorcio.com.br' });
  }
});

module.exports = router;
