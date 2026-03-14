require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_MIGRATION_ORG_NAME = process.env.SUPABASE_MIGRATION_ORG_NAME || 'GrowSorcio Migrado';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend/.env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let cachedOrganizationId = null;

async function getOrganizationId() {
  if (cachedOrganizationId) return cachedOrganizationId;

  if (process.env.SUPABASE_ORGANIZATION_ID) {
    cachedOrganizationId = process.env.SUPABASE_ORGANIZATION_ID;
    return cachedOrganizationId;
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', SUPABASE_MIGRATION_ORG_NAME)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      `Organizacao nao encontrada com nome '${SUPABASE_MIGRATION_ORG_NAME}'. Defina SUPABASE_ORGANIZATION_ID no .env.`
    );
  }

  cachedOrganizationId = data.id;
  return cachedOrganizationId;
}

function handleSupabaseError(res, error, fallback = 'Erro interno') {
  const message = error?.message || fallback;
  return res.status(500).json({ erro: message });
}

module.exports = {
  supabase,
  getOrganizationId,
  handleSupabaseError,
};
