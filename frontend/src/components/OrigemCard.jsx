import NumberFlow from '@number-flow/react';

export default function OrigemCard({ label, valor, sub, cor, icon: Icon }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden cursor-default"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: '#71717a', fontWeight: 600 }}
         className="uppercase mb-3 tracking-wider">
        {label}
      </p>
      <NumberFlow
        value={typeof valor === 'number' ? valor : 0}
        className="tabular-nums leading-none"
        style={{ fontSize: 24, fontWeight: 700, color: cor }}
        format={{ useGrouping: false }}
        willChange
      />
      {sub && (
        <p className="mt-2 text-xs" style={{ color: '#71717a' }}>{sub}</p>
      )}
      {Icon && (
        <div
          className="absolute top-5 right-5 p-2.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#52525b' }}
        >
          <Icon />
        </div>
      )}
    </div>
  );
}
