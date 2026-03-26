import NumberFlow from '@number-flow/react';

export default function MetricaCard({ label, valor, sub, destaque, icon: Icon, delta }) {
  // delta: number (percentage) or null/undefined
  const hasDelta = delta != null && isFinite(delta);
  const deltaPos = hasDelta && delta > 0;
  const deltaNeg = hasDelta && delta < 0;
  const deltaColor = deltaPos ? '#22c55e' : deltaNeg ? '#f87171' : '#71717a';
  const deltaLabel = hasDelta
    ? `${deltaPos ? '+' : ''}${delta}%`
    : null;

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-150 cursor-default"
      style={{
        background: destaque
          ? 'linear-gradient(135deg, rgba(255,69,0,0.12) 0%, #18181b 70%)'
          : '#18181b',
        border: `1px solid ${destaque ? 'rgba(255,69,0,0.32)' : '#3f3f46'}`,
      }}
    >
      {/* Label */}
      <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#a1a1aa', fontWeight: 600 }}
         className="uppercase mb-4">
        {label}
      </p>

      {/* Valor */}
      <NumberFlow
        value={typeof valor === 'number' ? valor : 0}
        className="tabular-nums leading-none"
        style={{ fontSize: 36, fontWeight: 800, color: destaque ? '#FF4500' : '#f4f4f5' }}
        format={{ useGrouping: false }}
        willChange
      />

      {/* Sub + Delta */}
      <div className="mt-2 flex items-center gap-2">
        {sub && (
          <p className="text-xs font-medium" style={{ color: '#a1a1aa' }}>{sub}</p>
        )}
        {deltaLabel && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
            style={{
              background: deltaPos ? 'rgba(34,197,94,0.12)' : deltaNeg ? 'rgba(248,113,113,0.12)' : 'rgba(113,113,122,0.12)',
              color: deltaColor,
            }}
          >
            {deltaLabel}
          </span>
        )}
      </div>

      {/* Ícone */}
      {Icon && (
        <div
          className="absolute top-5 right-5 p-2.5 rounded-lg"
          style={{
            background: destaque ? 'rgba(255,69,0,0.15)' : 'rgba(255,69,0,0.08)',
            color: '#FF4500',
          }}
        >
          <Icon />
        </div>
      )}

      {/* Glow sutil no destaque */}
      {destaque && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 40px rgba(255,69,0,0.04)' }}
        />
      )}
    </div>
  );
}
