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
      className="rounded-2xl p-5 relative overflow-hidden cursor-default"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Label */}
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: '#71717a', fontWeight: 600 }}
         className="uppercase mb-3 pr-8 leading-snug tracking-wider">
        {label}
      </p>

      {/* Valor */}
      <NumberFlow
        value={typeof valor === 'number' ? valor : 0}
        className="tabular-nums leading-none"
        style={{ fontSize: 24, fontWeight: 700, color: destaque ? '#FF4500' : '#f4f4f5' }}
        format={{ useGrouping: false }}
        willChange
      />

      {/* Sub + Delta */}
      <div className="mt-2 flex items-center gap-2">
        {sub && (
          <p className="text-xs" style={{ color: '#71717a' }}>{sub}</p>
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
          className="absolute top-4 right-4 p-2 rounded-lg flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: destaque ? '#FF4500' : '#52525b',
          }}
        >
          <Icon />
        </div>
      )}
    </div>
  );
}
