require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env');
}
if (!SUPABASE_ANON_KEY) {
  // ANON_KEY é opcional — as rotas usam service_role client.
  // Sem ela, createUserClient() não funciona, mas auth e dados continuam operando.
  console.warn('[supabase] SUPABASE_ANON_KEY não configurada — createUserClient() indisponível');
}

// service_role: bypassa RLS — usar APENAS para auth.getUser() e webhooks externos
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Client autenticado com JWT do usuário — RLS ativo, isolamento garantido pelo banco
function createUserClient(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function handleSupabaseError(res, error, fallback = 'Erro interno') {
  const message = error?.message || fallback;
  return res.status(500).json({ erro: message });
}

module.exports = {
  supabase,
  createUserClient,
  handleSupabaseError,
};
