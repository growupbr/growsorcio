import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import heroVideo from '../../assets/astroanima-scrub.mp4';
import TextReveal from './TextReveal';
import GradientBlobs from './GradientBlobs';

/**
 * HeroSection — vídeo scrubado pelo scroll.
 *
 * Arquitetura:
 *  • containerRef  → div com height: 300vh (cria espaço de scroll)
 *  • section       → sticky top-0 h-screen (pina enquanto o container rola)
 *  • videoRef      → <video> mudo, sem controles, scrubado pelo scrollYProgress
 *  • scrollYProgress rastreia 0→1 ao longo dos 300vh
 *  • Após o container sair da viewport, o scroll volta ao fluxo normal da página
 */
export default function HeroSection() {
  const containerRef = useRef(null);
  const videoRef     = useRef(null);

  // Rastreia progresso do scroll do início ao fim do container (300vh)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Conteúdo faz fade gradual conforme o usuário scrolla (desaparece ao final)
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.4, 0]);
  const contentY       = useTransform(scrollYProgress, [0, 1], [0, -40]);

  // Scrubbing: a cada mudança no scroll, avança/recua o vídeo proporcionalmente
  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;
    video.currentTime = progress * video.duration;
  });

  return (
    // Container 120vh: vídeo percorre em apenas 20vh de scroll (rápido)
    <div ref={containerRef} style={{ height: '120vh' }}>
      <section
        id="hero"
        className="sticky top-0 h-screen relative flex items-center justify-center pt-20 overflow-hidden"
      >
        {/* ── Vídeo de fundo (z-0) — scrubado pelo scroll ─────────────── */}
        <video
          ref={videoRef}
          src={heroVideo}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0"
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
          style={{ opacity: contentOpacity, y: contentY }}
          className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center text-center gap-8"
        >
          {/* ── Badge ── */}
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
          <motion.p
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.6 }}
            className="text-lg text-zinc-400 max-w-2xl font-['Inter',sans-serif]"
          >
            Gerencie seus leads em tempo real, use calculadoras de comparação imbatíveis e recupere até 40% das vendas perdidas por falta de follow-up.
          </motion.p>

          {/* ── CTAs ── */}
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
        </motion.div>

        {/* ── Scroll indicator (some quando começa a scrollar) ─────────── */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.08], [1, 0]) }}
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
    </div>
  );
}
