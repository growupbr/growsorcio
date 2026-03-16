import { TEMPERATURA_CONFIG } from '../constants/tokens';

export default function TemperaturaBadge({ temperatura, small = false }) {
  const cfg = TEMPERATURA_CONFIG[temperatura] || TEMPERATURA_CONFIG.frio;

  if (small) {
    return (
      <span
        className="inline-block rounded-full flex-shrink-0 mt-0.5"
        style={{ width: 8, height: 8, background: cfg.dot, minWidth: 8 }}
        title={cfg.label}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}
