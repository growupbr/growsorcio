import { useState } from 'react';
import { X, Loader2, Lock } from 'lucide-react';
import { criarCheckout } from '../api/billing';

const PLAN_LABELS = {
  start: 'Grow START',
  pro:   'Grow PRO',
  elite: 'Grow ELITE AI',
};

const PRICES = {
  start:  { monthly: 147,  yearly: 117  },
  pro:    { monthly: 447,  yearly: 357  },
  elite:  { monthly: 997,  yearly: 797  },
};

export default function CheckoutModal({ plan, billingPeriod = 'monthly', onClose }) {
  const [form, setForm] = useState({ name: '', email: '', cellphone: '', taxId: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const price  = PRICES[plan]?.[billingPeriod] ?? 0;
  const label  = PLAN_LABELS[plan] ?? plan;
  const period = billingPeriod === 'yearly' ? 'ano' : 'mês';

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { url } = await criarCheckout({ plan, billingPeriod, ...form });
      window.location.href = url;
    } catch (err) {
      setErro(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <p className="text-white font-bold text-lg">{label}</p>
            <p className="text-zinc-400 text-sm mt-0.5">
              R$ <span className="text-white font-semibold">{price.toLocaleString('pt-BR')}</span>/{period}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="label">Nome completo</label>
            <input
              className="input"
              placeholder="João da Silva"
              value={form.name}
              onChange={set('name')}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">E-mail</label>
            <input
              className="input"
              type="email"
              placeholder="joao@email.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label">WhatsApp</label>
              <input
                className="input"
                placeholder="(11) 99999-9999"
                value={form.cellphone}
                onChange={set('cellphone')}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">CPF</label>
              <input
                className="input"
                placeholder="000.000.000-00"
                value={form.taxId}
                onChange={set('taxId')}
                required
              />
            </div>
          </div>

          {erro && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center mt-2 min-h-[48px] text-base"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Aguarde...</>
              : 'Ir para pagamento →'
            }
          </button>

          <p className="text-zinc-600 text-xs text-center flex items-center justify-center gap-1">
            <Lock size={11} /> Pagamento seguro via AbacatePay · PIX ou Cartão
          </p>
        </form>
      </div>
    </div>
  );
}
