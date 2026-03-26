import NumberFlow from '@number-flow/react';

export default function OrigemCard({ label, valor, sub, cor, icon: Icon }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-150 cursor-default"
      style={{ background: '#18181b', border: '1px solid #3f3f46' }}
    >
      <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#a1a1aa', fontWeight: 600 }}
         className="uppercase mb-4">
        {label}
      </p>
      <NumberFlow
        value={typeof valor === 'number' ? valor : 0}
        className="tabular-nums leading-none"
        style={{ fontSize: 30, fontWeight: 800, color: cor }}
        format={{ useGrouping: false }}
        willChange
      />
      {sub && (
        <p className="mt-2 text-xs font-medium" style={{ color: '#a1a1aa' }}>{sub}</p>
      )}
      {Icon && (
        <div
          className="absolute top-5 right-5 p-2.5 rounded-lg"
          style={{ background: `${cor}14`, color: cor }}
        >
          <Icon />
        </div>
      )}
    </div>
  );
}
