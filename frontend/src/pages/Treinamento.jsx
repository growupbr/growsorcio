import { Play, CheckCircle, Lock } from 'lucide-react';

// ─── Asset Imports ────────────────────────────────────────────────────────────
import capaTec    from '../assets/capa-tec.webp';
import modulo1    from '../assets/modulo-1.webp';
import modulo2    from '../assets/modulo-2.webp';
import modulo3    from '../assets/modulo-3.webp';
import modulo4    from '../assets/modulo-4.webp';
import modulo5    from '../assets/modulo-5-tec.webp';

// ─── Data ─────────────────────────────────────────────────────────────────────
const modulos = [
  { id: 1, imagem: modulo1, status: 'concluido'    },
  { id: 2, imagem: modulo2, status: 'em_andamento' },
  { id: 3, imagem: modulo3, status: 'bloqueado'    },
  { id: 4, imagem: modulo4, status: 'bloqueado'    },
  { id: 5, imagem: modulo5, status: 'bloqueado'    },
];

const PROGRESSO = 15; // %

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === 'concluido') {
    return (
      <div className="absolute top-2.5 right-2.5 bg-zinc-900/80 backdrop-blur-sm p-1 rounded-md">
        <CheckCircle size={16} className="text-emerald-400" />
      </div>
    );
  }
  if (status === 'bloqueado') {
    return (
      <div className="absolute top-2.5 right-2.5 bg-zinc-900/80 backdrop-blur-sm p-1 rounded-md">
        <Lock size={16} className="text-zinc-500" />
      </div>
    );
  }
  return null; // em_andamento → sem badge (card ativo)
}

function ModuloCard({ modulo }) {
  const isBloqueado = modulo.status === 'bloqueado';

  return (
    <div
      className={[
        // aspect-[768/1376] = proporção exata das imagens dos módulos
        'aspect-[768/1376] relative rounded-xl overflow-hidden',
        'border border-white/5 cursor-pointer group',
        'transition-all duration-300',
        'hover:border-orange-500/50',
        isBloqueado ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Thumbnail — object-cover garante que a imagem preenche sem distorção */}
      <img
        src={modulo.imagem}
        alt={`Módulo ${modulo.id}`}
        loading="lazy"
        decoding="async"
        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
      />

      {/* Overlay de tap/hover com Play — visível em hover (desktop) ou sempre em mobile via active */}
      {!isBloqueado && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-500/90 shadow-lg shadow-orange-500/30">
            <Play size={20} fill="white" className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* Status badge */}
      <StatusBadge status={modulo.status} />

      {/* Ring laranja no módulo em andamento */}
      {modulo.status === 'em_andamento' && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-orange-500/60 pointer-events-none" />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Treinamento() {
  return (
    <div className="min-h-full bg-zinc-950 px-4 py-6 sm:px-6 sm:py-8 md:px-10">

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      {/* Mobile: altura menor (45vw min 220px); Desktop: 40vh min 350px */}
      <div className="relative w-full h-[45vw] min-h-[220px] sm:h-[40vh] sm:min-h-[300px] md:min-h-[350px] rounded-xl sm:rounded-2xl overflow-hidden mb-8 sm:mb-12">

        {/* Background image */}
        <img
          src={capaTec}
          alt="Missão TEC 2.0"
          className="object-cover w-full h-full object-center"
        />

        {/* Gradiente base (baixo → cima) */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        {/* Gradiente lateral (esquerda → direita) — mais sutil em mobile */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/30 to-transparent" />

        {/* Conteúdo sobre o gradiente */}
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-sm">

          {/* Label progresso */}
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Progresso da Missão
          </p>

          {/* Barra de progresso */}
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex-1 h-1 sm:h-1.5 bg-zinc-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${PROGRESSO}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-bold text-orange-400 tabular-nums">
              {PROGRESSO}%
            </span>
          </div>

          {/* CTA — toque mínimo 44px (py-3) */}
          <button
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 text-sm sm:text-base"
            aria-label="Continuar Missão TEC 2.0"
          >
            <Play size={16} fill="white" className="text-white sm:hidden" />
            <Play size={18} fill="white" className="text-white hidden sm:block" />
            Continuar Missão
          </button>
        </div>
      </div>

      {/* ── Grid de Módulos ───────────────────────────────────────────────── */}
      <section aria-label="Módulos de Treinamento">
        <h2 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6 tracking-tight">
          Módulos de Treinamento
        </h2>

        {/*
          Mobile  (< sm): 2 colunas — cards grandes, fáceis de tocar
          sm (≥640):       3 colunas
          md (≥768):       4 colunas
          lg (≥1024):      5 colunas
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {modulos.map((modulo) => (
            <ModuloCard key={modulo.id} modulo={modulo} />
          ))}
        </div>
      </section>
    </div>
  );
}
