import { useState, useMemo } from 'react';
import { Calculator, TrendingDown, CheckCircle, MessageCircle, DollarSign, ArrowRight } from 'lucide-react';

// ─── Formatação ───────────────────────────────────────────────────────────────

const fmtBRL = (n) =>
  !isFinite(n) || isNaN(n) || n <= 0
    ? 'R$ —'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const toNum = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;

const maskMoney = (raw) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('pt-BR');
};

// ─── Cálculos ─────────────────────────────────────────────────────────────────

function calcular({ valorCredito, prazoC, taxaAdm, valorEntrada, prazoF, taxaJurosAA }) {
  const totalC = valorCredito * (1 + taxaAdm / 100);
  const parcelaC = prazoC > 0 ? totalC / prazoC : 0;

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

function SectionTitle({ icon: Icon, label, iconBg }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className={`flex items-center justify-center w-6 h-6 rounded-md ${iconBg}`}>
        <Icon size={13} className="text-zinc-100" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</span>
    </div>
  );
}

/** Input de valor monetário — grande e em destaque */
function MoneyField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-4 text-zinc-400 text-base font-medium pointer-events-none select-none">
          R$
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-zinc-950 border border-white/10 rounded-xl text-xl font-semibold text-zinc-100
            placeholder-zinc-700 py-3.5 pl-12 pr-4 transition-all
            focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30"
        />
      </div>
    </div>
  );
}

/** Input compacto para prazo/taxa */
function CompactField({ label, value, onChange, suffix, placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={0}
          className="w-full bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-100
            placeholder-zinc-700 py-2.5 pl-3.5 pr-10 transition-all
            focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30"
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

function ParcelaCard({ label, value, variant }) {
  const styles = {
    orange: {
      card: 'bg-orange-500/10 border-orange-500/20',
      label: 'text-orange-400/70',
      value: 'text-orange-400',
    },
    red: {
      card: 'bg-red-500/10 border-red-500/20',
      label: 'text-red-400/70',
      value: 'text-red-500',
    },
  };
  const s = styles[variant];
  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-1 ${s.card}`}>
      <span className={`text-[11px] font-medium uppercase tracking-wider ${s.label}`}>{label}</span>
      <span className={`text-xl font-bold tabular-nums ${s.value}`}>{value}</span>
      <span className={`text-[10px] ${s.label}`}>/ mês</span>
    </div>
  );
}

function BarComparativa({ totalC, totalF }) {
  const max = Math.max(totalC, totalF, 1);
  const pctC = Math.max(Math.round((totalC / max) * 100), 4);
  const pctF = Math.max(Math.round((totalF / max) * 100), 4);

  const rows = [
    { label: 'Consórcio', value: totalC, pct: pctC, bar: 'bg-gradient-to-r from-orange-500 to-orange-400', text: 'text-orange-400' },
    { label: 'Financiamento', value: totalF, pct: pctF, bar: 'bg-gradient-to-r from-red-600 to-red-500', text: 'text-red-400' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Custo Total Comparado</p>
      {rows.map(({ label, value, pct, bar, text }) => (
        <div key={label} className="space-y-2">
          <span className="text-xs text-zinc-400">{label}</span>
          <div className="relative h-8 bg-zinc-800/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${bar} transition-all duration-700 ease-out flex items-center justify-end pr-3`}
              style={{ width: `${pct}%` }}
            >
              {pct > 30 && (
                <span className="text-[11px] font-semibold text-white/90 tabular-nums whitespace-nowrap">
                  {fmtBRL(value)}
                </span>
              )}
            </div>
            {pct <= 30 && (
              <span className={`absolute left-[${pct}%] top-1/2 -translate-y-1/2 translate-x-2 text-[11px] font-semibold tabular-nums whitespace-nowrap ${text}`}>
                {fmtBRL(value)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Toast({ show }) {
  return (
    <div
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5',
        'bg-zinc-800 border border-white/10 text-sm text-zinc-100 px-5 py-3 rounded-2xl shadow-xl',
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
  const [valorCreditoStr, setValorCreditoStr] = useState('80000');
  const [prazoC, setPrazoC] = useState('180');
  const [taxaAdm, setTaxaAdm] = useState('16');
  const [valorEntradaStr, setValorEntradaStr] = useState('20000');
  const [prazoF, setPrazoF] = useState('360');
  const [taxaJuros, setTaxaJuros] = useState('12');
  const [showToast, setShowToast] = useState(false);

  const handleMoney = (setter) => (e) => setter(maskMoney(e.target.value));

  const res = useMemo(() => calcular({
    valorCredito: toNum(valorCreditoStr),
    prazoC:       parseInt(prazoC, 10) || 0,
    taxaAdm:      parseFloat(taxaAdm.replace(',', '.')) || 0,
    valorEntrada: toNum(valorEntradaStr),
    prazoF:       parseInt(prazoF, 10) || 0,
    taxaJurosAA:  parseFloat(taxaJuros.replace(',', '.')) || 0,
  }), [valorCreditoStr, prazoC, taxaAdm, valorEntradaStr, prazoF, taxaJuros]);

  const canCopy = res.parcelaC > 0 && res.parcelaF > 0;

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
    } catch { /* fallback silencioso */ }
  };

  const diffPct = res.parcelaC > 0
    ? Math.round(((res.parcelaF - res.parcelaC) / res.parcelaC) * 100)
    : 0;

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

      {/* ── Grid 2 colunas ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ─── Coluna Esquerda — Formulário ─────────────────────────────────── */}
        <div className="space-y-5">

          {/* Card Consórcio */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <SectionTitle icon={Calculator} label="Consórcio" iconBg="bg-orange-500/20" />
            <div className="space-y-4">
              <MoneyField
                label="Valor do Crédito"
                value={valorCreditoStr}
                onChange={handleMoney(setValorCreditoStr)}
                placeholder="80.000"
              />
              <div className="grid grid-cols-2 gap-4">
                <CompactField
                  label="Prazo"
                  value={prazoC}
                  onChange={(e) => setPrazoC(e.target.value)}
                  suffix="meses"
                  placeholder="180"
                />
                <CompactField
                  label="Taxa de Adm. Total"
                  value={taxaAdm}
                  onChange={(e) => setTaxaAdm(e.target.value)}
                  suffix="%"
                  placeholder="16"
                />
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Parcela estimada</span>
              <span className="text-sm font-semibold text-orange-400 tabular-nums">
                {fmtBRL(res.parcelaC)}<span className="text-zinc-600 font-normal"> /mês</span>
              </span>
            </div>
          </div>

          {/* Card Financiamento */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
            <SectionTitle icon={DollarSign} label="Financiamento" iconBg="bg-red-500/20" />
            <div className="space-y-4">
              <MoneyField
                label="Valor de Entrada"
                value={valorEntradaStr}
                onChange={handleMoney(setValorEntradaStr)}
                placeholder="20.000"
              />
              <div className="grid grid-cols-2 gap-4">
                <CompactField
                  label="Prazo"
                  value={prazoF}
                  onChange={(e) => setPrazoF(e.target.value)}
                  suffix="meses"
                  placeholder="360"
                />
                <CompactField
                  label="Taxa de Juros a.a."
                  value={taxaJuros}
                  onChange={(e) => setTaxaJuros(e.target.value)}
                  suffix="%"
                  placeholder="12"
                />
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Parcela estimada (Price)</span>
              <span className="text-sm font-semibold text-red-400 tabular-nums">
                {fmtBRL(res.parcelaF)}<span className="text-zinc-600 font-normal"> /mês</span>
              </span>
            </div>
          </div>
        </div>

        {/* ─── Coluna Direita — Resultados ──────────────────────────────────── */}
        <div className="space-y-5">

          {/* Hero — Economia Projetada */}
          <div className="relative overflow-hidden rounded-2xl border border-orange-500/25 p-7 text-center"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.18) 0%, rgba(9,9,11,0.0) 70%), #18181b',
            }}
          >
            {/* glow decoration */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <TrendingDown size={14} className="text-orange-400" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-orange-400/80">
                Economia Projetada
              </span>
            </div>
            <p className="text-5xl md:text-6xl font-black text-zinc-100 tabular-nums leading-none mb-2">
              {fmtBRL(res.economia)}
            </p>
            <p className="text-xs text-zinc-500">
              diferença entre custo total do financiamento e do consórcio
            </p>
          </div>

          {/* Cards de parcelas */}
          <div className="grid grid-cols-2 gap-3">
            <ParcelaCard label="Parcela Consórcio" value={fmtBRL(res.parcelaC)} variant="orange" />
            <div className="relative">
              <ParcelaCard label="Parcela Financiamento" value={fmtBRL(res.parcelaF)} variant="red" />
              {diffPct > 0 && (
                <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">
                  +{diffPct}%
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
            disabled={!canCopy}
            className={[
              'w-full flex items-center justify-center gap-2.5 rounded-2xl py-4 px-6',
              'text-sm font-semibold text-white transition-all duration-150',
              canCopy
                ? 'bg-orange-500 hover:bg-orange-400 active:scale-[0.98] cursor-pointer shadow-md shadow-orange-500/30'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
            ].join(' ')}
          >
            <MessageCircle size={18} />
            Copiar Resumo para WhatsApp
            <ArrowRight size={16} className="ml-auto opacity-60" />
          </button>

          <p className="text-[11px] text-zinc-600 text-center leading-relaxed px-2">
            Consórcio com taxa administrativa total. Financiamento via Sistema Price.
            Uso exclusivo para fins ilustrativos.
          </p>
        </div>
      </div>

      <Toast show={showToast} />
    </div>
  );
}

