import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Lock, CheckCircle, ArrowLeft, Shield, Zap, Copy, Check } from 'lucide-react';
import { criarPix, verificarPix } from '../api/billing';
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

function validarCPF(cpf) {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // todos iguais (000...000, 111...111)
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

const ERROS_API = {
  'Invalid taxId': 'CPF inválido. Verifique os números e tente novamente.',
  'Invalid cellphone': 'WhatsApp inválido. Use o formato (XX) 99999-9999.',
  'Customer already exists': 'E-mail já cadastrado. Tente outro e-mail.',
  'Invalid email': 'E-mail inválido.',
  'Failed to fetch': 'Não foi possível conectar ao servidor. Tente novamente em instantes.',
};

function traduzirErro(msg) {
  for (const [key, val] of Object.entries(ERROS_API)) {
    if (msg?.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return msg || 'Erro ao iniciar pagamento. Tente novamente.';
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

  // Estágio: 'form' | 'pix' | 'paid'
  const [stage, setStage] = useState('form');

  const [form, setForm] = useState({ name: '', email: '', cellphone: '', taxId: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Dados do PIX gerado
  const [pix, setPix] = useState(null); // { pixId, brCode, qrCodeImage, amount, expiresAt }
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef(null);

  function set(field, transformer) {
    return (e) => {
      const val = transformer ? transformer(e.target.value) : e.target.value;
      setForm((f) => ({ ...f, [field]: val }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    const cpfLimpo = form.taxId.replace(/\D/g, '');
    if (!validarCPF(cpfLimpo)) {
      setErro('CPF inválido. Verifique os números e tente novamente.');
      return;
    }
    const celLimpo = form.cellphone.replace(/\D/g, '');
    if (celLimpo.length < 10) {
      setErro('WhatsApp inválido. Use o formato (XX) 99999-9999.');
      return;
    }

    setLoading(true);
    try {
      const data = await criarPix({
        plan: planId,
        billingPeriod: period,
        ...form,
        cellphone: celLimpo,
        taxId: cpfLimpo,
      });
      setPix(data);
      setStage('pix');
      startPolling(data.pixId);
    } catch (err) {
      setErro(traduzirErro(err.message));
    } finally {
      setLoading(false);
    }
  }

  function startPolling(pixId) {
    pollingRef.current = setInterval(async () => {
      try {
        const { status } = await verificarPix(pixId);
        if (status === 'PAID') {
          clearInterval(pollingRef.current);
          setStage('paid');
        }
        if (status === 'EXPIRED') {
          clearInterval(pollingRef.current);
          setStage('form');
          setErro('O PIX expirou. Gere um novo.');
        }
      } catch { /* ignora erros de polling */ }
    }, 4000);
  }

  useEffect(() => () => clearInterval(pollingRef.current), []);

  async function copiar() {
    await navigator.clipboard.writeText(pix.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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

  // ─── Layout wrapper ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 60% 0%, #1a0e00 0%, #0d0d0d 40%, #080808 100%)' }}>
      {/* Glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(255,69,0,0.08) 0%, transparent 70%)' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => stage === 'pix' ? setStage('form') : navigate(-1)}
          className="flex items-center gap-2 text-sm transition-colors hover:text-orange-400" style={{ color: '#888' }}>
          <ArrowLeft size={16} />
          Voltar
        </button>
        <GrowsorcioLogo height={96} />
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#555' }}>
          <Lock size={13} />
          <span>Pagamento seguro</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-start justify-center px-4 py-10">

        {/* ── Estágio: PAGO ── */}
        {stage === 'paid' && (
          <div className="flex flex-col items-center gap-6 text-center max-w-sm pt-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid #4ade80' }}>
              <CheckCircle size={40} style={{ color: '#4ade80' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Pagamento confirmado!</h1>
              <p className="text-zinc-400 mt-2">Acesso ao GrowSorcio liberado. Verifique seu e-mail.</p>
            </div>
            <a href="https://app.growsorcio.com.br"
              className="w-full py-3 rounded-xl font-semibold text-white text-center"
              style={{ background: 'linear-gradient(135deg,#FF4500,#ff6b35)', boxShadow: '0 4px 24px rgba(255,69,0,0.25)' }}>
              Acessar a plataforma →
            </a>
          </div>
        )}

        {/* ── Estágio: QR PIX ── */}
        {stage === 'pix' && pix && (
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resumo à esquerda igual ao formulário */}
            <PlanSummary plan={plan} price={price} label={label} isYearly={isYearly} />

            {/* QR PIX à direita */}
            <div className="rounded-2xl p-8 flex flex-col items-center gap-5"
              style={{ background: 'rgba(18,12,6,0.85)', border: '1px solid rgba(255,100,20,0.12)', backdropFilter: 'blur(24px)', boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6)' }}>

              <div className="text-center">
                <h2 className="text-lg font-bold text-white">Pague com PIX</h2>
                <p className="text-sm mt-1" style={{ color: '#666' }}>Escaneie o QR code no seu app de banco</p>
              </div>

              {/* QR Code */}
              <div className="p-3 rounded-2xl" style={{ background: '#fff' }}>
                <img src={pix.qrCodeImage} alt="QR Code PIX" className="w-48 h-48" />
              </div>

              {/* Valor */}
              <p className="text-white font-bold text-xl">
                R$ {(pix.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>

              {/* Copia-e-cola */}
              <div className="w-full space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-center" style={{ color: '#666' }}>
                  Ou copie o código PIX
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={pix.brCode}
                    className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none truncate"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#888' }}
                  />
                  <button onClick={copiar}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(255,69,0,0.15)', color: copied ? '#4ade80' : '#ff6b35', border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,69,0,0.3)'}` }}>
                    {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
              </div>

              {/* Aguardando */}
              <div className="flex items-center gap-2 text-sm" style={{ color: '#666' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: '#FF4500' }} />
                Aguardando confirmação do pagamento…
              </div>
            </div>
          </div>
        )}

        {/* ── Estágio: FORMULÁRIO ── */}
        {stage === 'form' && (
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PlanSummary plan={plan} price={price} label={label} isYearly={isYearly} />

            <div className="rounded-2xl p-8"
              style={{ background: 'rgba(18,12,6,0.85)', border: '1px solid rgba(255,100,20,0.12)', backdropFilter: 'blur(24px)', boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 64px rgba(0,0,0,0.6)' }}>

              <h2 className="text-lg font-bold text-white mb-1">Seus dados</h2>
              <p className="text-sm mb-6" style={{ color: '#666' }}>Preencha para gerar o QR Code PIX</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>Nome completo</label>
                  <input required placeholder="João da Silva" value={form.name} onChange={set('name')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, inputFocus)}
                    onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }} />
                </div>
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>E-mail</label>
                  <input required type="email" placeholder="joao@email.com" value={form.email} onChange={set('email')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                    style={inputStyle} autoComplete="email"
                    onFocus={e => Object.assign(e.target.style, inputFocus)}
                    onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }} />
                </div>
                {/* WhatsApp + CPF */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>WhatsApp</label>
                    <input required placeholder="(11) 99999-9999" value={form.cellphone} onChange={set('cellphone', maskPhone)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                      style={inputStyle} autoComplete="tel"
                      onFocus={e => Object.assign(e.target.style, inputFocus)}
                      onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: '#888' }}>CPF</label>
                    <input required placeholder="000.000.000-00" value={form.taxId} onChange={set('taxId', maskCPF)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={e => Object.assign(e.target.style, inputFocus)}
                      onBlur={e => { e.target.style.border = inputStyle.border; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>

                {erro && (
                  <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{erro}</p>
                )}

                {/* Resumo */}
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

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white min-h-[52px] transition-all duration-200"
                  style={{ background: loading ? 'rgba(255,69,0,0.4)' : 'linear-gradient(135deg,#FF4500,#ff6b35)', boxShadow: loading ? 'none' : '0 4px 24px rgba(255,69,0,0.25)', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Gerando PIX…</> : <>Gerar QR Code PIX →</>}
                </button>

                <p className="text-center text-xs flex items-center justify-center gap-1.5" style={{ color: '#555' }}>
                  <Lock size={11} />
                  Pagamento via PIX · Confirmação instantânea
                </p>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-4 text-center text-xs" style={{ color: '#444' }}>
        © 2026 Growsorcio · Todos os direitos reservados
      </footer>
    </div>
  );
}

// ─── Componente auxiliar: resumo do plano (reutilizado nos 2 estágios) ─────────
function PlanSummary({ plan, price, label, isYearly }) {
  return (
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
          <span className="text-5xl font-bold text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
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
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>Incluso no plano</p>
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2.5">
            <CheckCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
            <span className="text-sm" style={{ color: '#c0c0c0' }}>{f}</span>
          </div>
        ))}
      </div>
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
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
          <span className="text-sm" style={{ color: '#888' }}>Dados protegidos · SSL · PIX</span>
        </div>
      </div>
    </div>
  );
}

