const FASE_MAP = {
  'Analisar Perfil':    'captacao',
  'Seguiu Perfil':      'captacao',
  'Abordagem Enviada':  'captacao',
  'Respondeu':          'captacao',
  'Em Desenvolvimento': 'captacao',
  'Follow-up Ativo':    'captacao',
  'Lead Capturado':     'captacao',
  'Reunião Agendada':   'captacao',
  'Reunião Realizada':  'captacao',
  'Proposta Enviada':   'comercial',
  'Follow-up Proposta': 'comercial',
  'Fechado':            'fechado',
  'Perdido':            'perdido',
};

const FASE_STYLE = {
  captacao:  { background: 'rgba(255,69,0,0.10)',         color: '#FF4500',  border: 'rgba(255,69,0,0.22)' },
  comercial: { background: 'rgba(245,158,11,0.10)',        color: '#f59e0b',  border: 'rgba(245,158,11,0.22)' },
  fechado:   { background: 'rgba(34,197,94,0.10)',         color: '#22c55e',  border: 'rgba(34,197,94,0.22)' },
  perdido:   { background: 'rgba(72,79,88,0.15)',          color: '#8B949E',  border: 'rgba(72,79,88,0.30)' },
};

export default function EtapaTag({ etapa }) {
  const fase  = FASE_MAP[etapa] || 'captacao';
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
