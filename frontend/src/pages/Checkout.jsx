import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Lock, CheckCircle, ArrowLeft, Shield, Zap } from 'lucide-react';
import { criarCheckoutPublico } from '../api/billing';
import GrowsorcioLogo from '../components/GrowsorcioLogo';

// ─── Dados dos planos ─────────────────────────────────────────────────────────
const PLANS = {
  start: {
    name: 'Grow START',
    price: { monthly: 147, yearly: 117 },
    yearlyTotal: 1404,
    color: '#6366f1',
    features: ['Funil Blessed 4.0 (10 etapas)', 'Integração Meta Ads via Webhook', 'Click-to-Zap dinâmico', 'Calculadora Consórcio x Financiamento', '01 usuário'],
  },
  pro: {
    name: 'Grow PRO',
    price: { monthly: 447, yearly: 357 },
    yearlyTotal: 4284,
    color: '#FF4500',
    badge: 'MAIS POPULAR',
    features: ['Tudo do START +', 'Até 03 usuários', 'Calculadora com sua marca (PDF)', 'Follow-up Inteligente', 'Cofre Digital de Documentos'],
  },
  elite: {
    name: 'Grow ELITE AI',
    price: { monthly: 997, yearly: 797 },
    yearlyTotal: 9564,
    color: '#f59e0b',
    features: ['Tudo do PRO +', 'Usuários ilimitados', 'Agente IA 24/7', 'Lead Scoring por IA', 'WhatsApp API integrado', 'Onboarding VIP'],
  },
};

// ─── Máscaras de input ────────────────────────────────────────────────────────
function maskPhone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCPF(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const planId = searchParams.get('plan') || 'pro';
  const period = searchParams.get('period') || 'monthly';
  const isYearly = period === 'yearly';

  const plan = PLANS[planId] || PLANS.pro;
  const price = plan.price[period];
  const label = isYearly ? 'ano' : 'mês';

  const [form, setForm] = useState({ name: '', email: '', cellphone: '', taxId: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  function set(field, transformer) {
    return (e) => {
      const val = transformer ? transformer(e.target.value) : e.target.value;
      setForm((f) => ({ ...f, [field]: val }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { url } = await criarCheckoutPublico({
        plan: planId,
        billingPeriod: period,
        ...form,
        cellphone: form.cellphone.replace(/\D/g, ''),
        taxId: form.taxId.replace(/\D/g, ''),
      });
      window.location.href = url;
    } catch (err) {
      setErro(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
      setLoading(false);
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e8e8e8',
  };
  const inputFocus = {
    border: '1px solid rgba(255,100,20,0.5)',
    boxShadow: '0 0 0 3px rgba(255,69,0,0.1)',
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 60% 0%, #1a0e00 0%, #0d0d0d 40%, #080808 100%)' }}
    >
      {/* Glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(255,69,0,0.08) 0%, transparent 70%)' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition-colors hover:text-orange-400"
          style={{ color: '#888' }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <GrowsorcioLogo height={32} />
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#555' }}>
          <Lock size={13} />
          <span>Pagamento seguro</span>
        </div>
      </header>

      {/* Body */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Lado esquerdo: resumo do plano ── */}
          <div className="space-y-6">
            <div>
              {plan.badge && (
                <span className="inline-block text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full mb-3"
                  style={{ background: 'rgba(255,69,0,0.15)', color: '#ff6b35', border: '1px solid rgba(255,69,0,0.2)' }}>
                  {plan.badge}
                </span>
              )}
              <h1 className="text-3xl font-bold text-white">{plan.name}</h1>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className="text-zinc-500 text-lg">R$</span>
                <span className="text-5xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {price.toLocaleString('pt-BR')}
                </span>
                <span className="text-zinc-400 text-lg">/{label}</span>
              </div>
              {isYearly && (
                <p className="text-sm mt-1.5" style={{ color: '#4ade80' }}>
                  💰 Economia de R$ {(plan.price.monthly * 12 - plan.yearlyTotal).toLocaleString('pt-BR')}/ano
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />

            {/* Features */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>Incluso no plano</p>
              {plan.features.map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <CheckCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                  <span className="text-sm" style={{ color: '#c0c0c0' }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />

            {/* Garantias */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Shield size={16} style={{ color: '#4ade80' }} />
                <span className="text-sm" style={{ color: '#888' }}>7 dias de garantia incondicional</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Zap size={16} style={{ color: '#facc15' }} />
                <span className="text-sm" style={{ color: '#888' }}>Acesso imediato após confirmação</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock size={16} style={{ color: '#60a5fa' }} />
                <span className="text-sm" style={{ color: '#888' }}>Dados protegidos · SSL · AbacatePay</span>
              </div>
            </div>
          </div>

          {/* ── Lado direito: formulário ── */}
          <div className="rounded-2xl p-8"
            style={{
              background: 'rgba(18,12,6,0.85)',
              border: '1px solid rgba(255,100,20,0.12)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6)',
            }}>

            <h2 className="text-lg font-bold text-white mb-1">Seus dados</h2>
            <p className="text-sm mb-6" style={{ color: '#666' }}>Preencha para gerar seu link de pagamento</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>
                  Nome completo
                </label>
                <input
                  required
                  placeholder="João da Silva"
                  value={form.name}
                  onChange={set('name')}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>
                  E-mail
                </label>
                <input
                  required
                  type="email"
                  placeholder="joao@email.com"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }}
                  autoComplete="email"
                />
              </div>

              {/* WhatsApp + CPF */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>
                    WhatsApp
                  </label>
                  <input
                    required
                    placeholder="(11) 99999-9999"
                    value={form.cellphone}
                    onChange={set('cellphone', maskPhone)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, inputFocus)}
                    onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }}
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>
                    CPF
                  </label>
                  <input
                    required
                    placeholder="000.000.000-00"
                    value={form.taxId}
                    onChange={set('taxId', maskCPF)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, inputFocus)}
                    onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Erro */}
              {erro && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {erro}
                </p>
              )}

              {/* Resumo do pedido */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#888' }}>{plan.name} · {isYearly ? 'Anual' : 'Mensal'}</span>
                  <span className="text-white font-semibold">R$ {price.toLocaleString('pt-BR')}/{label}</span>
                </div>
                {isYearly && (
                  <div className="flex items-center justify-between text-sm mt-1.5">
                    <span style={{ color: '#666' }}>Total à vista</span>
                    <span style={{ color: '#4ade80' }}>R$ {plan.yearlyTotal.toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 min-h-[52px]"
                style={{
                  background: loading
                    ? 'rgba(255,69,0,0.4)'
                    : 'linear-gradient(135deg, #FF4500, #ff6b35)',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(255,69,0,0.25)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Aguardando...</>
                ) : (
                  <>Ir para pagamento →</>
                )}
              </button>

              <p className="text-center text-xs flex items-center justify-center gap-1.5" style={{ color: '#555' }}>
                <Lock size={11} />
                Pagamento processado via AbacatePay · PIX ou Cartão
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs" style={{ color: '#444' }}>
        © 2026 Growsorcio · Todos os direitos reservados
      </footer>
    </div>
  );
}
