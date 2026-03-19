// /frontend/src/pages/LandingPage.jsx
import { useState, useRef } from 'react';
import logoAdemicon from '../assets/ademicon.webp';
import logoEmbracon from '../assets/embracon.webp';
import logoHonda from '../assets/hondaconsorcio.webp';
import logoHS from '../assets/hsconsorcio.webp';
import logoMagalu from '../assets/magaluconsorcio.webp';
import logoMaggi from '../assets/maggiconsorcio.webp';
import logoPorto from '../assets/portoseguroconsorcio.webp';
import logoRodobens from '../assets/rodobens.webp';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Zap, Brain, Calculator, ChevronDown, Menu, X, Star, MessageCircle } from 'lucide-react';
import PricingSection from '../components/ui/PricingSection';
import GrowsorcioLogo from '../components/GrowsorcioLogo';
import GradientBlobs from '../components/landing/GradientBlobs';
import HeroSection from '../components/landing/HeroSection';
import TextReveal from '../components/landing/TextReveal';
import AnimatedCounter from '../components/landing/AnimatedCounter';
import GlowCard from '../components/landing/GlowCard';
import ParallaxSection from '../components/landing/ParallaxSection';
import StaggerContainer, { staggerItemVariants } from '../components/landing/StaggerContainer';

const FEATURES = [
  {
    icon: <Zap size={22} className="text-[#FF4500]" />,
    stat: '2 min',
    titulo: 'Lead do Meta direto no funil',
    descricao: 'Seu lead clicou no anúncio agora. Em 2 minutos ele está no seu kanban, com nome, interesse e valor de carta preenchidos. Acabou o copia e cola.',
  },
  {
    icon: <Brain size={22} className="text-[#FF4500]" />,
    stat: '4 campos',
    titulo: 'Sabe com quem vale o seu tempo',
    descricao: 'Antes de ligar, você já sabe: qual carta quer, quanto tem de lance, se tem restrição no CPF e qual a urgência. Só você entra em contato com quem realmente tem perfil.',
  },
  {
    icon: <Calculator size={22} className="text-[#FF4500]" />,
    stat: '87%',
    titulo: 'Mata a objeção do financiamento na hora',
    descricao: "O cliente diz 'prefiro financiar'. Você abre a calculadora, mostra quanto ele vai pagar a mais em juros e a conversa muda. Tudo dentro do CRM, em tempo real.",
  },
];

const TESTIMONIALS = [
  {
    initials: 'RM',
    name: 'Rodrigo M.',
    location: 'São Paulo, SP',
    text: 'Antes eu perdia lead por esquecimento. Hoje o sistema me avisa quando um lead tá parado faz 3 dias. Fechei 3 contratos no primeiro mês só com quem eu já tinha na base.',
    result: '3 contratos fechados com leads que já tinha',
    avatarClass: 'bg-orange-500/20 text-orange-400',
  },
  {
    initials: 'PS',
    name: 'Patricia S.',
    location: 'Belo Horizonte, MG',
    text: 'Recebi um lead às 22h pelo Meta Ads. Quando acordei às 7h o lead já estava qualificado no sistema com valor de carta e tipo de bem. Entrei em contato na frente de todo mundo.',
    result: 'Primeiro contato antes da concorrência',
    avatarClass: 'bg-blue-500/20 text-blue-400',
  },
  {
    initials: 'DL',
    name: 'Diego L.',
    location: 'Goiânia, GO',
    text: 'Sou corretor autônomo, trabalho sozinho. Não tenho assistente. O GrowSorcio virou meu assistente de pré-venda. Reduzi o tempo de atendimento pela metade e aumentei minha carteira ativa em 40%.',
    result: 'Carteira ativa cresceu 40% sem contratar',
    avatarClass: 'bg-emerald-500/20 text-emerald-400',
  },
];


const FAQ_ITEMS = [
  {
    pergunta: 'Em quanto tempo eu começo a usar de verdade?',
    resposta: 'Em menos de 10 minutos você conecta seu Meta Ads, cadastra seu primeiro lead e já enxerga o funil funcionando. Sem onboarding de 2 semanas, sem treinamento obrigatório.',
  },
  {
    pergunta: 'Posso exportar meus dados se cancelar?',
    resposta: 'Sim. Seus leads, histórico e documentos são seus. Você exporta tudo em CSV a qualquer momento, sem burocracia. A gente não segura dado como refém.',
  },
  {
    pergunta: 'Funciona com Porto, Embracon, Ademicon e as outras?',
    resposta: 'Sim. O sistema é agnóstico de administradora. A calculadora usa matemática financeira pura — taxa de administração, fundo de reserva, parcela — e funciona para qualquer bandeira do mercado.',
  },
  {
    pergunta: 'O GrowSorcio funciona para qualquer administradora?',
    resposta: 'Sim. O sistema é agnóstico de administradora. Você cadastra os produtos e regras de cada uma.',
  },
  {
    pergunta: 'E se eu não for bom com tecnologia?',
    resposta: 'Foi feito para corretor, não para programador. Se você usa WhatsApp, você usa o GrowSorcio. E se travar em alguma coisa, o suporte responde no WhatsApp mesmo.',
  },
];

// Fix #2: Colunas coloridas com borda lateral por status
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

const PROOF_LOGOS = [
  { src: logoAdemicon, alt: 'Ademicon' },
  { src: logoEmbracon, alt: 'Embracon' },
  { src: logoHonda,    alt: 'Honda Consórcio' },
  { src: logoHS,       alt: 'HS Consórcios' },
  { src: logoMagalu,   alt: 'Consórcio Magalu' },
  { src: logoMaggi,    alt: 'Consórcio Maggi' },
  { src: logoPorto,    alt: 'Porto Seguro Consórcio' },
  { src: logoRodobens, alt: 'Rodobens Consórcio' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function LandingPage() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [aberto, setAberto] = useState(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-['Inter',sans-serif] overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-zinc-950/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <a href="#hero" className="flex items-center">
            <GrowsorcioLogo height={36} />
          </a>

          {/* Links centro — desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#recursos" className="text-zinc-400 hover:text-white transition-colors duration-150">Recursos</a>
            <a href="#precos" className="text-zinc-400 hover:text-white transition-colors duration-150">Preços</a>
            <a href="#faq" className="text-zinc-400 hover:text-white transition-colors duration-150">FAQ</a>
          </nav>

          {/* Ações direita */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-150 px-2 py-2 min-h-[44px] flex items-center">
              Entrar
            </a>
            <a
              href="#precos"
              className="bg-[#FF4500] hover:bg-[#e03e00] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors duration-150 min-h-[44px] flex items-center"
            >
              Testar Grátis 14 Dias
            </a>
          </div>

          {/* Hambúrguer mobile */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="md:hidden text-zinc-400 hover:text-white transition-colors duration-150 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Menu"
          >
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Menu mobile dropdown */}
        <AnimatePresence>
          {menuAberto && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="md:hidden border-t border-white/10 bg-zinc-950/95 px-4 py-4 flex flex-col gap-4"
            >
              <a href="#recursos" onClick={() => setMenuAberto(false)} className="text-zinc-300 hover:text-white text-sm font-medium py-2 min-h-[44px] flex items-center transition-colors duration-150">Recursos</a>
              <a href="#precos" onClick={() => setMenuAberto(false)} className="text-zinc-300 hover:text-white text-sm font-medium py-2 min-h-[44px] flex items-center transition-colors duration-150">Preços</a>
              <a href="#faq" onClick={() => setMenuAberto(false)} className="text-zinc-300 hover:text-white text-sm font-medium py-2 min-h-[44px] flex items-center transition-colors duration-150">FAQ</a>
              <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                <a href="/login" className="text-zinc-400 hover:text-white text-sm font-medium py-2 min-h-[44px] flex items-center transition-colors duration-150">Entrar</a>
                <a
                  href="#precos"
                  onClick={() => setMenuAberto(false)}
                  className="bg-[#FF4500] hover:bg-[#e03e00] text-white text-sm font-semibold px-4 py-3 rounded-md transition-colors duration-150 text-center min-h-[44px] flex items-center justify-center"
                >
                  Testar Grátis 14 Dias
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <HeroSection heroRef={heroRef} heroOpacity={heroOpacity} heroScale={heroScale} heroY={heroY} />

      {/* Gradient line divider */}
      <div className="gradient-line max-w-4xl mx-auto" />

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="recursos" className="relative max-w-6xl mx-auto px-4 py-24">
        <GradientBlobs className="opacity-50" />
        <div className="text-center mb-12 relative z-10">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3"
          >
            Por que funciona
          </motion.p>
          <TextReveal
            text="Construído para o jeito que corretor de consórcio vende"
            className="font-['Space_Grotesk',sans-serif] font-bold text-3xl md:text-4xl text-white"
            stagger={0.05}
          />
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-zinc-500 text-base max-w-2xl mx-auto mt-3"
          >
            Não é RD Station. Não é HubSpot. É um CRM que fala carta, lance, administradora e contemplação.
          </motion.p>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10" stagger={0.15}>
          {FEATURES.map((f) => (
            <motion.div key={f.titulo} variants={staggerItemVariants}>
              <GlowCard className="p-6 h-full">
                <AnimatedCounter
                  value={f.stat}
                  className="text-[#FF4500] font-['Space_Grotesk',sans-serif] font-bold text-3xl mb-1 block stat-glow"
                />
                <div className="p-3 rounded-lg bg-[#FF4500]/10 w-fit mb-4">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.titulo}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.descricao}</p>
              </GlowCard>
            </motion.div>
          ))}
        </StaggerContainer>
      </section>

      {/* ── URGÊNCIA ─────────────────────────────────────────────────────── */}
      <div className="gradient-line max-w-4xl mx-auto" />
      <section className="max-w-4xl mx-auto px-4 py-16 relative">
        <ParallaxSection speed={0.1}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="bg-white/5 border border-[#FF4500]/30 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,69,0,0.08),transparent)] pointer-events-none" />
            <div className="absolute inset-0 dot-grid pointer-events-none" />
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FF4500]/10 border border-[#FF4500]/30 mb-6"
              >
                <AnimatedCounter value={21} suffix="x" className="text-[#FF4500] text-4xl font-black stat-glow" />
              </motion.div>
            <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Quem responde primeiro, fecha primeiro.
            </h2>
            <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              Pesquisa do MIT mostrou que responder um lead em até 5 minutos aumenta em{' '}
              <span className="text-white font-semibold">21 vezes</span> a chance de fechar negócio.
              Depois de 30 minutos, essa chance cai mais de 100 vezes.
            </p>
            <div className="w-12 h-px bg-[#FF4500]/40 mx-auto mb-6" />
            <p className="text-zinc-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              O GrowSorcio entrega o lead do Meta Ads direto no seu celular com nome, interesse e valor
              de carta — e abre o WhatsApp com uma mensagem personalizada em{' '}
              <span className="text-[#FF4500] font-semibold">menos de 2 minutos</span>.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Sem GrowSorcio</p>
                <p className="text-white font-bold text-lg">+30 min</p>
                <p className="text-zinc-500 text-xs mt-1">para o primeiro contato</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[#FF4500]/10 rounded-xl p-4 border border-[#FF4500]/30"
              >
                <p className="text-[#FF4500] text-xs uppercase tracking-wider mb-1">Com GrowSorcio</p>
                <p className="text-white font-bold text-lg">-2 min</p>
                <p className="text-zinc-400 text-xs mt-1">do clique ao WhatsApp</p>
              </motion.div>
            </div>
          </div>
          </motion.div>
        </ParallaxSection>
      </section>

      {/* ── PROVA SOCIAL ─────────────────────────────────────────────────── */}
      <div className="gradient-line max-w-4xl mx-auto" />
      <section className="max-w-6xl mx-auto px-4 py-16 relative">
        <GradientBlobs className="opacity-30" />
        <div className="text-center mb-10 relative z-10">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3"
          >
            Quem já trocou a planilha
          </motion.p>
          <TextReveal
            text="Resultado de quem parou de improvisar"
            className="font-['Space_Grotesk',sans-serif] font-bold text-3xl md:text-4xl text-white"
            stagger={0.06}
          />
        </div>

        {/* Fix #5: Depoimentos com resultado destacado */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10" stagger={0.15}>
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={staggerItemVariants}>
              <GlowCard className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${t.avatarClass}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-zinc-500 text-xs">{t.location}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={12} className="text-[#FF4500] fill-[#FF4500]" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4 flex-1">"{t.text}"</p>
                <div className="border-t border-white/10 pt-3">
                  <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-wider">Resultado</p>
                  <p className="text-white font-bold text-sm mt-0.5">{t.result}</p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </StaggerContainer>

        {/* Carrossel de logos — administradoras */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest text-center mb-6">
            Usado por corretores das principais administradoras
          </p>
          <div className="proof-carousel">
            <div className="proof-marquee">
              {/* Set 1 */}
              {PROOF_LOGOS.map((logo) => (
                <img key={`a-${logo.alt}`} src={logo.src} alt={logo.alt} className="proof-logo" />
              ))}
              {/* Set 2 — duplicado para loop contínuo */}
              {PROOF_LOGOS.map((logo) => (
                <img key={`b-${logo.alt}`} src={logo.src} alt={logo.alt} className="proof-logo" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <div className="gradient-line max-w-4xl mx-auto" />
      <section id="faq" className="max-w-2xl mx-auto px-4 py-24 relative">
        <div className="text-center mb-12">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3"
          >
            FAQ
          </motion.p>
          <TextReveal
            text="Perguntas de quem tá quase convencido"
            className="font-['Space_Grotesk',sans-serif] font-bold text-3xl md:text-4xl text-white"
            stagger={0.06}
          />
        </div>

        <StaggerContainer className="flex flex-col" stagger={0.08}>
          {FAQ_ITEMS.map((item, i) => (
            <motion.div key={i} variants={staggerItemVariants} className="border-b border-white/10">
              <button
                onClick={() => setAberto(aberto === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left min-h-[44px] text-white font-medium hover:text-zinc-200 transition-colors duration-150"
              >
                <span>{item.pergunta}</span>
                <motion.div
                  animate={{ rotate: aberto === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={18} className="text-zinc-500 flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {aberto === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <p className="text-zinc-400 text-sm leading-relaxed pb-5">{item.resposta}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </StaggerContainer>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="text-zinc-500">© 2025 GrowSorcio. Todos os direitos reservados. CNPJ em registro.</p>
            <p className="text-zinc-600 text-sm">Feito no Brasil, para o mercado de consórcio brasileiro 🇧🇷</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 min-h-[44px]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg> Instagram
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors duration-150 flex items-center gap-1.5 min-h-[44px]">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">Termos</a>
              <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
