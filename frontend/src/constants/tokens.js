// ─── Design Tokens — fonte única de verdade para cores de domínio ─────────────
// Importe daqui em vez de redefinir inline em cada componente.

export const FASE_STYLE = {
  entrada:     { background: 'rgba(99,102,241,0.10)',  color: '#818cf8', border: 'rgba(99,102,241,0.22)' },
  qualificacao:{ background: 'rgba(255,69,0,0.10)',    color: '#FF4500', border: 'rgba(255,69,0,0.22)'   },
  negociacao:  { background: 'rgba(245,158,11,0.10)',  color: '#f59e0b', border: 'rgba(245,158,11,0.22)' },
  credito:     { background: 'rgba(14,165,233,0.10)',  color: '#38bdf8', border: 'rgba(14,165,233,0.22)' },
  fechado:     { background: 'rgba(34,197,94,0.10)',   color: '#22c55e', border: 'rgba(34,197,94,0.22)'  },
  perdido:     { background: 'rgba(72,79,88,0.15)',    color: '#8B949E', border: 'rgba(72,79,88,0.30)'   },
};

export const TEMPERATURA_CONFIG = {
  quente: { label: 'Quente', dot: '#ef4444', bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)'   },
  morno:  { label: 'Morno',  dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.25)'  },
  frio:   { label: 'Frio',   dot: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)'  },
};

// Versão array para uso em filtros/pills
export const TEMPERATURAS = [
  { valor: 'quente', ...TEMPERATURA_CONFIG.quente, bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.40)'   },
  { valor: 'morno',  ...TEMPERATURA_CONFIG.morno,  bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.40)'  },
  { valor: 'frio',   ...TEMPERATURA_CONFIG.frio,   bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.40)'  },
];

export const ORIGENS = [
  { valor: 'prospeccao', label: 'Prospecção', color: '#FF4500', bg: 'rgba(255,69,0,0.15)',    border: 'rgba(255,69,0,0.40)'    },
  { valor: 'anuncio',    label: 'Anúncio',    color: '#a78bfa', bg: 'rgba(124,58,237,0.15)',  border: 'rgba(124,58,237,0.40)'  },
];

export const ETAPAS = [
  'Lead Novo', 'Tentativa de Contato', 'Em Qualificação',
  'Reunião Agendada', 'Reunião Realizada', 'Simulação Enviada',
  'Follow-up / Negociação', 'Análise de Crédito / Docs',
  'Fechado (Ganho)', 'Descartado (Perda)',
];

export const FASE_MAP = {
  'Lead Novo':                 'entrada',
  'Tentativa de Contato':      'entrada',
  'Em Qualificação':           'qualificacao',
  'Reunião Agendada':          'qualificacao',
  'Reunião Realizada':         'negociacao',
  'Simulação Enviada':         'negociacao',
  'Follow-up / Negociação':    'negociacao',
  'Análise de Crédito / Docs': 'credito',
  'Fechado (Ganho)':           'fechado',
  'Descartado (Perda)':        'perdido',
};
