import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3334');
const BASE = `${BASE_URL}/api`;

// ─── Auth token cache ──────────────────────────────────────────────────────
// Lê o token do localStorage de forma síncrona na primeira linha para que
// o PRIMEIRO request de cada página não precise aguardar getSession().
// onAuthStateChange mantém o cache sempre atualizado.
const _SUPA_KEY = (() => {
  try {
    const ref = supabase.supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    return ref ? `sb-${ref}-auth-token` : null;
  } catch { return null; }
})();

function _readTokenSync() {
  try {
    if (!_SUPA_KEY) return null;
    const raw = localStorage.getItem(_SUPA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.access_token || !parsed?.expires_at) return null;
    // rejeita tokens que expiram em menos de 60 s
    if (Date.now() / 1000 > parsed.expires_at - 60) return null;
    return parsed.access_token;
  } catch { return null; }
}

let _cachedToken = _readTokenSync();

supabase.auth.onAuthStateChange((_evt, session) => {
  _cachedToken = session?.access_token ?? null;
  if (!session) { _profileCache = null; _profileCacheTime = 0; }
});

// Warmup: dispara uma requisição leve ao backend assim que o módulo carrega
// para "acordar" o servidor Railway antes das páginas montarem.
if (_cachedToken) {
  fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${_cachedToken}` } }).catch(() => {});
}

async function getAuthHeader() {
  if (_cachedToken) return { Authorization: `Bearer ${_cachedToken}` };
  const { data: { session } } = await supabase.auth.getSession();
  _cachedToken = session?.access_token ?? null;
  return _cachedToken ? { Authorization: `Bearer ${_cachedToken}` } : {};
}

// ─── Profile cache ─────────────────────────────────────────────────────────
const PROFILE_TTL = 5 * 60 * 1000;
let _profileCache = null;
let _profileCacheTime = 0;

async function request(path, options = {}) {
  const authHeader = await getAuthHeader();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3334.');
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do servidor (status ${res.status}). O backend está rodando?`);
  }

  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
  return data;
}

export const api = {
  // Leads
  listarLeads: (filtros = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
    );
    return request(`/leads?${params}`);
  },
  buscarLead: (id) => request(`/leads/${id}`),
  criarLead: (dados) => request('/leads', { method: 'POST', body: dados }),
  atualizarLead: (id, dados) => request(`/leads/${id}`, { method: 'PUT', body: dados }),
  moverEtapa: (id, etapa_funil, motivo_descarte) =>
    request(`/leads/${id}/etapa`, { method: 'PATCH', body: { etapa_funil, motivo_descarte } }),
  snooze: (id, snooze_ate) =>
    request(`/leads/${id}/snooze`, { method: 'PATCH', body: { snooze_ate } }),
  excluirLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
  resumoStats: (periodo = 'total') => request(`/leads/stats/resumo?periodo=${periodo}`),
  evolucaoLeads: () => request('/leads/stats/evolucao'),
  motivosDescarte: () => request('/leads/motivos-descarte'),

  // Interações
  criarInteracao: (dados) => request('/interacoes', { method: 'POST', body: dados }),
  editarInteracao: (id, dados) => request(`/interacoes/${id}`, { method: 'PUT', body: dados }),
  excluirInteracao: (id) => request(`/interacoes/${id}`, { method: 'DELETE' }),

  // Cadência
  concluirCadencia: (id) => request(`/cadencia/${id}/concluir`, { method: 'PATCH' }),
  reabrirCadencia: (id) => request(`/cadencia/${id}/reabrir`, { method: 'PATCH' }),

  // Exportar
  exportarCSV: async () => {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BASE}/leads/export/csv`, { headers: authHeader });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-growsorcio-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Funil de etapas
  listarEtapas: () => request('/funil'),
  criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }),
  atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }),
  reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }),
  excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }),

  // Bulk actions
  bulkUpdate: (payload) => request('/leads/bulk-update', { method: 'POST', body: payload }),

  // Perfil do usuário
  getProfile: () => {
    if (_profileCache && Date.now() - _profileCacheTime < PROFILE_TTL) {
      return Promise.resolve(_profileCache);
    }
    return request('/profile').then((data) => {
      _profileCache = data;
      _profileCacheTime = Date.now();
      return data;
    });
  },
  updateProfile: (dados) => {
    _profileCache = null;
    _profileCacheTime = 0;
    return request('/profile', { method: 'PUT', body: dados });
  },

  // Assinatura / plano
  getSubscription: () => request('/billing/subscription'),
};
