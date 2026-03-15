// /frontend/src/pages/LandingPage.jsx
import { useState } from 'react';
import { Zap, Brain, Calculator, Check, ChevronDown, Menu, X } from 'lucide-react';

const FEATURES = [
  {
    icon: <Zap size={22} className="text-[#FF4500]" />,
    titulo: 'Captação Automática',
    descricao: 'Receba leads do Meta Ads via Webhook direto. Sem planilhas, sem atraso.',
  },
  {
    icon: <Brain size={22} className="text-[#FF4500]" />,
    titulo: 'Qualificação Blessed',
    descricao: "Saiba o valor da carta, lance e urgência antes mesmo de dar o primeiro 'Oi'.",
  },
  {
    icon: <Calculator size={22} className="text-[#FF4500]" />,
    titulo: 'Fechamento Veloz',
    descricao: 'Calculadora integrada para quebrar objeções financeiras na hora.',
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
    btnClass:
      'w-full py-3 rounded-lg bg-[#FF4500] hover:bg-[#e03e00] text-white font-semibold transition-colors duration-150 min-h-[44px]',
  },
  {
    id: 'elite',
    nome: 'Grow ELITE AI',
    subtitulo: 'Escritórios',
    preco: 'R$ 997',
    destaque: false,
    badge: null,
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
    resposta:
      'Sim, ela é multibandeira e foca na matemática financeira pura.',
  },
];

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
        {menuAberto && (
          <div className="md:hidden border-t border-white/10 bg-zinc-950/95 px-4 py-4 flex flex-col gap-4">
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
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,69,0,0.15),transparent)]" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 flex flex-col items-center text-center gap-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] inline-block" />
            CRM verticalizado para consórcios
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
            Pare de perder vendas para a sua própria desorganização.
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl">
            O único CRM verticalizado para corretores de consórcio que integra Meta Ads, qualificação Blessed nativa e calculadora de investimentos em uma única tela.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a
              href="#precos"
              className="bg-[#FF4500] hover:bg-[#e03e00] text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-150 min-h-[44px] flex items-center justify-center"
            >
              Começar Agora →
            </a>
            <a
              href="#recursos"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-150 min-h-[44px] flex items-center justify-center"
            >
              Ver Demonstração
            </a>
          </div>

          {/* Mock dashboard */}
          <div className="w-full mt-4 aspect-video bg-white/5 border border-white/10 rounded-xl shadow-[0_0_80px_rgba(255,69,0,0.1)] flex items-center justify-center">
            <span className="text-zinc-600 text-sm font-medium">Dashboard GrowSorcio</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="recursos" className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">Recursos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Tudo que você precisa para fechar mais</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.titulo}
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur hover:border-white/20 transition-colors duration-150"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.titulo}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="precos" className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">Planos</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Escolha seu plano</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANOS.map((plano) => (
            <div
              key={plano.id}
              className={[
                'relative rounded-xl p-6 flex flex-col gap-6',
                plano.destaque
                  ? 'bg-white/5 border-2 border-[#FF4500] md:scale-105'
                  : 'bg-white/5 border border-white/10',
              ].join(' ')}
            >
              {plano.badge && (
                <span className="bg-[#FF4500] text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  {plano.badge}
                </span>
              )}

              <div>
                <p className="text-white font-bold text-lg">{plano.nome}</p>
                <p className="text-zinc-500 text-sm mt-0.5">{plano.subtitulo}</p>
              </div>

              <div>
                <span className="text-white text-4xl font-bold">{plano.preco}</span>
                <span className="text-zinc-500 text-sm">/mês</span>
              </div>

              <ul className="flex flex-col gap-2.5">
                {plano.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check size={14} className="text-[#FF4500] mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <button className={plano.btnClass}>
                {plano.btnLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-2xl mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <p className="text-[#FF4500] text-xs font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Dúvidas frequentes</h2>
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
              <div
                className={[
                  'overflow-hidden transition-all duration-200',
                  aberto === i ? 'max-h-40' : 'max-h-0',
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
          <p className="text-zinc-500">© 2025 GrowSorcio. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">Termos</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-300 transition-colors duration-150">Privacidade</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
