import { useState, useEffect, useCallback } from 'react';
import { useFaturamento } from '../hooks/useFaturamento';

// ─── Configuração dos Níveis ──────────────────────────────────────────────────
// Editar aqui para ajustar nomes, faixas e visuais sem alterar a lógica do componente.
const LEVELS = [
  // ── Pré-nível: Iniciando Jornada ─────────────────────────────────────────
  {
    id: 0,
    nome: 'Iniciando Jornada',
    min: 0,
    max: 999_999,
    cor: '#71717a',
    corGlow: 'rgba(113,113,122,0.35)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="13" fill="#18181b" stroke="#52525b" strokeWidth="1.2" />
        {/* Foguete */}
        <path d="M14 5 C14 5 10 9 10 14 L14 17 L18 14 C18 9 14 5 14 5Z" fill="#71717a" opacity="0.85" />
        <path d="M11.5 15 L10 19 L14 17Z" fill="#52525b" />
        <path d="M16.5 15 L18 19 L14 17Z" fill="#52525b" />
        <circle cx="14" cy="12" r="1.8" fill="#a1a1aa" />
        {/* Chama de saída */}
        <path d="M12.5 17.5 Q14 20.5 15.5 17.5" fill="#FF4500" opacity="0.7" />
      </svg>
    ),
  },

  // ── Nível 1: Primeiro Milhão ─────────────────────────────────────────────
  {
    id: 1,
    nome: 'Primeiro Milhão',
    min: 1_000_000,
    max: 4_999_999,
    cor: '#CD7F32',
    corGlow: 'rgba(205,127,50,0.55)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="bronze-g" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#e8a95c" />
            <stop offset="55%" stopColor="#CD7F32" />
            <stop offset="100%" stopColor="#92400E" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#1a0e00" stroke="#CD7F32" strokeWidth="1.4" />
        <circle cx="14" cy="14" r="9" fill="url(#bronze-g)" />
        <circle cx="14" cy="14" r="9" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
        {/* "1M" */}
        <text x="14" y="17.5" textAnchor="middle" fill="#1a0e00" fontSize="7" fontWeight="800" fontFamily="sans-serif" letterSpacing="-0.5">1M</text>
        {/* Brilho */}
        <ellipse cx="11" cy="10" rx="2.5" ry="1.2" fill="#ffffff" opacity="0.18" transform="rotate(-30 11 10)" />
      </svg>
    ),
  },

  // ── Nível 2: Corretor Blessed ────────────────────────────────────────────
  {
    id: 2,
    nome: 'Corretor Blessed',
    min: 5_000_000,
    max: 9_999_999,
    cor: '#22C55E',
    corGlow: 'rgba(34,197,94,0.55)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="verde-g" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="60%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#001a0a" stroke="#22C55E" strokeWidth="1.4" />
        {/* Hexágono gema */}
        <polygon points="14,5.5 20,9.25 20,16.75 14,20.5 8,16.75 8,9.25" fill="url(#verde-g)" stroke="#16a34a" strokeWidth="0.6" />
        {/* Faceta superior */}
        <polygon points="14,5.5 20,9.25 14,10.5 8,9.25" fill="#4ade80" opacity="0.35" />
        {/* Faceta inferior */}
        <polygon points="8,16.75 20,16.75 14,10.5" fill="#14532d" opacity="0.5" />
        {/* "B" de Blessed */}
        <text x="14" y="17" textAnchor="middle" fill="#dcfce7" fontSize="7" fontWeight="800" fontFamily="sans-serif">B</text>
        <ellipse cx="11" cy="8.5" rx="2" ry="0.9" fill="#ffffff" opacity="0.2" transform="rotate(-20 11 8.5)" />
      </svg>
    ),
  },

  // ── Nível 3: Elite de Vendas ─────────────────────────────────────────────
  {
    id: 3,
    nome: 'Elite de Vendas',
    min: 10_000_000,
    max: 24_999_999,
    cor: '#3B82F6',
    corGlow: 'rgba(59,130,246,0.60)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="azul-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#00081f" stroke="#3B82F6" strokeWidth="1.4" />
        {/* Escudo */}
        <path d="M14 5 L21 8 L21 15 C21 19.5 14 23 14 23 C14 23 7 19.5 7 15 L7 8 Z" fill="url(#azul-g)" stroke="#1D4ED8" strokeWidth="0.5" />
        {/* Faceta topo */}
        <path d="M14 5 L21 8 L14 10 L7 8 Z" fill="#93c5fd" opacity="0.3" />
        {/* Estrela central */}
        <polygon points="14,10 15,13 18,13 15.5,14.8 16.5,17.8 14,16 11.5,17.8 12.5,14.8 10,13 13,13" fill="#dbeafe" opacity="0.9" />
      </svg>
    ),
  },

  // ── Nível 4: Autoridade ──────────────────────────────────────────────────
  {
    id: 4,
    nome: 'Autoridade',
    min: 25_000_000,
    max: 49_999_999,
    cor: '#94A3B8',
    corGlow: 'rgba(148,163,184,0.50)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="prata-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="40%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#0f172a" stroke="#94A3B8" strokeWidth="1.4" />
        <circle cx="14" cy="14" r="9" fill="url(#prata-g)" />
        {/* Linhas de escovado */}
        <line x1="5.5" y1="10" x2="22.5" y2="10" stroke="#e2e8f0" strokeWidth="0.4" opacity="0.25" />
        <line x1="5.5" y1="12" x2="22.5" y2="12" stroke="#e2e8f0" strokeWidth="0.4" opacity="0.25" />
        <line x1="5.5" y1="14" x2="22.5" y2="14" stroke="#e2e8f0" strokeWidth="0.4" opacity="0.25" />
        <line x1="5.5" y1="16" x2="22.5" y2="16" stroke="#e2e8f0" strokeWidth="0.4" opacity="0.25" />
        <line x1="5.5" y1="18" x2="22.5" y2="18" stroke="#e2e8f0" strokeWidth="0.4" opacity="0.25" />
        {/* Fita */}
        <path d="M10 6 L14 4 L18 6 L16 8 L14 7 L12 8 Z" fill="#94A3B8" stroke="#e2e8f0" strokeWidth="0.4" />
        <text x="14" y="17.5" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="800" fontFamily="sans-serif">AU</text>
        <ellipse cx="11" cy="11" rx="2.5" ry="1.1" fill="#ffffff" opacity="0.22" transform="rotate(-30 11 11)" />
      </svg>
    ),
  },

  // ── Nível 5: Estrategista ────────────────────────────────────────────────
  {
    id: 5,
    nome: 'Estrategista',
    min: 50_000_000,
    max: 99_999_999,
    cor: '#D97706',
    corGlow: 'rgba(180,83,9,0.55)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="ouro-g" cx="38%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#1a0d00" stroke="#D97706" strokeWidth="1.4" />
        <circle cx="14" cy="14" r="9" fill="url(#ouro-g)" />
        {/* Fosco — sem brilho especular excessivo */}
        <circle cx="14" cy="14" r="9" fill="#78350f" opacity="0.1" />
        {/* Fita */}
        <path d="M10 6 L14 4.5 L18 6 L16 8.5 L14 7.5 L12 8.5 Z" fill="#D97706" stroke="#fde68a" strokeWidth="0.4" />
        <text x="14" y="17.5" textAnchor="middle" fill="#1a0d00" fontSize="6" fontWeight="800" fontFamily="sans-serif">50M</text>
        <ellipse cx="11" cy="10.5" rx="2.2" ry="1" fill="#fef3c7" opacity="0.15" transform="rotate(-25 11 10.5)" />
      </svg>
    ),
  },

  // ── Nível 6: Grow BLACK ──────────────────────────────────────────────────
  {
    id: 6,
    nome: 'Grow BLACK',
    min: 100_000_000,
    max: 249_999_999,
    cor: '#FF4500',
    corGlow: 'rgba(255,69,0,0.70)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="black-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4500" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="url(#black-glow)" />
        <circle cx="14" cy="14" r="13" fill="#09090B" stroke="#FF4500" strokeWidth="1.8" />
        {/* Cristal */}
        <polygon points="14,5 21,12 14,22 7,12" fill="#09090B" stroke="#FF4500" strokeWidth="0.8" strokeLinejoin="round" />
        <polygon points="14,5 21,12 14,14" fill="#FF4500" opacity="0.25" />
        <polygon points="7,12 21,12 14,22" fill="#FF4500" opacity="0.10" />
        {/* Neon lines */}
        <line x1="14" y1="5" x2="7" y2="12" stroke="#FF4500" strokeWidth="0.6" opacity="0.8" />
        <line x1="14" y1="5" x2="21" y2="12" stroke="#FF4500" strokeWidth="0.6" opacity="0.8" />
        <line x1="7" y1="12" x2="21" y2="12" stroke="#FF4500" strokeWidth="0.6" opacity="0.6" />
        <text x="14" y="13.5" textAnchor="middle" fill="#FF4500" fontSize="4.5" fontWeight="800" fontFamily="sans-serif" opacity="0.9">BLACK</text>
      </svg>
    ),
  },

  // ── Nível 7: Multiplicador ───────────────────────────────────────────────
  {
    id: 7,
    nome: 'Multiplicador',
    min: 250_000_000,
    max: 499_999_999,
    cor: '#E2E8F0',
    corGlow: 'rgba(226,232,240,0.55)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="diamante-mult" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="40%" stopColor="#E2E8F0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#64748b" stopOpacity="0.85" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#05060a" stroke="#94a3b8" strokeWidth="1" />
        {/* Diamante */}
        <polygon points="14,4 22,11 14,24 6,11" fill="url(#diamante-mult)" stroke="#e2e8f0" strokeWidth="0.7" strokeLinejoin="round" />
        {/* Facetas */}
        <polygon points="14,4 22,11 18,11 14,7" fill="#ffffff" opacity="0.4" />
        <polygon points="14,4 10,11 6,11 14,7" fill="#ffffff" opacity="0.15" />
        <polygon points="6,11 22,11 14,24" fill="#475569" opacity="0.3" />
        <line x1="6" y1="11" x2="22" y2="11" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
        <line x1="14" y1="4" x2="14" y2="24" stroke="#ffffff" strokeWidth="0.3" opacity="0.2" />
        {/* Brilho especular */}
        <ellipse cx="11" cy="8.5" rx="2.2" ry="1" fill="#ffffff" opacity="0.6" transform="rotate(-30 11 8.5)" />
        <circle cx="16.5" cy="7" r="0.7" fill="#ffffff" opacity="0.8" />
      </svg>
    ),
  },

  // ── Nível 8: Dominador de Mercado ────────────────────────────────────────
  {
    id: 8,
    nome: 'Dominador de Mercado',
    min: 500_000_000,
    max: 999_999_999,
    cor: '#DC2626',
    corGlow: 'rgba(220,38,38,0.65)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="chama-g" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="40%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#1a0000" stroke="#DC2626" strokeWidth="1.4" />
        {/* Chama externa */}
        <path d="M14 23 C9 21 6 17 7 12 C8 8 11 6 11 6 C10 10 12 11 12 11 C12 8 13 5.5 14 4 C15 5.5 16 8 16 11 C16 11 18 10 17 6 C17 6 20 8 21 12 C22 17 19 21 14 23Z" fill="url(#chama-g)" />
        {/* Chama interna */}
        <path d="M14 20 C11 18.5 9.5 16 10 13 C10.5 11 12 10 12 10 C11.5 12.5 13 13.5 13 13.5 C13 12 13.5 10.5 14 9.5 C14.5 10.5 15 12 15 13.5 C15 13.5 16.5 12.5 16 10 C16 10 17.5 11 18 13 C18.5 16 17 18.5 14 20Z" fill="#fbbf24" opacity="0.7" />
        <circle cx="14" cy="15" r="2" fill="#fef3c7" opacity="0.5" />
      </svg>
    ),
  },

  // ── Nível 9: Legado Eterno ───────────────────────────────────────────────
  {
    id: 9,
    nome: 'Legado Eterno',
    min: 1_000_000_000,
    max: Infinity,
    cor: '#FFD700',
    corGlow: 'rgba(255,215,0,0.70)',
    badge: ({ size = 28 }) => (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="coroa-g" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
          <style>{`
            @keyframes gs-blink {
              0%,100%{opacity:0.9} 50%{opacity:0.3}
            }
            .gs-p1{animation:gs-blink 1.6s ease-in-out infinite}
            .gs-p2{animation:gs-blink 1.6s ease-in-out 0.55s infinite}
            .gs-p3{animation:gs-blink 1.6s ease-in-out 1.1s infinite}
          `}</style>
        </defs>
        <circle cx="14" cy="14" r="13" fill="#1a0f00" stroke="#FFD700" strokeWidth="1.6" />
        {/* Coroa */}
        <path d="M6 18 L6 11 L10 15 L14 7 L18 15 L22 11 L22 18 Z" fill="url(#coroa-g)" stroke="#92400e" strokeWidth="0.5" strokeLinejoin="round" />
        {/* Base da coroa */}
        <rect x="6" y="17.5" width="16" height="3" rx="1" fill="#FFD700" stroke="#92400e" strokeWidth="0.4" />
        {/* Gemas na coroa */}
        <circle cx="10" cy="15" r="1.2" fill="#DC2626" />
        <circle cx="14" cy="7" r="1.2" fill="#3B82F6" />
        <circle cx="18" cy="15" r="1.2" fill="#22C55E" />
        {/* Partículas animadas */}
        <circle className="gs-p1" cx="4" cy="9" r="0.9" fill="#FFD700" />
        <circle className="gs-p2" cx="24" cy="7" r="0.7" fill="#FFD700" />
        <circle className="gs-p3" cx="14" cy="3" r="0.8" fill="#fef08a" />
        <circle className="gs-p1" cx="23" cy="19" r="0.6" fill="#FFD700" opacity="0.8" />
        <circle className="gs-p2" cx="5" cy="21" r="0.6" fill="#fef08a" opacity="0.8" />
        <circle className="gs-p3" cx="20" cy="3.5" r="0.5" fill="#FFD700" />
      </svg>
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

function getLevelInfo(faturamento) {
  let nivelAtualIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (faturamento >= LEVELS[i].min) nivelAtualIdx = i;
  }

  const nivelAtual = LEVELS[nivelAtualIdx];
  const proximo = LEVELS[nivelAtualIdx + 1] ?? null;

  let progresso = 100;
  if (proximo) {
    const faixaTotal = nivelAtual.max - nivelAtual.min + 1;
    const progressoNaFaixa = faturamento - nivelAtual.min;
    progresso = Math.min(100, Math.max(0, (progressoNaFaixa / faixaTotal) * 100));
  }

  return { nivelAtual, nivelAtualIdx, proximo, progresso };
}

// ─── Modal de Níveis ──────────────────────────────────────────────────────────

function LevelModal({ nivelAtualIdx, faturamento, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Níveis da Plataforma"
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 leading-tight">
              Níveis da Plataforma
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Baseado no total acumulado de cartas fechadas
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Fechar"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Lista de níveis */}
        <ul className="px-3 pb-5 flex flex-col gap-1.5">
          {LEVELS.map((level, idx) => {
            const isCurrent = idx === nivelAtualIdx;
            const isConquistado = faturamento >= level.min;
            const BadgeIcon = level.badge;

            return (
              <li
                key={level.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-opacity"
                style={{
                  background: isCurrent ? 'rgba(255,69,0,0.06)' : 'rgba(255,255,255,0.02)',
                  border: isCurrent ? '1px solid #FF4500' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isConquistado ? 1 : 0.4,
                }}
              >
                <div className="flex-shrink-0">
                  <BadgeIcon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[12px] font-semibold leading-none truncate"
                      style={{ color: level.cor }}
                    >
                      {level.nome}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                        style={{ background: '#FF4500', color: '#fff' }}
                      >
                        Você está aqui
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    {level.max === Infinity
                      ? `${formatCompact(level.min)}+`
                      : `${formatCompact(level.min)} — ${formatCompact(level.max)}`}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─── Gadget Principal ─────────────────────────────────────────────────────────

/**
 * GamificationBadge
 * Exibe o nível de faturamento acumulado do corretor com insígnia, progresso e popup.
 * Busca o faturamento automaticamente via useFaturamento (sem props necessárias).
 */
export default function GamificationBadge() {
  const { faturamento, loading } = useFaturamento();
  const [modalAberto, setModalAberto] = useState(false);

  const handleClose = useCallback(() => setModalAberto(false), []);

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="w-7 h-7 rounded-full bg-zinc-800 animate-pulse" />
        <div className="flex flex-col gap-1.5" style={{ minWidth: 140 }}>
          <div className="h-2.5 w-20 rounded bg-zinc-800 animate-pulse" />
          <div className="h-1 w-full rounded-full bg-zinc-800 animate-pulse" />
          <div className="h-2 w-24 rounded bg-zinc-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const { nivelAtual, nivelAtualIdx, proximo, progresso } = getLevelInfo(faturamento);
  const BadgeIcon = nivelAtual.badge;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl select-none cursor-pointer transition-all hover:bg-white/5 active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        aria-label={`Nível ${nivelAtual.nome} — Ver todos os níveis`}
        title="Clique para ver os níveis da plataforma"
      >
        {/* Insígnia */}
        <div className="flex-shrink-0">
          <BadgeIcon size={28} />
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col gap-[5px]" style={{ minWidth: 155 }}>

          {/* Linha 1: nome do nível + valor */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[11px] font-semibold leading-none truncate"
              style={{ color: nivelAtual.cor }}
            >
              {nivelAtual.nome}
            </span>
            <span className="text-[11px] font-semibold leading-none tabular-nums flex-shrink-0 text-zinc-300">
              {formatCompact(faturamento)}
            </span>
          </div>

          {/* Linha 2: barra de progresso ou nível máximo */}
          {proximo ? (
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}
              role="progressbar"
              aria-valuenow={Math.round(progresso)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progresso}%`,
                  background: '#FF4500',
                  transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            </div>
          ) : (
            <div className="text-[10px] text-amber-400 font-medium leading-none">
              🏆 Nível máximo atingido
            </div>
          )}

          {/* Linha 3: progresso textual */}
          {proximo && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] tabular-nums font-medium leading-none text-zinc-600">
                {Math.round(progresso)}%
              </span>
              <span className="text-[10px] leading-none whitespace-nowrap flex-shrink-0 tabular-nums text-zinc-600">
                falta{' '}
                <span style={{ color: proximo.cor }}>
                  {formatCompact(proximo.min - faturamento)}
                </span>{' '}
                p/ {proximo.nome}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Modal */}
      {modalAberto && (
        <LevelModal
          nivelAtualIdx={nivelAtualIdx}
          faturamento={faturamento}
          onClose={handleClose}
        />
      )}
    </>
  );
}
