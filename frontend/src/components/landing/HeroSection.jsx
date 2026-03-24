import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
const heroImg = '/mktconsorcio.webp';
import TextReveal from './TextReveal';
import GradientBlobs from './GradientBlobs';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// Kanban mock data (local, não repetir import em LandingPage)
const KANBAN_COLS = [
  {
    col: 'Seguiu Perfil',
    titleClass: 'text-orange-400',
    borderClass: 'border-l-2 border-l-orange-400',
    cards: ['Ana Lima', 'Carlos R.', 'Priya S.'],
  },
  {
    col: 'Reunião Agendada',
    titleClass: 'text-yellow-400',
    borderClass: 'border-l-2 border-l-yellow-400',
    cards: ['Roberto F.', 'Marina T.'],
  },
  {
    col: 'Proposta Enviada',
    titleClass: 'text-emerald-400',
    borderClass: 'border-l-2 border-l-emerald-400',
    cards: ['Juliana M.'],
  },
];

/**
 * HeroSection — primeira dobra da landing page.
 * Self-contained: gere internamente o scroll tracking e parallax.
 */
export default function HeroSection() {
  const heroRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale  = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY      = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Posição do astronauta: mobile centraliza mais, desktop mantém center
  const bgPosition = isMobile ? '62% center' : 'center center';

  // Animação mais dramática no mobile (tela menor = movimento parecendo maior)
  const kenBurns = isMobile
    ? { scale: [1, 1.18, 1.28], y: [0, -55, -20] }
    : { scale: [1, 1.14, 1.24], y: [0, -45, -15] };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
    >
      {/* ── Ken Burns background (z-0) ─────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        animate={kenBurns}
        transition={{
          duration: isMobile ? 18 : 25,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'alternate',
        }}
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: bgPosition,
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
          text="Pare de Perder Vendas para o Caos do WhatsApp. O Único CRM Desenhado para a Jornada do Consórcio."
          className="font-['Space_Grotesk',sans-serif] font-bold text-3xl md:text-5xl text-white tracking-tight leading-tight"
          stagger={0.04}
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
          Gerencie seus leads em tempo real, use calculadoras de comparação imbatíveis e recupere até 40% das vendas perdidas por falta de follow-up.
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
          className="w-full mt-8 rounded-xl overflow-hidden shadow-[0_0_120px_rgba(255,69,0,0.18)]"
        >
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/MLpWrANjFbI?si=wLdZBEOx1U8eEjZc"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
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
