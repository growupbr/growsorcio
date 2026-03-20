import { useState, useCallback } from 'react';
import {
  Link2,
  MessageCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Upload,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Parcela PMT de financiamento bancário (taxa fixa 1,5% a.m.) */
function calcParcelaFinanciamento(valorCredito, prazoMeses) {
  const pv   = parseFloat(valorCredito) || 0;
  const n    = parseInt(prazoMeses)     || 1;
  const taxa = 0.015;
  if (!pv) return 0;
  const fator = Math.pow(1 + taxa, n);
  return (pv * taxa * fator) / (fator - 1);
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-zinc-800/50 hover:bg-zinc-800/80 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
      >
        <span className="text-sm font-bold text-white">{title}</span>
        {open
          ? <ChevronUp  size={14} className="text-zinc-500 flex-shrink-0" />
          : <ChevronDown size={14} className="text-zinc-500 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 py-4 space-y-4 bg-zinc-900/40">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Form Primitives ──────────────────────────────────────────────────────────

function Field({ label, id, hint, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-zinc-700 text-[10px] mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full bg-zinc-900 border border-white/8 text-white text-sm rounded-lg px-3 py-2.5 ' +
  'placeholder-zinc-700 focus:outline-none focus:border-orange-500/40 focus:ring-1 ' +
  'focus:ring-orange-500/20 transition-all';

function Input({ id, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`${inputCls} ${className}`}
    />
  );
}

// ─── A4 Sub-components ────────────────────────────────────────────────────────

function DataCard({ label, value, accent }) {
  return (
    <div
      className="rounded-xl p-3 text-center border"
      style={{ borderColor: `${accent}30`, backgroundColor: `${accent}08` }}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-sm font-black text-zinc-800 leading-tight">{value}</p>
    </div>
  );
}

function ComparisomBlock({ label, monthly, total, color, badge }) {
  return (
    <div
      className="flex-1 rounded-xl p-4 border-2 relative overflow-visible"
      style={{ borderColor: color, backgroundColor: `${color}0C` }}
    >
      {badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: color }}
        >
          {badge}
        </div>
      )}
      <p className="text-xs font-black text-zinc-700 mb-3">{label}</p>
      <p className="text-[9px] text-zinc-500 mb-0.5">Parcela mensal</p>
      <p className="text-base font-black mb-2" style={{ color }}>{monthly}</p>
      <p className="text-[9px] text-zinc-500 mb-0.5">Total pago</p>
      <p className="text-xs font-bold text-zinc-700">{total}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_DADOS = {
  nomeCliente:                    'Maria Silva',
  telefone:                       '(11) 9 8765-4321',
  validade:                       '27/03/2026',
  valorCredito:                   '120000',
  prazo:                          '60',
  parcela:                        '2100',
  taxaAdm:                        '18',
  mostrarComparativoFinanciamento: true,
  corPrimaria:                    '#f97316',
  mensagemPersonalizada:
    'Preparei esta proposta exclusiva para você conquistar o seu bem com segurança e economia. ' +
    'No consórcio, o seu dinheiro trabalha por você — sem juros abusivos, sem surpresas.',
};

export default function Propostas() {
  const [dados, setDados] = useState(DEFAULT_DADOS);

  const set = useCallback(
    (field) => (e) =>
      setDados((prev) => ({
        ...prev,
        [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      })),
    []
  );

  // Cálculos comparativos
  const parcConsorcio     = parseFloat(dados.parcela)      || 0;
  const prazoN            = parseInt(dados.prazo)           || 60;
  const totalConsorcio    = parcConsorcio * prazoN;
  const parcFinanciamento = calcParcelaFinanciamento(dados.valorCredito, dados.prazo);
  const totalFinanciamento = parcFinanciamento * prazoN;
  const economia           = totalFinanciamento - totalConsorcio;

  const accent = dados.corPrimaria || '#f97316';

  return (
    <div className="flex flex-col h-full bg-zinc-950">

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md z-10">
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Gerador de Propostas</h1>
          <p className="text-zinc-600 text-xs">Para: <span className="text-zinc-400">{dados.nomeCliente || '—'}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/6 hover:border-white/12 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-label="Criar Link Mágico"
          >
            <Link2 size={13} />
            <span className="hidden sm:inline">Link Mágico</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/6 hover:border-white/12 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            aria-label="Enviar no WhatsApp"
          >
            <MessageCircle size={13} />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-orange-500 hover:bg-orange-400 active:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            aria-label="Descarregar PDF"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Descarregar PDF</span>
          </button>
        </div>
      </header>

      {/* ── Split Layout ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

        {/* ════════════════════════════════════════════════════════════════════
            PAINEL ESQUERDO — Formulário de Controlo
            ══════════════════════════════════════════════════════════════════ */}
        <aside className="lg:col-span-4 overflow-y-auto border-r border-white/5 bg-zinc-900/20">
          <div className="p-4 space-y-3">

            {/* A: Dados do Cliente */}
            <Accordion title="A. Dados do Cliente" defaultOpen>
              <Field label="Nome do Cliente" id="nomeCliente">
                <Input
                  id="nomeCliente"
                  value={dados.nomeCliente}
                  onChange={set('nomeCliente')}
                  placeholder="Ex: Maria Silva"
                />
              </Field>
              <Field label="WhatsApp" id="telefone">
                <Input
                  id="telefone"
                  value={dados.telefone}
                  onChange={set('telefone')}
                  placeholder="(11) 9 8765-4321"
                />
              </Field>
              <Field label="Validade da Proposta" id="validade">
                <Input
                  id="validade"
                  value={dados.validade}
                  onChange={set('validade')}
                  placeholder="27/03/2026"
                />
              </Field>
            </Accordion>

            {/* B: Estrutura do Crédito */}
            <Accordion title="B. Estrutura do Crédito" defaultOpen>
              <Field label="Valor do Bem (R$)" id="valorCredito">
                <Input
                  id="valorCredito"
                  type="number"
                  value={dados.valorCredito}
                  onChange={set('valorCredito')}
                  placeholder="120000"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prazo (meses)" id="prazo">
                  <Input
                    id="prazo"
                    type="number"
                    value={dados.prazo}
                    onChange={set('prazo')}
                    placeholder="60"
                  />
                </Field>
                <Field label="Parcela (R$)" id="parcela">
                  <Input
                    id="parcela"
                    type="number"
                    value={dados.parcela}
                    onChange={set('parcela')}
                    placeholder="2100"
                  />
                </Field>
              </div>
              <Field label="Taxa de Administração (%)" id="taxaAdm" hint="Percentagem total sobre o crédito">
                <Input
                  id="taxaAdm"
                  type="number"
                  value={dados.taxaAdm}
                  onChange={set('taxaAdm')}
                  placeholder="18"
                />
              </Field>
              {/* Checkbox comparativo */}
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <div className="relative mt-0.5 flex-shrink-0 w-4 h-4">
                  <input
                    type="checkbox"
                    checked={dados.mostrarComparativoFinanciamento}
                    onChange={set('mostrarComparativoFinanciamento')}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 border border-white/20 rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all" />
                  <svg
                    className="absolute inset-0 m-auto w-2.5 h-2 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
                    viewBox="0 0 10 8" fill="none"
                  >
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors leading-relaxed">
                  Incluir comparativo com Financiamento Bancário (1,5% a.m.)
                </span>
              </label>
            </Accordion>

            {/* C: Branding e Mensagem */}
            <Accordion title="C. Branding e Mensagem">
              <Field label="Cor Principal" id="corPrimaria" hint="Define a cor dos destaques no documento">
                <div className="flex items-center gap-3">
                  <input
                    id="corPrimaria"
                    type="color"
                    value={dados.corPrimaria}
                    onChange={set('corPrimaria')}
                    className="w-11 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                  />
                  <Input
                    value={dados.corPrimaria}
                    onChange={set('corPrimaria')}
                    placeholder="#f97316"
                    className="font-mono text-xs"
                  />
                </div>
              </Field>
              <Field label="Logótipo da Empresa" id="logo">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-white/12 rounded-xl px-4 py-5 text-zinc-600 hover:text-zinc-300 hover:border-white/25 transition-all text-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <Upload size={15} />
                  Clique para enviar o logótipo
                </button>
              </Field>
              <Field label="Mensagem ao Cliente" id="mensagem">
                <textarea
                  id="mensagem"
                  value={dados.mensagemPersonalizada}
                  onChange={set('mensagemPersonalizada')}
                  rows={5}
                  placeholder="Escreva uma mensagem personalizada para o cliente..."
                  className={`${inputCls} resize-none leading-relaxed`}
                />
                <button
                  type="button"
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <Sparkles size={12} />
                  Melhorar texto com IA
                </button>
              </Field>
            </Accordion>

          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════════════
            PAINEL DIREITO — Live Preview do Documento A4
            ══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 overflow-y-auto bg-[#111113] flex flex-col items-center py-10 px-4 gap-4">

          {/* Hint */}
          <p className="text-zinc-700 text-[10px] font-medium tracking-wide uppercase flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Pré-visualização em tempo real
          </p>

          {/* ── Documento A4 ────────────────────────────────────────────────── */}
          <div
            className="w-full max-w-2xl bg-white text-zinc-900 shadow-2xl rounded-sm mx-auto"
            style={{ aspectRatio: '1 / 1.414' }}
          >
            <div className="h-full flex flex-col p-8 sm:p-12 relative overflow-hidden">

              {/* Header */}
              <div
                className="flex items-start justify-between pb-5 mb-6 border-b-2"
                style={{ borderColor: `${accent}35` }}
              >
                {/* Logo */}
                <div
                  className="flex items-center justify-center w-20 h-8 rounded-md border-2 border-dashed"
                  style={{ borderColor: `${accent}50`, backgroundColor: `${accent}08` }}
                >
                  <span className="text-[9px] font-black tracking-widest" style={{ color: accent }}>
                    LOGO
                  </span>
                </div>

                {/* Title block */}
                <div className="text-right">
                  <p
                    className="text-sm font-black tracking-tight leading-tight"
                    style={{ color: accent }}
                  >
                    PROPOSTA DE INVESTIMENTO
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Exclusiva para {dados.nomeCliente || '—'}
                  </p>
                  {dados.validade && (
                    <span
                      className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold"
                      style={{ backgroundColor: `${accent}15`, color: accent }}
                    >
                      Válida até {dados.validade}
                    </span>
                  )}
                </div>
              </div>

              {/* Greeting */}
              <div className="mb-6">
                <h2 className="text-lg font-black text-zinc-800 leading-tight mb-2">
                  Olá,{' '}
                  <span style={{ color: accent }}>
                    {dados.nomeCliente || 'Cliente'}
                  </span>!
                </h2>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {dados.mensagemPersonalizada || '—'}
                </p>
              </div>

              {/* Divider label */}
              <p
                className="text-[8px] font-black uppercase tracking-[0.15em] mb-3"
                style={{ color: accent }}
              >
                Estrutura do Crédito
              </p>

              {/* Credit Cards Grid */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <DataCard label="Crédito"   value={fmt(dados.valorCredito)}    accent={accent} />
                <DataCard label="Prazo"     value={`${dados.prazo || '—'} m`}  accent={accent} />
                <DataCard label="Parcela"   value={fmt(dados.parcela)}          accent={accent} />
                <DataCard label="Taxa Adm." value={`${dados.taxaAdm || '—'}%`} accent={accent} />
              </div>

              {/* Comparativo Financiamento */}
              {dados.mostrarComparativoFinanciamento && (
                <div className="mb-6">
                  <p
                    className="text-[8px] font-black uppercase tracking-[0.15em] mb-4"
                    style={{ color: accent }}
                  >
                    Consórcio vs. Financiamento Bancário
                  </p>
                  <div className="flex gap-4 mt-3">
                    <ComparisomBlock
                      label="Consórcio"
                      monthly={fmt(parcConsorcio)}
                      total={fmt(totalConsorcio)}
                      color="#10b981"
                      badge="✓ Melhor escolha"
                    />
                    <ComparisomBlock
                      label="Financiamento Bancário"
                      monthly={fmt(parcFinanciamento)}
                      total={fmt(totalFinanciamento)}
                      color="#ef4444"
                      badge={null}
                    />
                  </div>
                  {economia > 0 && (
                    <div className="mt-3 py-2 px-3 rounded-xl text-[10px] font-black text-center text-emerald-700 bg-emerald-50 border border-emerald-100">
                      Você economiza <span className="text-emerald-600">{fmt(economia)}</span> ao escolher o Consórcio
                    </div>
                  )}
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Footer — fixed to bottom inside the A4 */}
              <div className="border-t border-zinc-100 pt-3 flex items-center justify-between">
                <p className="text-[8px] text-zinc-400 leading-relaxed">
                  Gerado de forma segura via{' '}
                  <span className="font-black text-zinc-500">GrowSorcio</span>
                  {' '}— Tecnologia para Consórcio
                </p>
                <p className="text-[8px] text-zinc-400 tabular-nums">{dados.validade}</p>
              </div>

            </div>
          </div>

          {/* Bottom note */}
          <p className="text-zinc-800 text-[10px] pb-4 text-center">
            Edite os campos à esquerda para ver as alterações em tempo real
          </p>

        </div>{/* /right panel */}
      </div>{/* /grid */}
    </div>
  );
}

