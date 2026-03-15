// /frontend/src/pages/LandingPage.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, Calculator, ChevronDown, Menu, X, Star, MessageCircle } from 'lucide-react';
import PricingSection from '../components/ui/PricingSection';

const FEATURES = [
  {
    icon: <Zap size={22} className="text-[#FF4500]" />,
    stat: '2 min',
    titulo: 'Captação Automática',
    descricao: 'Receba leads do Meta Ads via Webhook direto. Sem planilhas, sem atraso.',
  },
  {
    icon: <Brain size={22} className="text-[#FF4500]" />,
    stat: '4 campos',
    titulo: 'Qualificação Blessed',
    descricao: "Saiba o valor da carta, lance e urgência antes mesmo de dar o primeiro 'Oi'.",
  },
  {
    icon: <Calculator size={22} className="text-[#FF4500]" />,
    stat: '87%',
    titulo: 'Fechamento Veloz',
    descricao: 'Calculadora integrada para quebrar objeções financeiras na hora.',
  },
];

const TESTIMONIALS = [
  {
    initials: 'RM',
    name: 'Rodrigo M.',
    location: 'São Paulo, SP',
    text: 'Fechei 3 vendas no primeiro mês. O kanban me mostrou onde eu estava perdendo tempo.',
    result: '3 vendas fechadas no 1º mês',
    avatarClass: 'bg-orange-500/20 text-orange-400',
  },
  {
    initials: 'PS',
    name: 'Patricia S.',
    location: 'Belo Horizonte, MG',
    text: 'Antes eu usava planilha. Agora recebo lead do Meta e já sei o valor da carta na hora.',
    result: 'Zerou planilha, adotou em 1 dia',
    avatarClass: 'bg-blue-500/20 text-blue-400',
  },
  {
    initials: 'DL',
    name: 'Diego L.',
    location: 'Goiânia, GO',
    text: 'O follow-up inteligente me poupou 2h por dia. Simples, direto, sem frescura.',
    result: '2h/dia economizadas no follow-up',
    avatarClass: 'bg-emerald-500/20 text-emerald-400',
  },
];

const PLANOS = [
  {
    id: 'start',
    nome: 'Grow START',
    subtitulo: 'Corretor Solo',
    preco: 'R$ 147',
    destaque: false,
    badge: null,
    launchBadge: true,
    features: [
      'Funil Blessed 4.0',
      'Integração Meta Ads',
      'Qualificação Blessed',
      'Click-to-Zap',
      'Calculadora Grow (Watermarked)',
    ],
    btnLabel: 'Assinar Start',
    btnClass:
      'w-full py-3 rounded-lg border border-white/20 text-white font-semibold hover:border-white/40 transition-colors duration-150 min-h-[44px]',
  },
  {
    id: 'pro',
    nome: 'Grow PRO',
    subtitulo: 'Pequenos Times',
    preco: 'R$ 447',
    destaque: true,
    badge: 'Recomendado',
    launchBadge: false,
    features: [
      'Tudo do START +',
      'Até 03 usuários',
      'Calculadora Personalizada',
      'Cofre Digital',
      'Follow-up Inteligente',
      'Automação de Pré-Venda',
      '01 Usuário WhatsApp API',
    ],
    btnLabel: 'Escalar com o Pro',
    btnClass: 'w-full py-3 rounded-lg btn-shimmer text-white font-semibold transition-colors duration-150 min-h-[44px]',
  },
  {
    id: 'elite',
    nome: 'Grow ELITE AI',
    subtitulo: 'Escritórios',
    preco: 'R$ 997',
    destaque: false,
    badge: null,
    launchBadge: false,
    features: [
      'Tudo do PRO +',
      'Usuários Ilimitados',
      'Agente IA 24/7',
      'Lead Scoring IA',
      'Agendamento Automático',
      'Painel BI',
    ],
    btnLabel: 'Falar com Consultor',
    btnClass:
      'w-full py-3 rounded-lg border border-white/20 text-white font-semibold hover:border-white/40 transition-colors duration-150 min-h-[44px]',
  },
];

const FAQ_ITEMS = [
  {
    pergunta: 'O sistema é difícil de configurar?',
    resposta: 'Não. Em 2 minutos você conecta seu Meta Ads e já começa a receber leads.',
  },
  {
    pergunta: 'Posso exportar meus dados se cancelar?',
    resposta: 'Sim, seus dados são seus. Transparência total.',
  },
  {
    pergunta: 'A Calculadora serve para qualquer administradora?',
    resposta: 'Sim, ela é multibandeira e foca na matemática financeira pura.',
  },
  {
    pergunta: 'O GrowSorcio funciona para qualquer administradora?',
    resposta: 'Sim. O sistema é agnóstico de administradora. Você cadastra os produtos e regras de cada uma.',
  },
  {
    pergunta: 'Preciso de computador para usar?',
    resposta: 'Não. O GrowSorcio é 100% mobile-first. Funciona perfeitamente no celular, no campo, durante a visita.',
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function LandingPage() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [aberto, setAberto] = useState(null);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-['Inter',sans-serif]">

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-zinc-950/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <a href="#hero" className="flex items-center gap-0.5 text-xl font-bold text-white">
            GrowSorcio<span className="text-[#FF4500]">.</span>
          </a>

          {/* Links centro — desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#recursos" className="text-zinc-400 hover:text-white transition-colors duration-150">Recursos</a>
            <a href="#precos" className="text-zinc-400 hover:text-white transition-colors duration-150">Preços</a>
            <a href="#faq" className="text-zinc-400 hover:text-white transition-colors duration-150">FAQ</a>
          </nav>

          {/* Ações direita */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors duration-150 px-2 py-2 min-h-[44px] flex items-center">
              Entrar
            </a>
            <a
              href="#precos"
              className="bg-[#FF4500] hover:bg-[#e03e00] text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors duration-150 min-h-[44px] flex items-center"
            >
              Criar Conta
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
                <a href="#" className="text-zinc-400 hover:text-white text-sm font-medium py-2 min-h-[44px] flex items-center transition-colors duration-150">Entrar</a>
                <a
                  href="#precos"
                  onClick={() => setMenuAberto(false)}
                  className="bg-[#FF4500] hover:bg-[#e03e00] text-white text-sm font-semibold px-4 py-3 rounded-md transition-colors duration-150 text-center min-h-[44px] flex items-center justify-center"
                >
                  Criar Conta
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,69,0,0.15),transparent)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center text-center gap-8">

          {/* Badge animado */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-zinc-400"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            127 corretores ativos hoje
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            className="font-['Space_Grotesk',sans-serif] font-bold text-4xl md:text-6xl text-white tracking-tight leading-tight"
          >
            Pare de perder vendas para a sua própria desorganização.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl font-['Inter',sans-serif]"
          >
            O único CRM para corretores de consórcio com Meta Ads, qualificação Blessed e calculadora em uma tela.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <a
              href="#precos"
              className="cta-pulse bg-[#FF4500] hover:bg-[#e03e00] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-150 min-h-[44px] flex items-center justify-center"
            >
              Começar Agora →
            </a>
            <a
              href="#recursos"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-150 min-h-[44px] flex items-center justify-center"
            >
              Ver Demonstração
            </a>
          </motion.div>

          {/* Kanban mock */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
            className="w-full mt-8 aspect-video bg-zinc-900 border border-white/10 rounded-xl shadow-[0_0_80px_rgba(255,69,0,0.08)] overflow-hidden p-4 flex gap-3"
          >
            {KANBAN_COLS.map((col) => (
              <div key={col.col} className="flex-1 flex flex-col gap-2 min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wider truncate ${col.titleClass}`}>{col.col}</p>
                {col.cards.map((name, ci) => (
                  <div key={name} className={`bg-white/5 border border-white/10 ${col.borderClass} rounded-lg p-2.5 relative`}>
                    {ci === 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                    <p className="text-zinc-300 text-xs font-medium truncate">{name}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">Consórcio · R$ 85k</p>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="recursos" className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">Recursos</p>
          <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl md:text-4xl text-white">Tudo que você precisa para fechar mais</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.titulo}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur"
            >
              <p className="text-[#FF4500] font-['Space_Grotesk',sans-serif] font-bold text-3xl mb-1">{f.stat}</p>
              <div className="p-3 rounded-lg bg-[#FF4500]/10 w-fit mb-4">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.titulo}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.descricao}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PROVA SOCIAL ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">Depoimentos</p>
          <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl md:text-4xl text-white">Corretores que já escalam</h2>
        </div>

        {/* Fix #5: Depoimentos com resultado destacado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur flex flex-col"
            >
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
            </motion.div>
          ))}
        </div>

        {/* Logos parceiros */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-zinc-600 font-semibold text-sm">
          <span>Corretores parceiros de:</span>
          {['Porto Seguro', 'Embracon', 'Ademicon', 'Caixa', 'Itaú Consórcios'].map((brand, i, arr) => (
            <span key={brand} className="flex items-center gap-2">
              <span>{brand}</span>
              {i < arr.length - 1 && <span className="text-zinc-800">·</span>}
            </span>
          ))}
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <PricingSection />

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-2xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="font-['Space_Grotesk',sans-serif] font-bold text-3xl md:text-4xl text-white">Dúvidas frequentes</h2>
        </div>

        <div className="flex flex-col">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-white/10">
              <button
                onClick={() => setAberto(aberto === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left min-h-[44px] text-white font-medium hover:text-zinc-200 transition-colors duration-150"
              >
                <span>{item.pergunta}</span>
                <ChevronDown
                  size={18}
                  className={[
                    'text-zinc-500 flex-shrink-0 transition-transform duration-200',
                    aberto === i ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </button>
              {/* Fix #6: opacity + max-h para accordion fluido */}
              <div
                className={[
                  'overflow-hidden transition-all duration-300',
                  aberto === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
                ].join(' ')}
              >
                <p className="text-zinc-400 text-sm leading-relaxed pb-5">{item.resposta}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="text-zinc-500">© 2025 GrowSorcio. Todos os direitos reservados.</p>
            <p className="text-zinc-600 text-sm">Feito para corretores de consórcio 🇧🇷</p>
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
