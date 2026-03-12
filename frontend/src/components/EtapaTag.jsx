const FASE_MAP = {
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

const FASE_STYLE = {
  entrada:     { background: 'rgba(99,102,241,0.10)',  color: '#818cf8', border: 'rgba(99,102,241,0.22)' },
  qualificacao:{ background: 'rgba(255,69,0,0.10)',    color: '#FF4500', border: 'rgba(255,69,0,0.22)' },
  negociacao:  { background: 'rgba(245,158,11,0.10)',  color: '#f59e0b', border: 'rgba(245,158,11,0.22)' },
  credito:     { background: 'rgba(14,165,233,0.10)',  color: '#38bdf8', border: 'rgba(14,165,233,0.22)' },
  fechado:     { background: 'rgba(34,197,94,0.10)',   color: '#22c55e', border: 'rgba(34,197,94,0.22)' },
  perdido:     { background: 'rgba(72,79,88,0.15)',    color: '#8B949E', border: 'rgba(72,79,88,0.30)' },
};

export default function EtapaTag({ etapa }) {
  const fase  = FASE_MAP[etapa] || 'entrada';
  const style = FASE_STYLE[fase];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {etapa}
    </span>
  );
}
