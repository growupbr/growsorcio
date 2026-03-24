import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3334');
const BASE = `${BASE_URL}/api`;

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

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
};
