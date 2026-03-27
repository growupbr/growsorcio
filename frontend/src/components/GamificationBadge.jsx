import {
  Flame, CheckCircle, ShieldCheck, Target, Lightbulb,
  Zap, Gem, TrendingUp, Crown,
} from 'lucide-react';

// ─── Mock: substitua pelo valor real (via props, contexto ou hook) ─────────────
const MOCK_VOLUME = 12_500_000;

// ─── Escala de Níveis ─────────────────────────────────────────────────────────
const LEVELS = [
  {
    threshold:           1_000_000, name: 'Primeiro Milhão',
    color: '#cd7f32', glow: 'rgba(205,127,50,0.55)',    Icon: Flame,
  },
  {
    threshold:           5_000_000, name: 'Corretor Blessed',
    color: '#059669', glow: 'rgba(5,150,105,0.55)',     Icon: CheckCircle,
  },
  {
    threshold:          10_000_000, name: 'Elite de Vendas',
    color: '#3b82f6', glow: 'rgba(59,130,246,0.55)',    Icon: ShieldCheck,
  },
  {
    threshold:          25_000_000, name: 'Autoridade',
    color: '#94a3b8', glow: 'rgba(148,163,184,0.45)',   Icon: Target,
  },
  {
    threshold:          50_000_000, name: 'Estrategista',
    color: '#c9a227', glow: 'rgba(201,162,39,0.55)',    Icon: Lightbulb,
  },
  {
    threshold:         100_000_000, name: 'Grow BLACK',
    color: '#00e5ff', glow: 'rgba(0,229,255,0.65)',     Icon: Zap,
    neonBorder: true,
  },
  {
    threshold:         250_000_000, name: 'Multiplicador',
    color: '#f0f4ff', glow: 'rgba(240,244,255,0.4)',    Icon: Gem,
  },
  {
    threshold:         500_000_000, name: 'Dominador de Mercado',
    color: '#ef4444', glow: 'rgba(239,68,68,0.55)',     Icon: TrendingUp,
  },
  {
    threshold:       1_000_000_000, name: 'Legado Eterno',
    color: '#fbbf24', glow: 'rgba(251,191,36,0.6)',     Icon: Crown,
  },
];

// ─── Nível padrão (pré-primeiro milhão) ──────────────────────────────────────
const LEVEL_INICIANTE = {
  name: 'Iniciante',
  color: '#71717a',
  glow: 'rgba(113,113,122,0.4)',
  Icon: Flame,
  neonBorder: false,
};

// ─── Formatação compacta (R$ 12,5M / R$ 1,2B) ────────────────────────────────
function formatCompact(value) {
  if (value >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `R$ ${n % 1 === 0 ? n : n.toFixed(1).replace('.', ',')}B`;
  }
  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `R$ ${n % 1 === 0 ? n : n.toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    const n = value / 1_000;
    return `R$ ${n % 1 === 0 ? n : n.toFixed(1).replace('.', ',')}K`;
  }
  return `R$ ${value}`;
}

// ─── Lógica de nível/progresso ────────────────────────────────────────────────
function getLevelInfo(volume) {
  let currentIdx = -1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (volume >= LEVELS[i].threshold) currentIdx = i;
  }

  // Pré-primeiro nível
  if (currentIdx === -1) {
    const next = LEVELS[0];
    return {
      currentLevel: null,
      nextLevel: next,
      progress: (volume / next.threshold) * 100,
    };
  }

  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1] ?? null;

  // Nível máximo
  if (!next) {
    return { currentLevel: current, nextLevel: null, progress: 100 };
  }

  const range = next.threshold - current.threshold;
  const progress = ((volume - current.threshold) / range) * 100;

  return { currentLevel: current, nextLevel: next, progress };
}

// ─── Componente ───────────────────────────────────────────────────────────────
/**
 * GamificationBadge
 * Mostra o nível atual, o volume vendido e a próxima meta sempre visíveis.
 *
 * Props:
 *   volume {number} — faturamento total em reais (padrão: MOCK_VOLUME)
 */
export default function GamificationBadge({ volume = MOCK_VOLUME }) {
  const { currentLevel, nextLevel, progress } = getLevelInfo(volume);

  const level = currentLevel ?? LEVEL_INICIANTE;
  const { color, glow, neonBorder } = level;
  const LevelIcon = level.Icon;

  const nextColor = nextLevel?.color ?? color;
  const progressCapped = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="flex-shrink-0">
      {/* ── Badge principal ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-default select-none"
        style={{
          background: neonBorder
            ? 'linear-gradient(135deg, #06060f 0%, #0d0d1a 100%)'
            : 'rgba(18, 18, 21, 0.9)',
          border: neonBorder
            ? `1px solid ${color}`
            : '1px solid rgba(255,255,255,0.07)',
          boxShadow: neonBorder
            ? `0 0 18px ${glow}, 0 0 6px ${glow}, inset 0 0 24px rgba(0,229,255,0.03)`
            : '0 2px 10px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Ícone com drop-shadow glow */}
        <div
          className="flex-shrink-0"
          style={{ filter: `drop-shadow(0 0 5px ${glow})` }}
          aria-hidden="true"
        >
          <LevelIcon size={14} color={color} strokeWidth={2.5} />
        </div>

        {/* Coluna: linha 1 (nível + volume) / linha 2 (barra + próxima meta) */}
        <div className="flex flex-col gap-[6px]" style={{ minWidth: 180 }}>

          {/* Linha 1: nome do nível + volume vendido */}
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-[11px] font-semibold leading-none truncate"
              style={{ color }}
            >
              {level.name}
            </span>
            <span
              className="text-[11px] font-semibold leading-none tabular-nums flex-shrink-0"
              style={{ color: '#e4e4e7' }}
            >
              {formatCompact(volume)}
            </span>
          </div>

          {/* Linha 2: barra de progresso + próxima meta */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}
              role="progressbar"
              aria-valuenow={Math.round(progressCapped)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso para o próximo nível: ${Math.round(progressCapped)}%`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressCapped}%`,
                  background: `linear-gradient(90deg, ${color}99 0%, ${nextColor} 100%)`,
                  boxShadow: `0 0 5px ${nextColor}77`,
                  transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>

            {/* Próxima meta */}
            {nextLevel ? (
              <span
                className="text-[10px] leading-none whitespace-nowrap flex-shrink-0 tabular-nums"
                style={{ color: '#52525b' }}
              >
                → {formatCompact(nextLevel.threshold)}{' '}
                <span style={{ color: nextColor }}>{nextLevel.name}</span>
              </span>
            ) : (
              <span
                className="text-[10px] leading-none whitespace-nowrap flex-shrink-0"
                style={{ color: '#52525b' }}
              >
                Nível máximo
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
