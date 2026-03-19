import { motion } from 'framer-motion';
import heroImg from '../../assets/mktconsorcio.webp';
import TextReveal from './TextReveal';
import GradientBlobs from './GradientBlobs';

// Kanban mock data (local, não repetir import em LandingPage)
const KANBAN_COLS = [
  {
    col: 'Lead Novo',
    titleClass: 'text-blue-400',
    borderClass: 'border-l-2 border-l-blue-400',
    cards: ['Ana Lima', 'Carlos R.', 'Priya S.'],
  },
  {
    col: 'Em Qualificação',
    titleClass: 'text-yellow-400',
    borderClass: 'border-l-2 border-l-yellow-400',
    cards: ['Roberto F.', 'Marina T.'],
  },
  {
    col: 'Reunião Agendada',
    titleClass: 'text-green-400',
    borderClass: 'border-l-2 border-l-green-400',
    cards: ['Juliana M.'],
  },
];

/**
 * HeroSection — primeira dobra da landing page.
 *
 * Props:
 *   heroRef     — ref para o scroll tracking do framer-motion
 *   heroOpacity — MotionValue para fade-out no scroll
 *   heroScale   — MotionValue para scale-out no scroll
 *   heroY       — MotionValue para parallax Y no scroll
 */
export default function HeroSection({ heroRef, heroOpacity, heroScale, heroY }) {
  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
    >
      {/* ── Ken Burns background (z-0) ─────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 animate-space-drift"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      />

      {/* ── Overlay escuro (z-10) — garante legibilidade do texto ─────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950/90 via-zinc-950/70 to-zinc-950/40"
      />

      {/* ── Efeito radial laranja sutil sobre o overlay (z-10) ─────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,69,0,0.14),transparent)]"
      />

      {/* ── Conteúdo principal (z-20) ──────────────────────────────────── */}
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center text-center gap-8"
      >
        {/* ── Headline principal ── */}
        {/*
         * [SLOT] Headline Principal
         * TextReveal com fonte Space Grotesk + highlight em palavras-chave
         */}
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          ✦ Feito para o mercado de consórcio brasileiro
        </motion.div>

        <TextReveal
          text="Você tá perdendo venda todo dia. E sabe disso."
          className="font-['Space_Grotesk',sans-serif] font-bold text-4xl md:text-6xl text-white tracking-tight leading-tight"
          highlight={['perdendo', 'venda']}
          stagger={0.08}
        />

        {/* ── Subheadline ── */}
        {/*
         * [SLOT] Subheadline
         * Texto de suporte abaixo da headline principal
         */}
        <motion.p
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
          className="text-lg text-zinc-400 max-w-2xl font-['Inter',sans-serif]"
        >
          O GrowSorcio organiza seu funil, qualifica seu lead antes do primeiro contato
          e te mostra exatamente onde o dinheiro está parado.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <a
            href="#precos"
            className="group relative cta-pulse bg-[#FF4500] hover:bg-[#e03e00] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 min-h-[44px] flex items-center justify-center overflow-hidden"
          >
            <span className="relative z-10">Começar Agora →</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </a>
          <a
            href="#recursos"
            className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-200 min-h-[44px] flex items-center justify-center hover:bg-white/5"
          >
            Ver como funciona
          </a>
        </motion.div>

        {/* ── VSL / Vídeo ── */}
        {/*
         * [SLOT] VSL / Vídeo de Vendas
         * Substitua o bloco do Kanban mock abaixo pelo player de vídeo
         * quando o VSL estiver pronto. Proporção sugerida: aspect-video.
         * Exemplo:
         *   <div className="w-full mt-8 aspect-video rounded-xl overflow-hidden shadow-[0_0_120px_rgba(255,69,0,0.15)]">
         *     <iframe src="https://..." allow="autoplay" className="w-full h-full" />
         *   </div>
         */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 1.0 }}
          className="w-full mt-8 aspect-video bg-zinc-900/80 border border-white/10 rounded-xl shadow-[0_0_120px_rgba(255,69,0,0.1)] overflow-hidden p-4 flex gap-3 backdrop-blur-sm relative"
        >
          <div
            className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none"
            style={{ boxShadow: '0 0 60px rgba(255,69,0,0.06) inset' }}
          />
          {KANBAN_COLS.map((col, ci) => (
            <div key={col.col} className="flex-1 flex flex-col gap-2 min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-wider truncate ${col.titleClass}`}>
                {col.col}
              </p>
              {col.cards.map((name, cardIdx) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.2 + ci * 0.15 + cardIdx * 0.1 }}
                  className={`bg-white/5 border border-white/10 ${col.borderClass} rounded-lg p-2.5 relative hover:bg-white/8 transition-colors duration-200`}
                >
                  {cardIdx === 0 && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  )}
                  <p className="text-zinc-300 text-xs font-medium truncate">{name}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">Consórcio · R$ 85k</p>
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
