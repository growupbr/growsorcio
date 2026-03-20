import { useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Lock, ChevronLeft, ChevronRight, X, Clock, ArrowUpCircle, Trophy, Headset } from 'lucide-react';

// ─── Asset Imports ────────────────────────────────────────────────────────────
import capaTec    from '../assets/capa-tec.webp';
import modulo1    from '../assets/modulo-1.webp';
import modulo2    from '../assets/modulo-2.webp';
import modulo3    from '../assets/modulo-3.webp';
import modulo4    from '../assets/modulo-4.webp';
import modulo5    from '../assets/modulo-5-tec.webp';

// ─── Data ─────────────────────────────────────────────────────────────────────
const modulos = [
  {
    id: 1,
    imagem: modulo1,
    status: 'concluido',
    titulo: 'Briefing de Pré-Voo',
    aulaInicial: '1-2',
    progresso: 100,
  },
  {
    id: 2,
    imagem: modulo2,
    status: 'disponivel',
    titulo: 'Engenharia de Imagem',
    aulaInicial: '2-1',
    progresso: 50,
  },
  {
    id: 3,
    imagem: modulo3,
    status: 'bloqueado',
    titulo: 'Base de Lançamento',
    bloqueioTipo: 'progressao',
    bloqueioInfo: { modulosNecessarios: 2, modulosConcluidos: 1 },
    progresso: 0,
  },
  {
    id: 4,
    imagem: modulo4,
    status: 'bloqueado',
    titulo: 'Sistemas de Navegação',
    bloqueioTipo: 'tempo',
    bloqueioInfo: { dataLiberacao: '27 de março de 2026' },
    progresso: 0,
  },
  {
    id: 5,
    imagem: modulo5,
    status: 'bloqueado',
    titulo: 'Escala Global',
    bloqueioTipo: 'upgrade',
    bloqueioInfo: { plano: 'Elite' },
    progresso: 0,
  },
];

const PROGRESSO = 15; // %

// ─── Modal de Conteúdo Bloqueado ─────────────────────────────────────────────

function ModalBloqueado({ modulo, onClose }) {
  if (!modulo) return null;

  const { bloqueioTipo, bloqueioInfo, titulo } = modulo;

  const variants = {
    tempo: {
      icon: <Clock size={28} className="text-amber-400" />,
      iconBg: 'bg-amber-400/10 border border-amber-400/20',
      titulo: 'Aguarde a Liberação',
      descricao: (
        <>
          O <span className="text-white font-semibold">Módulo {modulo.id}: {titulo}</span> será
          liberado em <span className="text-amber-400 font-semibold">{bloqueioInfo?.dataLiberacao}</span>.
          Continue praticando as missões anteriores enquanto isso.
        </>
      ),
      cta: null,
      ctaLabel: null,
    },
    progressao: {
      icon: <Trophy size={28} className="text-orange-400" />,
      iconBg: 'bg-orange-400/10 border border-orange-400/20',
      titulo: 'Missão Bloqueada',
      descricao: (
        <>
          Complete os módulos anteriores para desbloquear o{' '}
          <span className="text-white font-semibold">Módulo {modulo.id}: {titulo}</span>.
          Você concluiu <span className="text-orange-400 font-semibold">{bloqueioInfo?.modulosConcluidos}</span> de{' '}
          <span className="text-white font-semibold">{bloqueioInfo?.modulosNecessarios}</span> módulos necessários.
        </>
      ),
      progressoAtual: bloqueioInfo?.modulosConcluidos ?? 0,
      progressoTotal: bloqueioInfo?.modulosNecessarios ?? 2,
      cta: null,
      ctaLabel: null,
    },
    upgrade: {
      icon: <ArrowUpCircle size={28} className="text-violet-400" />,
      iconBg: 'bg-violet-400/10 border border-violet-400/20',
      titulo: 'Conteúdo Exclusivo',
      descricao: (
        <>
          O <span className="text-white font-semibold">Módulo {modulo.id}: {titulo}</span> é
          exclusivo para membros do plano{' '}
          <span className="text-violet-400 font-semibold">{bloqueioInfo?.plano}</span>. Faça upgrade
          e desbloqueie todo o arsenal.
        </>
      ),
      ctaLabel: `Fazer Upgrade para ${bloqueioInfo?.plano}`,
      cta: () => window.open('/planos', '_self'),
    },
  };

  const v = variants[bloqueioTipo] ?? variants.progressao;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-sm bg-[#141417] border border-white/8 rounded-2xl p-6 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${v.iconBg}`}>
          {v.icon}
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-white mb-2">{v.titulo}</h3>

        {/* Descrição */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-5">{v.descricao}</p>

        {/* Barra de progresso (somente tipo progressao) */}
        {bloqueioTipo === 'progressao' && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>Missões concluídas</span>
              <span className="text-orange-400 font-semibold">
                {v.progressoAtual}/{v.progressoTotal}
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${(v.progressoAtual / v.progressoTotal) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col gap-2.5">
          {v.cta && v.ctaLabel && (
            <button
              onClick={v.cta}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-violet-500 hover:bg-violet-400 active:bg-violet-600 text-white transition-colors shadow-lg shadow-violet-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              {v.ctaLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 active:bg-white/20 text-zinc-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            {bloqueioTipo === 'upgrade' ? 'Agora não' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

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
  return null;
}

// ─── Card de Módulo ───────────────────────────────────────────────────────────

function ModuloCard({ modulo, onClick }) {
  const isBloqueado  = modulo.status === 'bloqueado';
  const isDisponivel = !isBloqueado;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        isBloqueado
          ? `Módulo ${modulo.id} bloqueado: ${modulo.titulo}`
          : `Abrir Módulo ${modulo.id}: ${modulo.titulo}`
      }
      className={[
        'aspect-[768/1376] relative rounded-xl overflow-hidden w-full',
        'border transition-all duration-300 group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        isBloqueado
          ? 'border-white/5 cursor-not-allowed opacity-50'
          : 'border-white/5 cursor-pointer hover:border-orange-500/50 hover:scale-[1.02]',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <img
        src={modulo.imagem}
        alt={`Módulo ${modulo.id}: ${modulo.titulo}`}
        loading="lazy"
        decoding="async"
        className={[
          'object-cover w-full h-full transition-transform duration-500',
          isDisponivel ? 'group-hover:scale-105' : '',
        ].join(' ')}
      />

      {/* Overlay interativo — disponíveis e concluídos */}
      {isDisponivel && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 via-black/20 to-black/10 backdrop-blur-[1px] flex items-center justify-center">
          {/* Anel de brilho sutil */}
          <div className="absolute inset-0 ring-1 ring-inset ring-orange-400/20 rounded-xl pointer-events-none" />
          {/* Botão Play */}
          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-500/90 shadow-lg shadow-orange-500/40 scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play size={20} fill="white" className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* Status badge */}
      <StatusBadge status={modulo.status} />

      {/* Ring laranja no módulo disponível (em andamento) */}
      {modulo.status === 'disponivel' && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-orange-500/60 pointer-events-none" />
      )}

      {/* Micro-progresso — barra colada na borda inferior do card */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-zinc-800/80 pointer-events-none">
        {(modulo.progresso ?? 0) > 0 && (
          <div
            className="h-full bg-orange-500 transition-all duration-700"
            style={{ width: `${modulo.progresso}%` }}
          />
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Treinamento() {
  const navigate  = useNavigate();
  const scrollRef = useRef(null);
  const [modalModulo, setModalModulo] = useState(null);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const cardW = card ? card.offsetWidth + 16 : 220;
    el.scrollBy({ left: dir * cardW, behavior: 'smooth' });
  }, []);

  const handleModuloClick = useCallback((modulo) => {
    if (modulo.status === 'bloqueado') {
      setModalModulo(modulo);
      return;
    }
    // disponivel ou concluido → navega para o player passando o módulo selecionado
    navigate('/treinamento/aula', {
      state: { moduloId: modulo.id, aulaId: modulo.aulaInicial ?? null },
    });
  }, [navigate]);

  return (
    <>
    <div className="relative min-h-full bg-zinc-950 px-4 py-6 sm:px-6 sm:py-8 md:px-10 overflow-hidden">

      {/* ── Glow Espacial — nebulosa de fundo ─────────────────────────────── */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-[700px] h-[700px] bg-orange-500/5 rounded-full blur-[120px] z-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[120px] z-0" aria-hidden="true" />

      {/* ── Conteúdo (acima dos glows) ────────────────────────────────────── */}
      <div className="relative z-10">

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

          {/* Contexto da próxima aula — reduz carga cognitiva */}
          <span className="text-zinc-400 text-[10px] sm:text-xs uppercase tracking-widest font-semibold mb-2 block">
            Próxima parada: Módulo 02 — Aula 03
          </span>

          {/* CTA — toque mínimo 44px (py-3) */}
          <button
            onClick={() => navigate('/treinamento/aula')}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 text-sm sm:text-base"
            aria-label="Continuar Missão TEC 2.0"
          >
            <Play size={16} fill="white" className="text-white sm:hidden" />
            <Play size={18} fill="white" className="text-white hidden sm:block" />
            Continuar Missão
          </button>
        </div>
      </div>

      {/* ── Carrossel de Módulos ──────────────────────────────────────────── */}
      <section aria-label="Módulos de Treinamento">

        {/* Header: título + setas */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Módulos de Treinamento
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              aria-label="Módulo anterior"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 hover:text-white transition-colors border border-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Próximo módulo"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 hover:text-white transition-colors border border-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Faixa de scroll — swipe nativo no mobile, setas no desktop */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {modulos.map((modulo) => (
            <div key={modulo.id} data-card className="w-40 sm:w-48 md:w-56 flex-shrink-0">
              <ModuloCard modulo={modulo} onClick={() => handleModuloClick(modulo)} />
            </div>
          ))}
        </div>
      </section>
      </div>{/* /z-10 content wrapper */}
    </div>

    {/* ── Modal de Conteúdo Bloqueado ──────────────────────────────────── */}
    <ModalBloqueado modulo={modalModulo} onClose={() => setModalModulo(null)} />

    {/* ── Widget de Suporte Flutuante ──────────────────────────────────── */}
    <button
      type="button"
      onClick={() => window.open('https://wa.me/5500000000000', '_blank', 'noopener,noreferrer')}
      aria-label="Abrir suporte da missão"
      className="fixed bottom-6 right-6 z-50 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all duration-300 rounded-full px-4 py-3 flex items-center gap-3 shadow-lg shadow-black/40 group"
    >
      <Headset size={18} className="flex-shrink-0 group-hover:text-orange-400 transition-colors" />
      <span className="text-sm font-semibold whitespace-nowrap">Suporte da Missão</span>
    </button>
    </>
  );
}
