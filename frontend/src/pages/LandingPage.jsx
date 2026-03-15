import { useState, useEffect, useRef } from 'react';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconZap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-5 h-5">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconBrain = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-5 h-5">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.74A3 3 0 0 1 4.46 10a3 3 0 0 1 .6-5.55A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.74A3 3 0 0 0 19.54 10a3 3 0 0 0-.6-5.55A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const IconCalculator = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-5 h-5">
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="8" x2="8" y1="14" y2="14" />
    <line x1="12" x2="12" y1="14" y2="14" />
    <line x1="16" x2="16" y1="14" y2="14" />
    <line x1="8" x2="8" y1="18" y2="18" />
    <line x1="12" x2="12" y1="18" y2="18" />
    <line x1="16" x2="16" y1="18" y2="18" />
    <line x1="8" x2="12" y1="10" y2="10" />
    <line x1="16" x2="16" y1="10" y2="10" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconChevronDown = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconMenu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-6 h-6">
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-6 h-6">
    <line x1="18" x2="6" y1="6" y2="18" />
    <line x1="6" x2="18" y1="6" y2="18" />
  </svg>
);

// ─── useInView hook ───────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ question, answer, open, onToggle }) {
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full py-5 text-left text-white hover:text-zinc-300 transition-colors duration-200 min-h-[44px] gap-4"
      >
        <span className="font-medium">{question}</span>
        <IconChevronDown open={open} />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}
      >
        <p className="text-zinc-400 text-sm leading-relaxed pb-5">{answer}</p>
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer">
      <div className="w-10 h-10 rounded-lg bg-[#FF4500]/10 flex items-center justify-center mb-4 text-[#FF4500]">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Pricing Feature Row ──────────────────────────────────────────────────────

function PricingFeature({ text }) {
  return (
    <li className="flex items-start gap-2 text-sm text-zinc-300">
      <IconCheck />
      <span>{text}</span>
    </li>
  );
}

// ─── Kanban Mockup ────────────────────────────────────────────────────────────

function KanbanMockup() {
  const cols = [
    { label: 'Lead Novo', count: 4 },
    { label: 'Em Qualificação', count: 3 },
    { label: 'Simulação', count: 2 },
  ];
  return (
    <div className="mt-16 w-full max-w-4xl mx-auto rounded-xl border border-white/10 bg-white/5 shadow-[0_0_80px_rgba(255,69,0,0.08)] overflow-hidden">
      {/* window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-xs text-zinc-500 font-medium">GrowSorcio — Funil de Vendas</span>
      </div>
      {/* kanban columns */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {cols.map((col) => (
          <div key={col.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{col.label}</span>
              <span className="text-[10px] text-zinc-600 bg-white/5 rounded px-1.5 py-0.5">{col.count}</span>
            </div>
            {Array.from({ length: col.count }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg border border-white/10 p-3 space-y-2">
                <div className="bg-white/10 rounded h-2 animate-pulse" style={{ width: `${60 + (i * 13) % 35}%` }} />
                <div className="bg-white/[0.06] rounded h-2" style={{ width: `${40 + (i * 17) % 40}%` }} />
                <div className="flex gap-1.5 pt-1">
                  <div className="bg-[#FF4500]/20 rounded-full h-1.5 w-8" />
                  <div className="bg-white/10 rounded-full h-1.5 w-6" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  const [heroRef, heroVisible] = useInView(0.05);
  const [featuresRef, featuresVisible] = useInView(0.1);
  const [pricingRef, pricingVisible] = useInView(0.1);
  const [faqRef, faqVisible] = useInView(0.1);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const faqItems = [
    {
      q: 'O sistema é difícil de configurar?',
      a: 'Não. Em 2 minutos você conecta seu Meta Ads e já começa a receber leads. Nenhuma configuração técnica necessária.',
    },
    {
      q: 'Posso exportar meus dados se cancelar?',
      a: 'Sim, seus dados são seus. Exportação completa em CSV disponível a qualquer momento. Transparência total.',
    },
    {
      q: 'A Calculadora de Investimentos serve para qualquer banco?',
      a: 'Sim, ela é multibandeira e foca na matemática financeira pura — funciona com qualquer administradora de consórcio.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-zinc-950/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <span className="text-white font-bold text-lg tracking-tight">
            GrowSorcio<span className="text-[#FF4500]">.</span>
          </span>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {[['Recursos', 'recursos'], ['Preços', 'precos'], ['FAQ', 'faq']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Actions — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm">Contato</a>
            <a href="#" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm">Login</a>
            <a
              href="#"
              className="bg-[#FF4500] hover:bg-[#e03d00] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 min-h-[44px] inline-flex items-center"
            >
              Criar Conta
            </a>
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden text-zinc-400 hover:text-white transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Menu"
          >
            {menuOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-zinc-950/95 border-t border-white/10 px-4 py-4 flex flex-col gap-3">
            {[['Recursos', 'recursos'], ['Preços', 'precos'], ['FAQ', 'faq']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-zinc-300 hover:text-white transition-colors duration-200 text-sm text-left py-2 min-h-[44px]"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
              <a href="#" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm py-2">Contato</a>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors duration-200 text-sm py-2">Login</a>
              <a
                href="#"
                className="bg-[#FF4500] hover:bg-[#e03d00] text-white px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 text-center min-h-[44px] flex items-center justify-center"
              >
                Criar Conta
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        ref={heroRef}
        className={`min-h-screen flex flex-col items-center justify-center pt-20 px-4 text-center transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <span className="bg-white/5 border border-white/10 rounded-full px-4 py-1 text-xs text-zinc-400 inline-block mb-6">
          CRM #1 para Corretores de Consórcio
        </span>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight max-w-4xl">
          Pare de perder vendas para a sua própria desorganização.
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mt-4 leading-relaxed">
          O único CRM verticalizado para corretores de consórcio que integra Meta Ads, qualificação Blessed nativa e calculadora de investimentos em uma única tela.
        </p>

        <div className="flex gap-3 justify-center mt-8 flex-wrap">
          <button
            onClick={() => scrollTo('precos')}
            className="bg-[#FF4500] hover:bg-[#e03d00] text-white px-6 py-3 rounded-md font-semibold min-h-[44px] transition-colors duration-200 inline-flex items-center"
          >
            Começar Agora
          </button>
          <button
            onClick={() => scrollTo('recursos')}
            className="border border-white/20 text-zinc-300 hover:border-white/40 hover:text-white px-6 py-3 rounded-md font-medium min-h-[44px] transition-colors duration-200 inline-flex items-center"
          >
            Ver Recursos
          </button>
        </div>

        <KanbanMockup />
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section
        id="recursos"
        ref={featuresRef}
        className={`py-24 px-4 transition-all duration-700 ${featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-[#FF4500] text-sm font-semibold uppercase tracking-wider">Recursos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">
            Tudo que um corretor precisa.<br className="hidden md:block" /> Nada que ele não usa.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon={<IconZap />}
              title="Captação Automática"
              description="Receba leads do Meta Ads via Webhook direto. Sem planilhas, sem atraso. O lead cai no funil em segundos."
            />
            <FeatureCard
              icon={<IconBrain />}
              title="Qualificação Blessed"
              description="Saiba o valor da carta, lance e urgência antes mesmo de dar o primeiro 'Oi'. Priorize quem vai fechar."
            />
            <FeatureCard
              icon={<IconCalculator />}
              title="Fechamento Veloz"
              description="Calculadora integrada para quebrar objeções financeiras na hora. Mostre os números, feche o contrato."
            />
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section
        id="precos"
        ref={pricingRef}
        className={`py-24 px-4 bg-zinc-900/30 transition-all duration-700 ${pricingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-[#FF4500] text-sm font-semibold uppercase tracking-wider">Preços</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">
            Invista no seu crescimento.
          </h2>
          <p className="text-zinc-400 mt-3 text-base">Sem taxa de setup. Cancele quando quiser.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 items-start">

            {/* START */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Grow START</p>
              <h3 className="text-white font-bold text-xl mb-1">Organização e Validação</h3>
              <div className="flex items-baseline gap-1 mt-4 mb-2">
                <span className="text-4xl font-bold text-white">R$ 147</span>
                <span className="text-zinc-500 text-sm">/mês</span>
              </div>
              <span className="bg-white/5 text-zinc-400 text-xs px-3 py-1 rounded-full inline-block">Ideal para autônomos</span>
              <ul className="mt-6 space-y-3">
                {['Funil Blessed 4.0', 'Integração Meta Ads', 'Qualificação Blessed', 'Click-to-Zap', 'Calculadora Grow (Watermarked)'].map((f) => (
                  <PricingFeature key={f} text={f} />
                ))}
              </ul>
              <button className="border border-white/20 text-zinc-300 hover:border-white/40 hover:text-white w-full py-3 rounded-md text-sm font-medium transition-colors duration-200 mt-6 min-h-[44px]">
                Começar Agora
              </button>
            </div>

            {/* PRO — destaque */}
            <div className="bg-white/5 border-2 border-[#FF4500] rounded-xl p-6 relative md:-mt-4 shadow-[0_0_40px_rgba(255,69,0,0.1)] order-first md:order-none">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF4500] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                Mais Popular
              </span>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Grow PRO</p>
              <h3 className="text-white font-bold text-xl mb-1">Profissionalismo e Agilidade</h3>
              <div className="flex items-baseline gap-1 mt-4 mb-2">
                <span className="text-4xl font-bold text-white">R$ 447</span>
                <span className="text-zinc-500 text-sm">/mês</span>
              </div>
              <span className="bg-white/5 text-zinc-400 text-xs px-3 py-1 rounded-full inline-block">Pequenos Times</span>
              <ul className="mt-6 space-y-3">
                {[
                  'Tudo do START +',
                  'Até 03 usuários',
                  'Calculadora Personalizada',
                  'Cofre Digital',
                  'Follow-up Inteligente',
                  'Automação de Pré-Venda',
                  '01 Usuário WhatsApp API',
                ].map((f) => (
                  <PricingFeature key={f} text={f} />
                ))}
              </ul>
              <button className="bg-[#FF4500] hover:bg-[#e03d00] text-white w-full py-3 rounded-md text-sm font-bold transition-colors duration-200 mt-6 min-h-[44px]">
                Escolher PRO
              </button>
            </div>

            {/* ELITE */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Grow ELITE AI</p>
              <h3 className="text-white font-bold text-xl mb-1">Escala e Gestão com IA</h3>
              <div className="flex items-baseline gap-1 mt-4 mb-2">
                <span className="text-4xl font-bold text-white">R$ 997</span>
                <span className="text-zinc-500 text-sm">/mês</span>
              </div>
              <span className="bg-white/5 text-zinc-400 text-xs px-3 py-1 rounded-full inline-block">Escritórios</span>
              <ul className="mt-6 space-y-3">
                {[
                  'Tudo do PRO +',
                  'Usuários Ilimitados',
                  'Agente IA 24/7',
                  'IA Lead Scoring',
                  'Agendamento Automático',
                  'Painel BI',
                ].map((f) => (
                  <PricingFeature key={f} text={f} />
                ))}
              </ul>
              <button className="border border-white/20 text-zinc-300 hover:border-white/40 hover:text-white w-full py-3 rounded-md text-sm font-medium transition-colors duration-200 mt-6 min-h-[44px]">
                Falar com Consultor
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section
        id="faq"
        ref={faqRef}
        className={`py-24 px-4 max-w-3xl mx-auto transition-all duration-700 ${faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <p className="text-[#FF4500] text-sm font-semibold uppercase tracking-wider">FAQ</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-2 mb-10">
          Perguntas frequentes.
        </h2>
        {faqItems.map((item, i) => (
          <FaqItem
            key={i}
            question={item.q}
            answer={item.a}
            open={faqOpen === i}
            onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
          />
        ))}
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-zinc-500 text-sm">
        © 2025 GrowSorcio. Todos os direitos reservados.
      </footer>

    </div>
  );
}
