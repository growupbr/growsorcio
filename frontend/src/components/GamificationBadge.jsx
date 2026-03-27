import { useState } from 'react';
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

// ─── Formatação monetária ─────────────────────────────────────────────────────
const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

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
      remaining: next.threshold - volume,
    };
  }

  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1] ?? null;

  // Nível máximo
  if (!next) {
    return { currentLevel: current, nextLevel: null, progress: 100, remaining: 0 };
  }

  const range = next.threshold - current.threshold;
  const progress = ((volume - current.threshold) / range) * 100;

  return {
    currentLevel: current,
    nextLevel: next,
    progress,
    remaining: next.threshold - volume,
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────
/**
 * GamificationBadge
 * Mostra o nível atual do usuário com base no volume total de vendas (R$),
 * barra de progresso para o próximo nível e tooltip com valor restante.
 *
 * Props:
 *   volume {number} — faturamento total em reais (padrão: MOCK_VOLUME)
 */
export default function GamificationBadge({ volume = MOCK_VOLUME }) {
  const [hovered, setHovered] = useState(false);

  const { currentLevel, nextLevel, progress, remaining } = getLevelInfo(volume);

  const level = currentLevel ?? LEVEL_INICIANTE;
  const { color, glow, neonBorder } = level;
  const LevelIcon = level.Icon;

  const nextColor = nextLevel?.color ?? color;
  const NextIcon = nextLevel?.Icon ?? LevelIcon;
  const progressCapped = Math.min(Math.max(progress, 0), 100);

  const tooltipText = nextLevel
    ? `Faltam ${formatBRL(remaining)} para ${nextLevel.name}`
    : 'Nível máximo atingido!';

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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

        {/* Coluna: nome + barra */}
        <div className="flex flex-col gap-[5px]" style={{ minWidth: 132 }}>
          {/* Nome + porcentagem */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[11px] font-semibold leading-none truncate"
              style={{ color }}
            >
              {level.name}
            </span>
            <span
              className="text-[10px] leading-none tabular-nums flex-shrink-0"
              style={{ color: '#52525b' }}
            >
              {progressCapped.toFixed(0)}%
            </span>
          </div>

          {/* Barra de progresso */}
          <div
            className="w-full rounded-full overflow-hidden"
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
        </div>
      </div>

      {/* ── Tooltip ──────────────────────────────────────────────────────────── */}
      <div
        className="absolute right-0 top-full mt-2.5 z-50 pointer-events-none"
        role="tooltip"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0px)' : 'translateY(-4px)',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
      >
        {/* Seta */}
        <div
          className="absolute right-4 -top-[5px] w-2.5 h-2.5 rotate-45"
          style={{
            background: '#111117',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-hidden="true"
        />
        {/* Caixa */}
        <div
          className="rounded-xl px-3.5 py-2.5 whitespace-nowrap"
          style={{
            background: '#111117',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{ filter: `drop-shadow(0 0 3px ${nextColor}99)` }}
              aria-hidden="true"
            >
              <NextIcon size={11} color={nextColor} strokeWidth={2.5} />
            </div>
            <span
              className="text-[11px] font-medium"
              style={{ color: '#d4d4d8' }}
            >
              {tooltipText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
