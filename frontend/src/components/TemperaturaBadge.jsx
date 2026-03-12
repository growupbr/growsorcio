const CONFIG = {
  quente: {
    label: 'Quente',
    dot: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    border: 'rgba(239,68,68,0.25)',
  },
  morno: {
    label: 'Morno',
    dot: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    color: '#fbbf24',
    border: 'rgba(245,158,11,0.25)',
  },
  frio: {
    label: 'Frio',
    dot: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    color: '#60a5fa',
    border: 'rgba(59,130,246,0.25)',
  },
};

export default function TemperaturaBadge({ temperatura, small = false }) {
  const cfg = CONFIG[temperatura] || CONFIG.frio;

  if (small) {
    // dot 8px exato conforme guideline
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
