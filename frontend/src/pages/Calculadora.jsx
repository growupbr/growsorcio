import { useState, useMemo } from 'react';
import {
  Calculator, TrendingDown, CheckCircle, MessageCircle,
  DollarSign, Clock, Percent, ArrowRight,
} from 'lucide-react';

// ─── Formatação ───────────────────────────────────────────────────────────────

const fmtBRL = (n) =>
  !isFinite(n) || isNaN(n) || n <= 0
    ? 'R$ —'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(n);

/** Converte string com máscara (1.000.000) em número */
const toNum = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;

/** Aplica máscara de milhar em valor de moeda */
const maskMoney = (raw) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('pt-BR');
};

// ─── Cálculos ─────────────────────────────────────────────────────────────────

function calcular({ valorCredito, prazoC, taxaAdm, valorEntrada, prazoF, taxaJurosAA }) {
  // Consórcio — custo = valor × (1 + taxa%), parcela = custo / prazo
  const totalC = valorCredito * (1 + taxaAdm / 100);
  const parcelaC = prazoC > 0 ? totalC / prazoC : 0;

  // Financiamento — Sistema Price
  const principal = valorCredito - valorEntrada;
  const iMensal = taxaJurosAA / 12 / 100;
  let parcelaF = 0;
  let totalF = 0;

  if (principal > 0 && prazoF > 0) {
    if (iMensal === 0) {
      parcelaF = principal / prazoF;
    } else {
      const fator = Math.pow(1 + iMensal, prazoF);
      parcelaF = (principal * iMensal * fator) / (fator - 1);
    }
    totalF = parcelaF * prazoF + valorEntrada;
  }

  return { parcelaC, parcelaF, totalC, totalF, economia: totalF - totalC };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label, accent }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className={`flex items-center justify-center w-6 h-6 rounded-md ${accent}`}>
        <Icon size={13} className="text-zinc-100" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</span>
    </div>
  );
}

function Field({ label, value, onChange, prefix, suffix, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-zinc-500 text-sm pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          inputMode={type === 'number' ? 'decimal' : 'numeric'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={type === 'number' ? 0 : undefined}
          className={[
            'w-full bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-100',
            'placeholder-zinc-600 py-2.5 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30',
            prefix ? 'pl-8' : 'pl-3',
            suffix ? 'pr-10' : 'pr-3',
          ].join(' ')}
        />
        {suffix && (
          <span className="absolute right-3 text-zinc-500 text-sm pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function MiniCard({ label, value, highlight }) {
  return (
    <div className="bg-zinc-950 border border-white/5 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-lg font-bold tabular-nums ${highlight}`}>{value}</span>
    </div>
  );
}

function BarComparativa({ totalC, totalF }) {
  const max = Math.max(totalC, totalF, 1);
  const pctC = Math.round((totalC / max) * 100);
  const pctF = Math.round((totalF / max) * 100);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Custo Total</p>
      <div className="space-y-3">
        {[
          { label: 'Consórcio', value: totalC, pct: pctC, color: 'from-orange-500 to-orange-400', text: 'text-orange-400' },
          { label: 'Financiamento', value: totalF, pct: pctF, color: 'from-red-600 to-red-500', text: 'text-red-400' },
        ].map(({ label, value, pct, color, text }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-zinc-400">{label}</span>
              <span className={`text-xs font-semibold tabular-nums ${text}`}>{fmtBRL(value)}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toast({ show }) {
  return (
    <div
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5',
        'bg-zinc-800 border border-white/10 text-sm text-zinc-100 px-5 py-3 rounded-2xl shadow-2xl',
        'transition-all duration-300 select-none',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
    >
      <CheckCircle size={16} className="text-orange-400 shrink-0" />
      Resumo copiado! Cole no WhatsApp do cliente.
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Calculadora() {
  // Consórcio
  const [valorCreditoStr, setValorCreditoStr] = useState('80000');
  const [prazoC, setPrazoC] = useState('180');
  const [taxaAdm, setTaxaAdm] = useState('16');
  // Financiamento
  const [valorEntradaStr, setValorEntradaStr] = useState('20000');
  const [prazoF, setPrazoF] = useState('360');
  const [taxaJuros, setTaxaJuros] = useState('12');
  const [showToast, setShowToast] = useState(false);

  const handleMoneyChange = (setter) => (e) => {
    setter(maskMoney(e.target.value));
  };

  const res = useMemo(() => calcular({
    valorCredito: toNum(valorCreditoStr),
    prazoC:       parseInt(prazoC, 10) || 0,
    taxaAdm:      parseFloat(taxaAdm.replace(',', '.')) || 0,
    valorEntrada: toNum(valorEntradaStr),
    prazoF:       parseInt(prazoF, 10) || 0,
    taxaJurosAA:  parseFloat(taxaJuros.replace(',', '.')) || 0,
  }), [valorCreditoStr, prazoC, taxaAdm, valorEntradaStr, prazoF, taxaJuros]);

  const handleCopiar = async () => {
    const texto =
      `Olá! Fiz a simulação que combinamos. 🏠\n\n` +
      `Para um crédito de ${fmtBRL(toNum(valorCreditoStr))}, no consórcio sua parcela fica em torno de ${fmtBRL(res.parcelaC)}/mês, sem juros.\n\n` +
      `Se fôssemos para o financiamento, sua parcela saltaria para ${fmtBRL(res.parcelaF)}/mês.\n\n` +
      `No final das contas, o consórcio te faz economizar ${fmtBRL(res.economia)}! 💰\n\n` +
      `Vamos dar andamento?`;

    try {
      await navigator.clipboard.writeText(texto);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      // fallback: seleção manual
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen">
      {/* ── Header ── */}
      <div className="mb-8 border-b border-white/5 pb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10">
              <Calculator size={18} className="text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Calculadora</h1>
          </div>
          <p className="text-sm text-zinc-500 pl-11">Compare Consórcio vs Financiamento em tempo real</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/20 mt-1">
          Plano START
        </span>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ─── Coluna Esquerda — Formulário ─────────────────────────────────── */}
        <div className="space-y-5">

          {/* Card Consórcio */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <SectionTitle icon={Calculator} label="Consórcio" accent="bg-orange-500/20" />
            <div className="space-y-4">
              <Field
                label="Valor do Crédito"
                value={valorCreditoStr}
                onChange={handleMoneyChange(setValorCreditoStr)}
                prefix="R$"
                placeholder="80.000"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Prazo (meses)"
                  value={prazoC}
                  onChange={(e) => setPrazoC(e.target.value)}
                  type="number"
                  suffix="m"
                  placeholder="180"
                />
                <Field
                  label="Taxa de Adm. Total"
                  value={taxaAdm}
                  onChange={(e) => setTaxaAdm(e.target.value)}
                  type="number"
                  suffix="%"
                  placeholder="16"
                />
              </div>
            </div>

            {/* Resultado inline */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Parcela estimada</span>
              <span className="text-sm font-semibold text-orange-400 tabular-nums">
                {fmtBRL(res.parcelaC)}<span className="text-zinc-600 font-normal">/mês</span>
              </span>
            </div>
          </div>

          {/* Card Financiamento */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <SectionTitle icon={DollarSign} label="Financiamento" accent="bg-red-500/20" />
            <div className="space-y-4">
              <Field
                label="Valor de Entrada"
                value={valorEntradaStr}
                onChange={handleMoneyChange(setValorEntradaStr)}
                prefix="R$"
                placeholder="20.000"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Prazo (meses)"
                  value={prazoF}
                  onChange={(e) => setPrazoF(e.target.value)}
                  type="number"
                  suffix="m"
                  placeholder="360"
                />
                <Field
                  label="Taxa de Juros a.a."
                  value={taxaJuros}
                  onChange={(e) => setTaxaJuros(e.target.value)}
                  type="number"
                  suffix="%"
                  placeholder="12"
                />
              </div>
            </div>

            {/* Resultado inline */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Parcela estimada (Price)</span>
              <span className="text-sm font-semibold text-red-400 tabular-nums">
                {fmtBRL(res.parcelaF)}<span className="text-zinc-600 font-normal">/mês</span>
              </span>
            </div>
          </div>
        </div>

        {/* ─── Coluna Direita — Resultados ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* Hero — Economia */}
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={15} className="text-orange-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-orange-400/80">
                Economia Projetada
              </span>
            </div>
            <p className="text-4xl font-black text-zinc-100 tabular-nums leading-none mt-3 mb-1">
              {fmtBRL(res.economia)}
            </p>
            <p className="text-xs text-zinc-500">
              diferença entre custo total do financiamento e do consórcio
            </p>
          </div>

          {/* Mini-cards parcelas */}
          <div className="grid grid-cols-2 gap-3">
            <MiniCard
              label="Parcela Consórcio"
              value={fmtBRL(res.parcelaC)}
              highlight="text-orange-400"
            />
            <div className="relative">
              <MiniCard
                label="Parcela Financiamento"
                value={fmtBRL(res.parcelaF)}
                highlight="text-red-400"
              />
              {res.parcelaF > res.parcelaC && res.parcelaC > 0 && (
                <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                  +{Math.round(((res.parcelaF - res.parcelaC) / res.parcelaC) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <BarComparativa totalC={res.totalC} totalF={res.totalF} />
          </div>

          {/* Botão WhatsApp */}
          <button
            onClick={handleCopiar}
            disabled={res.parcelaC <= 0 || res.parcelaF <= 0}
            className={[
              'w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 px-6',
              'text-sm font-semibold text-white transition-all duration-200',
              res.parcelaC > 0 && res.parcelaF > 0
                ? 'bg-orange-500 hover:bg-orange-400 active:scale-[0.98] cursor-pointer shadow-lg shadow-orange-500/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
            ].join(' ')}
          >
            <MessageCircle size={18} />
            Copiar Resumo para WhatsApp
            <ArrowRight size={16} className="ml-auto opacity-60" />
          </button>

          {/* Legenda rápida */}
          <p className="text-[11px] text-zinc-600 text-center leading-relaxed px-2">
            Cálculo de consórcio com taxa administrativa total. Financiamento via Sistema Price.
            Uso exclusivo para fins ilustrativos.
          </p>
        </div>
      </div>

      <Toast show={showToast} />
    </div>
  );
}

