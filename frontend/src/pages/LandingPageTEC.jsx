// /frontend/src/pages/LandingPageTEC.jsx — v3 (premium redesign)
// TEC 2.0 — Landing Page reestruturada (10 seções, anatomia de conversão)
// Stack: React 18 + Tailwind 3 + framer-motion + canvas-confetti + lucide-react

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Check,
  Lock,
  LayoutDashboard,
  Zap,
  MessageCircle,
  ClipboardCheck,
  BarChart2,
  Calculator,
  FileText,
  Bell,
  History,
  Minus,
  Plus,
  Menu,
  X,
  Smartphone,
  Shield,
  Gift,
  Brain,
  ImagePlay,
  Settings2,
  Filter,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import GrowsorcioLogo from '../components/GrowsorcioLogo';

// ─── ASSET IMPORTS ────────────────────────────────────────────────────────────
import imgTec2 from '../assets/tec2.webp';
import imgMod1 from '../assets/modulo-1.webp';
import imgMod2 from '../assets/modulo-2.webp';
import imgMod3 from '../assets/modulo-3.webp';
import imgMod4 from '../assets/modulo-4.webp';
import imgMod5 from '../assets/modulo-5-tec.webp';


// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const ACCENT = '#FF4500';
const BG = '#020617';
const SURFACE = '#0F172A';
const SURFACE2 = '#1E293B';
const SURFACE3 = '#334155';
const TEXT = '#F8FAFC';
const MUTED = '#94A3B8';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** canvas-confetti — dispara apenas uma vez por sessão */
function fireConfetti() {
  if (sessionStorage.getItem('tec_confetti_fired')) return;
  sessionStorage.setItem('tec_confetti_fired', '1');
  confetti({
    particleCount: 130,
    spread: 90,
    origin: { y: 0.55 },
    colors: ['#FF4500', '#FF6B35', '#FFD700', '#FFFFFF'],
  });
}

function handleCTA() {
  fireConfetti();
  document.getElementById('oferta')?.scrollIntoView({ behavior: 'smooth' });
}

/** Fade-up universal via framer-motion + useInView */
function FadeUp({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, filter: 'blur(4px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Contador animado — conta de 0 até value ao entrar no viewport */
function AnimatedCounter({ value, suffix = '', duration = 1.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const isFloat = String(value).includes('.');
    const numeric = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
    const start = performance.now();
    let raf;
    function step(now) {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numeric * eased;
      setDisplay(
        isFloat
          ? current.toFixed(1)
          : Math.floor(current).toLocaleString('pt-BR')
      );
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

/** Botão CTA padrão */
function CTAButton({ label = 'Quero começar agora — R$ 247 ou 12x de R$ 24,70', className = '' }) {
  return (
    <motion.button
      onClick={handleCTA}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-5 text-base font-bold text-white cursor-pointer transition-shadow duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4500] ${className}`}
      style={{
        backgroundColor: ACCENT,
        minHeight: 52,
        boxShadow: '0 0 28px rgba(255,69,0,0.4), 0 4px 16px rgba(0,0,0,0.4)',
      }}
      whileHover={{
        boxShadow: '0 0 44px rgba(255,69,0,0.65), 0 8px 24px rgba(0,0,0,0.5)',
        y: -2,
      }}
    >
      {label}
    </motion.button>
  );
}

/** Wrapper de seção */
function Section({ id, children, className = '', style = {} }) {
  return (
    <section id={id} className={`w-full px-4 py-16 md:py-24 ${className}`} style={style}>
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setVisible(y < 60 || y < lastY.current);
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      animate={{ y: visible ? 0 : -80 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-md"
      style={{ backgroundColor: `${BG}e6` }}
    >
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <GrowsorcioLogo height={28} />

        <button
          onClick={handleCTA}
          className="hidden sm:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white cursor-pointer transition-all hover:brightness-110 active:scale-95"
          style={{ backgroundColor: ACCENT }}
        >
          Quero o TEC 2.0
        </button>

        <button
          className="sm:hidden p-2 rounded-lg text-white/70 hover:text-white"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-white/5 px-4 py-4" style={{ backgroundColor: SURFACE }}>
          <button
            onClick={() => { setMenuOpen(false); handleCTA(); }}
            className="w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white cursor-pointer"
            style={{ backgroundColor: ACCENT }}
          >
            Quero o TEC 2.0
          </button>
        </div>
      )}
    </motion.nav>
  );
}

// ─── SEÇÃO 01 — HERO ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center overflow-hidden"
      style={{ backgroundColor: BG }}
    >
      {/* Glow radial — 3 blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-[0.09] blur-3xl" style={{ backgroundColor: ACCENT }} />
        <div className="absolute -top-32 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl" style={{ backgroundColor: '#6366f1' }} />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl" style={{ backgroundColor: ACCENT }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
        {/* Eyebrow */}
        <FadeUp>
          <span
            className="text-xs font-bold uppercase tracking-[0.25em]"
            style={{ color: ACCENT }}
          >
            — Treinamento exclusivo para consórcio
          </span>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={0.1}>
          <h1
            style={{
              color: TEXT,
              fontSize: 'clamp(2.5rem, 7vw, 5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            <span className="font-light block">O método que gestores de consórcio usam para gerar</span>
            <span className="font-extrabold block" style={{ color: ACCENT }}>leads qualificados</span>
            <span className="font-light block">com tráfego pago.</span>
          </h1>
        </FadeUp>

        {/* Subheadline */}
        <FadeUp delay={0.18}>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: MUTED }}>
            Aprenda a fazer seus próprios anúncios no Meta Ads — sem depender de agência, sem desperdiçar verba, do zero ao primeiro lead qualificado.
          </p>
        </FadeUp>

        {/* CTA */}
        <FadeUp delay={0.26} className="w-full sm:w-auto">
          <CTAButton className="w-full sm:w-auto text-lg px-10 py-5" />
        </FadeUp>

        {/* Trust */}
        <FadeUp delay={0.34}>
          <p className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
            <Lock size={14} style={{ color: ACCENT }} />
            Acesso imediato após a confirmação do pagamento
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── SEÇÃO 02 — BARRA DE CREDIBILIDADE ───────────────────────────────────────
const METRICS = [
  { value: '9M', prefix: 'R$', suffix: '+', label: 'gerenciados em anúncios de consórcio' },
  { value: '3',  prefix: '',   suffix: ' nichos', label: 'imobiliário, agro e automotivo' },
  { value: 'Meta Ads', prefix: '', suffix: '', label: 'plataforma usada em 100% das campanhas', isText: true },
];

function Credibilidade() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="w-full px-4 py-14 border-y border-white/[0.06]" style={{ backgroundColor: BG }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {METRICS.map((m, i) => (
            <FadeUp key={i} delay={i * 0.1} className="flex flex-col items-center text-center gap-1.5 px-10 py-6 sm:py-0 w-full sm:w-auto">
              <p className="text-5xl font-black" style={{ color: ACCENT }}>
                {m.isText ? (
                  <span>{m.value}</span>
                ) : (
                  <>
                    {m.prefix}
                    {inView ? <AnimatedCounter value={parseFloat(m.value)} suffix={m.suffix} /> : '0'}
                  </>
                )}
              </p>
              <p className="text-sm leading-snug" style={{ color: MUTED }}>{m.label}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SEÇÃO 03 — PARA QUEM É / AGITAÇÃO ───────────────────────────────────────
const PROBLEMAS = [
  'Você contratou uma agência, pagou caro e os leads que chegavam não tinham perfil pra consórcio',
  'Você tentou anunciar sozinho, gastou verba e não entendeu o que deu errado',
  'Você depende de indicação e sabe que isso não é escalável',
  'Você nunca anunciou porque acha que é difícil demais pra fazer sem ajuda técnica',
  'Você quer captar leads qualificados mas não sabe como filtrar quem tem perfil de quem não tem',
];

function ParaQuemE() {
  return (
    <Section style={{ backgroundColor: BG }}>
      <FadeUp>
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-10 max-w-2xl" style={{ color: TEXT, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          Você já investe em tráfego mas as vendas de consórcio não escalam?
        </h2>
      </FadeUp>

      <ul className="flex flex-col gap-4 mb-8">
        {PROBLEMAS.map((item, i) => (
          <FadeUp key={i} delay={i * 0.07}>
            <li className="flex items-start gap-3 text-base sm:text-lg leading-relaxed" style={{ color: MUTED }}>
              <XCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#B91C1C' }} />
              {item}
            </li>
          </FadeUp>
        ))}
      </ul>

      <FadeUp delay={0.4}>
        <p
          className="text-base sm:text-lg font-semibold rounded-xl px-5 py-4"
          style={{ backgroundColor: `${ACCENT}12`, color: TEXT, border: `1px solid ${ACCENT}30` }}
        >
          Se você se reconheceu em algum desses cenários, o TEC 2.0 foi feito pra você.
        </p>
      </FadeUp>
    </Section>
  );
}

// ─── SEÇÃO 04 — PILARES DO MÉTODO ────────────────────────────────────────────
const PILARES = [
  {
    icon: Brain,
    titulo: 'Mentalidade de quem anuncia pra vender',
    resultado: 'Você para de esperar resultado rápido e passa a tomar decisões baseadas em dados',
  },
  {
    icon: ImagePlay,
    titulo: 'Criativos que param o scroll',
    resultado: 'Você cria imagens e textos de anúncio com IA sem precisar de designer ou agência',
  },
  {
    icon: Settings2,
    titulo: 'Meta Ads configurado do jeito certo',
    resultado: 'Você sobe sua conta, seu Pixel e sua campanha sem errar nas configurações básicas',
  },
  {
    icon: Filter,
    titulo: 'Leads que chegam já qualificados',
    resultado: 'Você para de perder tempo com curioso — só fala com quem tem perfil real pra fechar',
  },
  {
    icon: TrendingUp,
    titulo: 'Campanhas que melhoram com o tempo',
    resultado: 'Você lê os dados, sabe o que otimizar e escala o orçamento sem quebrar o aprendizado',
  },
];

function Pilares() {
  return (
    <Section style={{ backgroundColor: SURFACE }}>
      <FadeUp>
        <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-10" style={{ color: TEXT }}>
          O que o TEC 2.0 entrega na prática
        </h2>
      </FadeUp>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PILARES.map(({ icon: Icon, titulo, resultado }, i) => (
          <FadeUp key={i} delay={i * 0.08} className={i === 4 ? 'sm:col-span-2' : ''}>
            <div
              className="relative rounded-2xl p-6 flex flex-col gap-3 h-full overflow-hidden transition-all duration-200 cursor-default"
              style={{ backgroundColor: SURFACE2, border: `1px solid ${SURFACE3}` }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Decorative index number */}
              <span
                className="absolute bottom-2 right-4 select-none pointer-events-none font-black"
                style={{ fontSize: 100, opacity: 0.04, color: TEXT, lineHeight: 1 }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${ACCENT}18` }}
              >
                <Icon size={20} style={{ color: ACCENT }} />
              </div>
              <h3 className="text-base font-bold leading-snug" style={{ color: TEXT }}>{titulo}</h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{resultado}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </Section>
  );
}

// ─── SEÇÃO 05 — MÓDULOS (CARROSSEL) ──────────────────────────────────────────
const MODULOS = [
  {
    img: imgMod1,
    num: 'MÓDULO 01',
    titulo: 'Antes de Anunciar',
    outcome: 'Você entende como o algoritmo funciona e para de tomar decisão na intuição',
  },
  {
    img: imgMod2,
    num: 'MÓDULO 02',
    titulo: 'Criando Criativos com IA',
    outcome: 'Você cria imagens e copies de anúncio em minutos, sem depender de ninguém',
  },
  {
    img: imgMod3,
    num: 'MÓDULO 03',
    titulo: 'Configurando o Meta Ads do Zero',
    outcome: 'Você sai com conta, Pixel e campanha configurados corretamente',
  },
  {
    img: imgMod4,
    num: 'MÓDULO 04',
    titulo: 'Estratégia de Formulário e Integração',
    outcome: 'Você filtra leads ruins automaticamente antes deles chegarem até você',
  },
  {
    img: imgMod5,
    num: 'MÓDULO 05',
    titulo: 'Subindo, Analisando e Melhorando',
    outcome: 'Você sabe ler os dados, otimizar e escalar com consistência',
  },
];

function Modulos() {
  const [current, setCurrent] = useState(0);
  const total = MODULOS.length;

  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total]);

  // Desktop: mostrar 3 cards centrados no atual
  const visible = [
    MODULOS[(current - 1 + total) % total],
    MODULOS[current],
    MODULOS[(current + 1) % total],
  ];

  return (
    <Section style={{ backgroundColor: BG }}>
      <FadeUp>
        <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-10" style={{ color: TEXT }}>
          5 módulos. Do zero ao primeiro lead qualificado.
        </h2>
      </FadeUp>

      {/* ── Mobile: scroll horizontal com snap ── */}
      <div className="sm:hidden -mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
          {MODULOS.map((m, i) => (
            <div
              key={i}
              className="snap-center flex-shrink-0 w-[80vw] rounded-2xl overflow-hidden"
              style={{ backgroundColor: SURFACE, border: `1px solid ${SURFACE3}` }}
            >
              <img src={m.img} alt={m.titulo} className="w-full aspect-video object-cover" loading="lazy" />
              <div className="p-4 flex flex-col gap-2">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT }}>{m.num}</span>
                <h3 className="text-sm font-bold" style={{ color: TEXT }}>{m.titulo}</h3>
                <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{m.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop: carrossel com 3 cards + setas ── */}
      <div className="hidden sm:block">
        <div className="relative">
          <div className="grid grid-cols-3 gap-4">
            {visible.map((m, i) => {
              const isCenter = i === 1;
              return (
                <motion.div
                  key={`${m.num}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isCenter ? 1 : 0.55, scale: isCenter ? 1 : 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: SURFACE,
                    border: `1px solid ${isCenter ? ACCENT + '60' : SURFACE3}`,
                    boxShadow: isCenter ? '0 0 0 1px rgba(255,69,0,0.3), 0 24px 60px rgba(0,0,0,0.6)' : 'none',
                  }}
                  onClick={i === 0 ? prev : i === 2 ? next : undefined}
                >
                  <div className="relative">
                    <img src={m.img} alt={m.titulo} className="w-full aspect-video object-cover" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
                  </div>
                  <div className="p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: ACCENT }}>{m.num}</span>
                      {isCenter && <span className="text-xs font-mono" style={{ opacity: 0.4, color: TEXT }}>{String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>}
                    </div>
                    <h3 className="text-sm font-bold" style={{ color: TEXT }}>{m.titulo}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{m.outcome}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Setas */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors backdrop-blur-sm cursor-pointer"
            style={{ backgroundColor: `${SURFACE2}cc` }}
            aria-label="Módulo anterior"
          >
            <ChevronLeft size={18} style={{ color: TEXT }} />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors backdrop-blur-sm cursor-pointer"
            style={{ backgroundColor: `${SURFACE2}cc` }}
            aria-label="Próximo módulo"
          >
            <ChevronRight size={18} style={{ color: TEXT }} />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {MODULOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-200 cursor-pointer"
              style={{
                width: i === current ? 20 : 8,
                height: 8,
                backgroundColor: i === current ? ACCENT : SURFACE3,
              }}
              aria-label={`Ir para módulo ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── SEÇÃO 06 — PROVA SOCIAL / ÁREA DE MEMBROS ───────────────────────────────
const CHECKS_PLATAFORMA = [
  'Aulas organizadas por módulo com progresso individual',
  'Acesso pelo celular ou computador, a qualquer hora',
  'Conteúdo atualizado conforme o Meta Ads evolui',
];

function AreaMembros() {
  return (
    <Section style={{ backgroundColor: SURFACE }}>
      <FadeUp>
        <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-3" style={{ color: TEXT }}>
          Veja como é por dentro
        </h2>
      </FadeUp>
      <FadeUp delay={0.1}>
        <p className="text-center text-base sm:text-lg mb-8" style={{ color: MUTED }}>
          Assim que você confirmar o pagamento, acesso imediato à plataforma de treinamento.
        </p>
      </FadeUp>

      {/* Screenshot */}
      <FadeUp delay={0.15}>
        <motion.div
          initial={{ rotateX: 6, opacity: 0.7 }}
          whileInView={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl"
          style={{ perspective: 1200 }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.7)', border: `1px solid ${SURFACE3}` }}
          >
            <img
              src={imgTec2}
              alt="Área de membros do TEC 2.0"
              className="w-full object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
      </FadeUp>

      {/* Bullets */}
      <ul className="flex flex-col gap-3 mt-8 max-w-lg mx-auto">
        {CHECKS_PLATAFORMA.map((item, i) => (
          <FadeUp key={i} delay={0.25 + i * 0.07}>
            <li className="flex items-start gap-3 text-sm sm:text-base" style={{ color: MUTED }}>
              <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ACCENT}20` }}>
                <Check size={12} style={{ color: ACCENT }} />
              </span>
              {item}
            </li>
          </FadeUp>
        ))}
      </ul>

      {/* TODO: Substituir pelo componente de depoimentos quando disponível
          Formato esperado: vídeo curto ou print de resultado com nome, cargo e métrica concreta
          Ex: "Saí de 3 leads/mês para 40 leads qualificados em 6 semanas" */}
    </Section>
  );
}

// ─── SEÇÃO 07 — SOBRE LUIZ ───────────────────────────────────────────────────
const METRICAS_LUIZ = [
  { valor: 'R$ 9M+', label: 'gerenciados em tráfego' },
  { valor: '3 nichos', label: 'de consórcio' },
  { valor: 'Desde 2020', label: 'campanhas ativas' },
];

function SobreLuiz() {
  return (
    <Section style={{ background: `radial-gradient(ellipse at 20% 50%, #111827 0%, ${BG} 70%)` }}>
      <FadeUp>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Foto */}
          <div className="flex-shrink-0">
            <div
              className="w-36 h-36 md:w-48 md:h-48 rounded-full flex items-center justify-center text-2xl font-black"
              style={{ border: `3px solid ${ACCENT}`, backgroundColor: SURFACE2, color: ACCENT }}
            >
              LN
              {/* TODO: substituir por foto real do Luiz */}
            </div>
          </div>

          <div className="flex flex-col gap-5 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Quem criou o TEC 2.0</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: TEXT }}>Luiz Nascimento</h2>

            <p className="text-sm sm:text-base leading-relaxed" style={{ color: MUTED }}>
              Luiz Nascimento é fundador da GrowUp Brasil, assessoria de marketing especializada exclusivamente no segmento de consórcio. Desde 2020, a GrowUp já gerenciou mais de R$ 9 milhões em anúncios para vendedores, supervisores e operações de consórcio nos nichos imobiliário, agro e automotivo.
            </p>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: MUTED }}>
              O TEC 2.0 não é um curso montado em cima de teoria. É a versão estruturada de tudo que a GrowUp aprendeu gerenciando campanhas reais — com orçamento real, leads reais e resultados que você pode replicar na sua operação.
            </p>

            {/* Métricas inline */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              {METRICAS_LUIZ.map((m, i) => (
                <div key={i} className="flex flex-col items-center md:items-start">
                  <span className="text-lg font-black" style={{ color: ACCENT }}>{m.valor}</span>
                  <span className="text-xs" style={{ color: MUTED }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}

// ─── SEÇÃO 08 — OFERTA + PREÇO + BÔNUS ───────────────────────────────────────
const STACK_VALOR = [
  { item: 'TEC 2.0 — 15 aulas em 5 módulos', valor: 'R$ 247' },
  { item: 'Gem de criação de criativos com IA', valor: 'R$ 97' },
  { item: 'Gem de criação de copies para anúncio', valor: 'R$ 97' },
  { item: '30 dias grátis do Growsorcio Start', valor: 'R$ 147' },
];

const BONUS_ITEMS = [
  { icon: LayoutDashboard, text: 'CRM com kanban visual — do Lead Novo ao Fechado' },
  { icon: Zap,            text: 'Integração nativa com Meta Ads — leads entram automaticamente, sem copiar e colar' },
  { icon: MessageCircle,  text: 'Click-to-Zap — WhatsApp abre com mensagem personalizada com nome e interesse do lead' },
  { icon: ClipboardCheck, text: 'Qualificação nativa — campos de carta, lance, CPF e urgência já prontos' },
  { icon: BarChart2,      text: 'Painel de métricas — ROI de anúncios e taxa de conversão em tempo real' },
  { icon: Calculator,     text: 'Calculadora Consórcio x Financiamento' },
  { icon: FileText,       text: 'Geração de proposta comercial dentro da plataforma' },
  { icon: Bell,           text: 'Fluxos de follow-up com alertas por tempo parado em cada etapa' },
  { icon: History,        text: 'Histórico completo de interações por lead' },
];

function Oferta() {
  return (
    <Section id="oferta" style={{ backgroundColor: SURFACE }}>
      <FadeUp>
        <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-10" style={{ color: TEXT }}>
          Tudo que está incluído:
        </h2>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Stack de Valor */}
        <FadeUp delay={0.05}>
          <div>
            <div className="rounded-2xl overflow-hidden mb-6" style={{ border: `1px solid ${SURFACE3}` }}>
              <div className="grid grid-cols-2 px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: SURFACE2, color: MUTED }}>
                <span>O que você leva</span>
                <span className="text-right">Valor</span>
              </div>
              {STACK_VALOR.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 px-5 py-3.5 text-sm items-center"
                  style={{ backgroundColor: SURFACE, color: TEXT, borderTop: `1px solid ${SURFACE3}`, borderLeft: `2px solid ${ACCENT}` }}
                >
                  <span>{l.item}</span>
                  <span className="text-right font-semibold" style={{ color: MUTED }}>{l.valor}</span>
                </div>
              ))}
            </div>

            {/* Caixa de preço */}
            <div
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ border: `2px solid ${ACCENT}`, backgroundColor: SURFACE2 }}
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm line-through" style={{ color: '#EF4444' }}>Valor total: R$ 588</p>
                <p className="text-3xl sm:text-4xl font-black" style={{ color: TEXT }}>R$ 247</p>
                <p className="text-base font-bold" style={{ color: ACCENT }}>ou 12x de R$ 24,70</p>
              </div>
              <button
                onClick={handleCTA}
                className="w-full rounded-xl py-4 text-base font-bold text-white cursor-pointer transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: ACCENT }}
              >
                Quero o TEC 2.0 agora
              </button>
              <p className="text-xs text-center" style={{ color: MUTED }}>
                <Lock size={11} className="inline mr-1" />
                Pagamento seguro — Acesso imediato
              </p>
            </div>
          </div>
        </FadeUp>

        {/* Bônus */}
        <FadeUp delay={0.12}>
          <div className="flex flex-col gap-5">
            <div
              className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-center"
              style={{ backgroundColor: `${ACCENT}20`, border: `1px solid ${ACCENT}55` }}
            >
              <Gift size={16} style={{ color: ACCENT, transform: 'rotate(-4deg)' }} />
              <span style={{ color: ACCENT }}>BÔNUS — 30 dias grátis do Growsorcio Start (R$ 147 de valor)</span>
            </div>

            <ul className="flex flex-col gap-3">
              {BONUS_ITEMS.map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: MUTED }}>
                  <Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                  {text}
                </li>
              ))}
            </ul>

            <p
              className="text-sm leading-relaxed rounded-xl p-4"
              style={{ backgroundColor: SURFACE3, color: MUTED }}
            >
              Você aprende a anunciar no TEC 2.0 e já começa a usar o Growsorcio pra organizar os leads que vão entrar. Os dois funcionam juntos desde o primeiro dia.
            </p>
          </div>
        </FadeUp>
      </div>
    </Section>
  );
}

// ─── SEÇÃO 09 — GARANTIA + FAQ ────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: 'Preciso ter experiência com tráfego pago pra fazer o TEC 2.0?',
    a: 'Não. O treinamento foi feito pra quem está começando do zero. Cada passo é mostrado na prática, do cadastro no Meta Ads até a campanha no ar.',
  },
  {
    q: 'O TEC 2.0 funciona pra qualquer nicho de consórcio?',
    a: 'Sim. O treinamento cobre consórcio imobiliário, agro e automotivo — com estratégias específicas pra cada nicho.',
  },
  {
    q: 'Quanto eu preciso investir em anúncios pra começar?',
    a: 'Você consegue começar com R$ 30 a R$ 50 por dia. O treinamento mostra como usar esse orçamento de forma eficiente desde o primeiro anúncio.',
  },
  {
    q: 'Por quanto tempo tenho acesso ao treinamento?',
    a: 'Acesso vitalício. Você assiste no seu ritmo e pode rever as aulas quantas vezes quiser.',
  },
  {
    q: 'O que é o Growsorcio e preciso continuar pagando depois dos 30 dias?',
    a: 'O Growsorcio é um CRM feito especificamente para consórcio. Os 30 dias são grátis e sem compromisso. Depois desse período, você decide se quer continuar — o plano Start custa R$ 147/mês.',
  },
  {
    q: 'E se eu já tiver uma conta no Meta Ads?',
    a: 'Melhor ainda. Você aproveita o que já tem e configura tudo do jeito certo a partir da Aula 6.',
  },
  {
    q: 'Tem suporte se eu travar em alguma aula?',
    a: '// TODO: preencher com o canal de suporte disponível',
  },
];

function GarantiaFAQ() {
  const [open, setOpen] = useState(null);

  return (
    <Section style={{ backgroundColor: BG }}>
      {/* Bloco de garantia */}
      <FadeUp>
        <div
          className="flex flex-col items-center text-center gap-4 rounded-2xl p-8 mb-12 mx-auto max-w-lg"
          style={{ border: `2px solid ${ACCENT}`, backgroundColor: SURFACE }}
        >
          <ShieldCheck size={52} style={{ color: ACCENT }} />
          <h3 className="text-xl font-extrabold" style={{ color: TEXT }}>
            {/* TODO: definir política de garantia e prazo */}
            Garantia a definir
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            {/* TODO: preencher com os termos da garantia */}
            Os detalhes da garantia serão inseridos aqui após definição.
          </p>
        </div>
      </FadeUp>

      {/* FAQ */}
      <FadeUp delay={0.1}>
        <h2 className="text-xl sm:text-2xl font-extrabold text-center mb-8" style={{ color: TEXT }}>
          Dúvidas frequentes
        </h2>
      </FadeUp>

      <div className="flex flex-col gap-2">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <FadeUp key={i} delay={0.05 + i * 0.04}>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${isOpen ? ACCENT + '55' : SURFACE3}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm sm:text-base font-semibold cursor-pointer focus-visible:outline-none"
                  style={{ color: TEXT }}
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span className="flex-shrink-0" style={{ color: ACCENT }}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className="px-5 pb-4 text-sm sm:text-base leading-relaxed" style={{ color: MUTED }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeUp>
          );
        })}
      </div>
    </Section>
  );
}

// ─── SEÇÃO 10 — CTA FINAL ────────────────────────────────────────────────────
function CTAFinal() {
  return (
    <section
      className="w-full px-4 py-20 md:py-32 text-center"
      style={{
        background: `radial-gradient(ellipse at 50% 100%, rgba(255,69,0,0.18) 0%, ${BG} 60%)`,
      }}
    >
      <div className="mx-auto max-w-3xl flex flex-col items-center gap-6">
        <FadeUp>
          <h2
            style={{
              color: TEXT,
              fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
            }}
            className="font-extrabold"
          >
            Pare de perder leads pra{' '}
            <span style={{ color: ACCENT }}>quem já sabe anunciar.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: MUTED }}>
            Enquanto você espera, seus concorrentes estão aparecendo pra exatamente o público que você quer atingir. O TEC 2.0 te dá o método, as ferramentas e o passo a passo pra você ser esse concorrente.
          </p>
        </FadeUp>

        <FadeUp delay={0.18} className="w-full sm:w-auto">
          <CTAButton
            label="Quero o TEC 2.0 agora — R$ 247 ou 12x de R$ 24,70"
            className="w-full sm:w-auto text-xl px-12 py-6"
          />
        </FadeUp>

        {/* Selos */}
        <FadeUp delay={0.26}>
          <div className="flex flex-wrap justify-center gap-5">
            {[
              { icon: Shield,     label: 'Pagamento seguro' },
              { icon: Smartphone, label: 'Acesso imediato' },
              { icon: Gift,       label: '30 dias grátis do Growsorcio' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 text-xs rounded-full px-4 py-1.5"
                style={{ color: MUTED, border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Icon size={13} style={{ color: ACCENT }} />
                {label}
              </span>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={0.32}>
          <p className="text-xs" style={{ color: MUTED }}>
            {/* TODO: inserir texto da garantia após definição */}
          </p>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full px-4 py-8 border-t" style={{ backgroundColor: BG, borderColor: SURFACE3 }}>
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: MUTED }}>
        <GrowsorcioLogo height={22} />
        <p>© {new Date().getFullYear()} GrowUp Brasil. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function LandingPageTEC() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = BG;
    document.body.style.color = TEXT;
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: BG, color: TEXT, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Credibilidade />
        <ParaQuemE />
        <Pilares />
        <Modulos />
        <AreaMembros />
        <SobreLuiz />
        <Oferta />
        <GarantiaFAQ />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  );
}
