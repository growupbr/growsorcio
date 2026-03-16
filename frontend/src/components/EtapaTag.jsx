import { FASE_MAP, FASE_STYLE } from '../constants/tokens';

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
