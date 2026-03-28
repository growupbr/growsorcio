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

// ─── GET cache + inflight dedupe ──────────────────────────────────────────
const _getCache = new Map();
const _inflight = new Map();

function _buildCacheKey(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') return null;
  return `${method}:${path}`;
}

function _invalidate(prefixes = []) {
  if (!prefixes.length) return;
  for (const key of Array.from(_getCache.keys())) {
    if (prefixes.some((p) => key.includes(`:${p}`))) _getCache.delete(key);
  }
  for (const key of Array.from(_inflight.keys())) {
    if (prefixes.some((p) => key.includes(`:${p}`))) _inflight.delete(key);
  }
}

async function request(path, options = {}) {
  const cacheTTL = options.cacheTTL ?? 0;
  const cacheKey = options.cacheKey || _buildCacheKey(path, options);

  if (cacheKey && cacheTTL > 0) {
    const cached = _getCache.get(cacheKey);
    if (cached && Date.now() - cached.time < cacheTTL) {
      return cached.data;
    }
    const inflight = _inflight.get(cacheKey);
    if (inflight) return inflight;
  }

  const doFetch = async () => {
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

    if (cacheKey && cacheTTL > 0) {
      _getCache.set(cacheKey, { data, time: Date.now() });
    }

  return data;
  };

  const promise = doFetch().finally(() => {
    if (cacheKey) _inflight.delete(cacheKey);
  });

  if (cacheKey && cacheTTL > 0) {
    _inflight.set(cacheKey, promise);
  }

  return promise;
}

export const api = {
  // Leads
  listarLeads: (filtros = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
    );
    return request(`/leads?${params}`, { cacheTTL: 30 * 1000 });
  },
  buscarLead: (id) => request(`/leads/${id}`, { cacheTTL: 30 * 1000 }),
  criarLead: (dados) => request('/leads', { method: 'POST', body: dados }).then((data) => {
    _invalidate(['/leads', '/leads/stats']);
    return data;
  }),
  atualizarLead: (id, dados) => request(`/leads/${id}`, { method: 'PUT', body: dados }).then((data) => {
    _invalidate(['/leads', '/leads/stats']);
    return data;
  }),
  moverEtapa: (id, etapa_funil, motivo_descarte) =>
    request(`/leads/${id}/etapa`, { method: 'PATCH', body: { etapa_funil, motivo_descarte } }).then((data) => {
      _invalidate(['/leads', '/leads/stats']);
      return data;
    }),
  snooze: (id, snooze_ate) =>
    request(`/leads/${id}/snooze`, { method: 'PATCH', body: { snooze_ate } }).then((data) => {
      _invalidate(['/leads']);
      return data;
    }),
  excluirLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }).then((data) => {
    _invalidate(['/leads', '/leads/stats']);
    return data;
  }),
  resumoStats: (periodo = 'total') => request(`/leads/stats/resumo?periodo=${periodo}`, { cacheTTL: 2 * 60 * 1000 }),
  evolucaoLeads: () => request('/leads/stats/evolucao', { cacheTTL: 5 * 60 * 1000 }),
  faturamentoAcumulado: () => request('/leads/stats/faturamento', { cacheTTL: 5 * 60 * 1000 }),
  motivosDescarte: () => request('/leads/motivos-descarte'),

  // Interações
  criarInteracao: (dados) => request('/interacoes', { method: 'POST', body: dados }),
  editarInteracao: (id, dados) => request(`/interacoes/${id}`, { method: 'PUT', body: dados }),
  excluirInteracao: (id) => request(`/interacoes/${id}`, { method: 'DELETE' }),

  // Cadência
  listarCadenciaPendentes: (lead_id) => {
    const qs = lead_id ? `?lead_id=${lead_id}` : '';
    return request(`/cadencia/pendentes${qs}`, { cacheTTL: 0 });
  },
  concluirCadencia: (id) => request(`/cadencia/${id}/concluir`, { method: 'PATCH' }).then((data) => {
    _invalidate(['/cadencia']);
    return data;
  }),
  reabrirCadencia: (id) => request(`/cadencia/${id}/reabrir`, { method: 'PATCH' }).then((data) => {
    _invalidate(['/cadencia']);
    return data;
  }),

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
  listarEtapas: () => request('/funil', { cacheTTL: 60 * 1000 }),
  criarEtapa: (dados) => request('/funil', { method: 'POST', body: dados }).then((data) => {
    _invalidate(['/funil']);
    return data;
  }),
  atualizarEtapa: (id, dados) => request(`/funil/${id}`, { method: 'PUT', body: dados }).then((data) => {
    _invalidate(['/funil']);
    return data;
  }),
  reordenarEtapas: (items) => request('/funil/reorder', { method: 'PATCH', body: items }).then((data) => {
    _invalidate(['/funil']);
    return data;
  }),
  excluirEtapa: (id) => request(`/funil/${id}`, { method: 'DELETE' }).then((data) => {
    _invalidate(['/funil']);
    return data;
  }),

  // Bulk actions
  bulkUpdate: (payload) => request('/leads/bulk-update', { method: 'POST', body: payload }).then((data) => {
    _invalidate(['/leads', '/leads/stats']);
    return data;
  }),

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
  getSubscription: () => request('/billing/subscription', { cacheTTL: 60 * 1000 }),

  // Configurações da organização (closing_message, org_name)
  getOrgSettings: () => request('/funil/org-settings', { cacheTTL: 5 * 60 * 1000, cacheKey: 'GET:/funil/org-settings' }),
  updateOrgSettings: (dados) => request('/funil/org-settings', { method: 'PATCH', body: dados }).then((data) => {
    _invalidate(['/funil/org-settings']);
    return data;
  }),

  // Prefetch leve para melhorar troca entre páginas mais pesadas
  prefetchRouteData: (route) => {
    if (route === '/dashboard') {
      request('/leads/stats/resumo?periodo=total', { cacheTTL: 20 * 1000 }).catch(() => {});
      request('/leads/stats/evolucao', { cacheTTL: 20 * 1000 }).catch(() => {});
      return;
    }
    if (route === '/kanban') {
      request('/funil', { cacheTTL: 60 * 1000 }).catch(() => {});
      request('/leads?', { cacheTTL: 15 * 1000 }).catch(() => {});
    }
  },
};
