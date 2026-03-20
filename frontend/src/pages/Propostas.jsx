import { useState, useCallback, useRef } from 'react';
import {
  Link2,
  MessageCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Upload,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v) {
  const n = parseFloat(v) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtN(v) {
  const n = parseFloat(v) || 0;
  return n.toLocaleString('pt-BR');
}

function pmt(pv, taxa, n) {
  if (!pv || !n) return 0;
  const f = Math.pow(1 + taxa, n);
  return (pv * taxa * f) / (f - 1);
}

function gerarId() {
  const siglas = ['OLIMPO', 'TITAN', 'ATLAS', 'APEX'];
  const x = siglas[Math.floor(Math.random() * siglas.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${x}-${n}`;
}

const PROPOSTA_ID = gerarId();
const HOJE = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

// ─── Accordion (Painel) ───────────────────────────────────────────────────────

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-zinc-800/50 hover:bg-zinc-800/80 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
      >
        <span className="text-xs font-bold text-white tracking-wide">{title}</span>
        {open
          ? <ChevronUp  size={13} className="text-zinc-600 flex-shrink-0" />
          : <ChevronDown size={13} className="text-zinc-600 flex-shrink-0" />
        }
      </button>
      {open && <div className="px-4 py-4 space-y-4 bg-zinc-900/40">{children}</div>}
    </div>
  );
}

// ─── Form Primitives ──────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-zinc-900 border border-white/8 text-white text-sm rounded-lg px-3 py-2.5 ' +
  'placeholder-zinc-700 focus:outline-none focus:border-orange-500/40 focus:ring-1 ' +
  'focus:ring-orange-500/20 transition-all';

function Field({ label, id, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-zinc-700 text-[10px] mt-1">{hint}</p>}
    </div>
  );
}

function Input({ id, value, onChange, type = 'text', placeholder, className = '' }) {
  return (
    <input
      id={id} type={type} value={value} onChange={onChange}
      placeholder={placeholder}
      className={`${inputCls} ${className}`}
    />
  );
}

// ─── Documento — Sub-componentes ──────────────────────────────────────────────

function Divisor() {
  return <div className="border-t border-zinc-100 my-6" />;
}

function MetaRow({ label, value, accent = false, large = false }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-zinc-100 last:border-0">
      <span className="text-xs font-medium text-zinc-400 leading-tight">{label}</span>
      <span className={`font-bold tabular-nums leading-tight text-right ${
        large ? 'text-base' : 'text-sm'
      } ${accent === 'red' ? 'text-red-500' : accent === 'orange' ? 'text-orange-600' : 'text-zinc-800'}`}>
        {value}
      </span>
    </div>
  );
}

function ParamCard({ label, value, sub }) {
  return (
    <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100">
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-sm font-extrabold text-zinc-800 leading-tight">{value}</p>
      {sub && <p className="text-[9px] text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Documento Principal (A4 Premium) ────────────────────────────────────────

function DocumentoA4({ dados, innerRef }) {
  // Cálculos
  const credito       = parseFloat(dados.valorCredito) || 80000;
  const prazoConsorc  = parseInt(dados.prazo)          || 180;
  const parcelaConsorc = parseFloat(dados.parcela)     || 516;
  const taxaAdm       = parseFloat(dados.taxaAdm)      || 16;
  const totalConsorc  = parcelaConsorc * prazoConsorc;

  const PRAZO_FIN     = 360;
  const parcelaFin    = pmt(credito, 0.015, PRAZO_FIN);
  const totalFin      = parcelaFin * PRAZO_FIN;
  const economia      = totalFin - totalConsorc;

  const accent = dados.corPrimaria || '#f97316';

  return (
    <div
      ref={innerRef}
      className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── Topo colorido (accent bar) ─ */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, #f59e0b)` }} />

      <div className="p-10">

        {/* ════════════════════════════════════════════════════════════════
            1. HEADER
            ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-start justify-between mb-10">
          {/* Logo placeholder */}
          <div className="flex items-center justify-center w-28 h-10 rounded-lg bg-zinc-100 border border-zinc-200">
            <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">Sua Logo</span>
          </div>

          {/* ID + data */}
          <div className="text-right">
            <p className="text-[9px] font-black tracking-[0.18em] uppercase text-zinc-400 mb-0.5">
              Relatório Estratégico de Adesão
            </p>
            <p className="text-xs font-bold text-zinc-700">Proposta ID: <span style={{ color: accent }}>{PROPOSTA_ID}</span></p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{HOJE}</p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            2. HEADLINE DO INVESTIDOR
            ════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
            Análise exclusiva preparada para
          </p>
          <h1 className="text-2xl font-extrabold text-zinc-950 leading-tight mb-2">
            {dados.nomeCliente || 'Cliente Investidor'}
          </h1>
          <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-sm">
            Detalhamento da alavancagem patrimonial através da metodologia TEC 2.0 — consórcio estratégico de alta performance.
          </p>
          {dados.validade && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-200">
              <ShieldCheck size={11} className="text-zinc-400" />
              <span className="text-[10px] font-semibold text-zinc-500">Válida até {dados.validade}</span>
            </div>
          )}
        </div>

        <Divisor />

        {/* ════════════════════════════════════════════════════════════════
            3. ANÁLISE COMPARATIVA — XEQUE-MATE
            ════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">
            Comparativo de Aquisição Patrimonial
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Card Financiamento */}
            <div className="bg-red-50/60 border border-red-100 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <TrendingDown size={18} className="text-red-300" />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Alternativa A</p>
              <p className="text-xs font-bold text-zinc-700 mb-4">Financiamento Bancário Tradicional</p>
              <div className="space-y-0">
                <MetaRow label="Crédito"        value={fmt(credito)} />
                <MetaRow label="Prazo"          value={`${PRAZO_FIN} meses`} />
                <MetaRow label="1ª Parcela"     value={fmt(parcelaFin)} accent="red" />
                <MetaRow label="Taxa a.m."      value="1,50%" accent="red" />
                <MetaRow label="Custo Total"    value={fmt(totalFin)} accent="red" large />
              </div>
            </div>

            {/* Card Consórcio TEC 2.0 */}
            <div
              className="bg-white rounded-2xl p-5 relative overflow-hidden"
              style={{
                border: `2px solid ${accent}`,
                boxShadow: `0 12px 40px -8px ${accent}22`,
              }}
            >
              {/* Badge destaque */}
              <div
                className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${accent}15` }}
              >
                <CheckCircle2 size={10} style={{ color: accent }} />
                <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: accent }}>
                  Recomendado
                </span>
              </div>

              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Alternativa B</p>
              <p className="text-xs font-bold text-zinc-700 mb-4">
                Consórcio Estratégico <span style={{ color: accent }}>Série OlimpoBlessed</span>
              </p>
              <div className="space-y-0">
                <MetaRow label="Crédito"        value={fmt(credito)} />
                <MetaRow label="Prazo"          value={`${prazoConsorc} meses`} />
                <MetaRow label="1ª Parcela"     value={fmt(parcelaConsorc)} accent="orange" />
                <MetaRow label="Taxa de Adm."   value={`${taxaAdm}% (Fixa)`} />
                <MetaRow label="Custo Total"    value={fmt(totalConsorc)} accent="orange" large />
              </div>
            </div>
          </div>

          {/* Economia Real */}
          {economia > 0 && (
            <div
              className="mt-4 rounded-2xl p-5 flex items-center justify-between"
              style={{ backgroundColor: `${accent}0A`, border: `1px solid ${accent}30` }}
            >
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-0.5">
                  Economia Real com TEC 2.0
                </p>
                <p className="text-[10px] text-zinc-400 font-light">
                  Diferença paga ao banco vs. consórcio, ao longo de todo o prazo
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="flex items-center gap-1.5 justify-end mb-0.5">
                  <TrendingDown size={16} className="text-emerald-500" />
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Você poupa</span>
                </div>
                <p
                  className="text-2xl font-extrabold leading-tight"
                  style={{ color: accent }}
                >
                  {fmt(economia)}
                </p>
              </div>
            </div>
          )}
        </div>

        <Divisor />

        {/* ════════════════════════════════════════════════════════════════
            4. FUNDAMENTOS DO PLANO
            ════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">
            Parâmetros do Plano Estruturado
          </p>
          <div className="grid grid-cols-3 gap-3">
            <ParamCard label="Crédito"         value={fmt(credito)}           />
            <ParamCard label="Prazo"           value={`${prazoConsorc} m`}    />
            <ParamCard label="1ª Parcela"      value={fmt(parcelaConsorc)}    />
            <ParamCard label="Taxa Adm."       value={`${taxaAdm}% Fixa`}     sub="Sobre o crédito total" />
            <ParamCard label="Indexador"       value="INCC"                    sub="Reajuste anual" />
            <ParamCard label="Seguro"          value="Incluso"                 sub="SFH padrão" />
          </div>
        </div>

        <Divisor />

        {/* ════════════════════════════════════════════════════════════════
            5. MENSAGEM PERSONALIZADA + CONDIÇÕES
            ════════════════════════════════════════════════════════════════ */}
        {dados.mensagemPersonalizada && (
          <div className="mb-8">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">
              Nota do Consultor
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed font-light border-l-2 pl-4"
              style={{ borderColor: accent }}>
              {dados.mensagemPersonalizada}
            </p>
          </div>
        )}

        {/* Condições gerais */}
        <div className="mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
            Condições Gerais
          </p>
          <p className="text-[10px] text-zinc-400 font-light leading-relaxed">
            Esta proposta é exclusiva, personalizada e válida pelo período indicado. Os valores apresentados são
            estimados com base nas condições vigentes na data de emissão. O início da contemplação está sujeito
            às condições do fundo comum do grupo. Consulte o Regulamento Completo para informações detalhadas.
          </p>
        </div>

        {/* ── Assinaturas ─ */}
        <div className="grid grid-cols-2 gap-10">
          {['Cliente Investidor', 'Consultor GrowSorcio'].map((label) => (
            <div key={label}>
              <div className="border-b-2 border-zinc-800 mb-2 pb-6" />
              <p className="text-[10px] font-semibold text-zinc-500">{label}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">
                {label === 'Cliente Investidor' ? dados.nomeCliente || '_______' : 'GrowSorcio — TEC 2.0'}
              </p>
            </div>
          ))}
        </div>

        {/* Footer interno */}
        <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-[8px] text-zinc-300 font-light">
            Gerado de forma segura via{' '}
            <span className="font-black text-zinc-400">GrowSorcio</span>
            {' '}— Tecnologia para Consórcio
          </p>
          <p className="text-[8px] text-zinc-400 font-mono">{PROPOSTA_ID}</p>
        </div>

      </div>{/* /p-10 */}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_DADOS = {
  nomeCliente: 'Maria Silva',
  telefone: '(11) 9 8765-4321',
  validade: '27/03/2026',
  valorCredito: '80000',
  prazo: '180',
  parcela: '516',
  taxaAdm: '16',
  corPrimaria: '#f97316',
  mensagemPersonalizada:
    'Preparei esta análise especialmente para você. No consórcio TEC 2.0, o seu ' +
    'patrimônio cresce sem os juros abusivos do sistema bancário tradicional. Estou à ' +
    'disposição para esclarecer cada detalhe desta proposta.',
};

export default function Propostas() {
  const [dados, setDados] = useState(DEFAULT_DADOS);
  const docRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    const el = docRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgH = pageW / ratio;
      // If taller than A4, split into pages
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
      } else {
        let yOffset = 0;
        while (yOffset < imgH) {
          pdf.addImage(imgData, 'JPEG', 0, -yOffset, pageW, imgH);
          yOffset += pageH;
          if (yOffset < imgH) pdf.addPage();
        }
      }
      const nome = dados.nomeCliente?.replace(/\s+/g, '_') || 'Cliente';
      pdf.save(`Proposta_GrowSorcio_${nome}.pdf`);
    } finally {
      setDownloading(false);
    }
  }, [dados.nomeCliente]);

  const set = useCallback(
    (field) => (e) =>
      setDados(prev => ({
        ...prev,
        [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      })),
    []
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950">

      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md z-10">
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Gerador de Propostas</h1>
          <p className="text-zinc-600 text-xs">
            Para: <span className="text-zinc-400">{dados.nomeCliente || '—'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Criar Link Mágico"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/6 hover:border-white/12 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Link2 size={13} /><span className="hidden sm:inline">Link Mágico</span>
          </button>
          <button type="button" aria-label="Enviar no WhatsApp"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/6 hover:border-white/12 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <MessageCircle size={13} /><span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            aria-label="Descarregar PDF"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <Download size={13} className={downloading ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">{downloading ? 'A gerar…' : 'Descarregar PDF'}</span>
          </button>
        </div>
      </header>

      {/* ── Split Layout ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

        {/* PAINEL ESQUERDO */}
        <aside className="lg:col-span-4 overflow-y-auto border-r border-white/5 bg-zinc-900/20">
          <div className="p-4 space-y-3">

            <Accordion title="A. Dados do Cliente" defaultOpen>
              <Field label="Nome do Cliente" id="nome">
                <Input id="nome" value={dados.nomeCliente} onChange={set('nomeCliente')} placeholder="Ex: Maria Silva" />
              </Field>
              <Field label="WhatsApp" id="tel">
                <Input id="tel" value={dados.telefone} onChange={set('telefone')} placeholder="(11) 9 8765-4321" />
              </Field>
              <Field label="Validade da Proposta" id="val">
                <Input id="val" value={dados.validade} onChange={set('validade')} placeholder="27/03/2026" />
              </Field>
            </Accordion>

            <Accordion title="B. Estrutura do Crédito" defaultOpen>
              <Field label="Valor do Crédito (R$)" id="cred">
                <Input id="cred" type="number" value={dados.valorCredito} onChange={set('valorCredito')} placeholder="80000" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prazo (meses)" id="prazo">
                  <Input id="prazo" type="number" value={dados.prazo} onChange={set('prazo')} placeholder="180" />
                </Field>
                <Field label="1ª Parcela (R$)" id="parcela">
                  <Input id="parcela" type="number" value={dados.parcela} onChange={set('parcela')} placeholder="516" />
                </Field>
              </div>
              <Field label="Taxa de Adm. (%)" id="taxa" hint="Percentagem total fixa sobre o crédito">
                <Input id="taxa" type="number" value={dados.taxaAdm} onChange={set('taxaAdm')} placeholder="16" />
              </Field>
            </Accordion>

            <Accordion title="C. Branding e Mensagem">
              <Field label="Cor de Acento" id="cor">
                <div className="flex items-center gap-3">
                  <input
                    id="cor" type="color" value={dados.corPrimaria} onChange={set('corPrimaria')}
                    className="w-11 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0.5 flex-shrink-0"
                  />
                  <Input value={dados.corPrimaria} onChange={set('corPrimaria')} className="font-mono text-xs" />
                </div>
              </Field>
              <Field label="Logótipo" id="logo">
                <button type="button"
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-white/12 rounded-xl px-4 py-5 text-zinc-600 hover:text-zinc-300 hover:border-white/25 transition-all text-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <Upload size={14} /> Enviar logótipo
                </button>
              </Field>
              <Field label="Nota do Consultor" id="msg">
                <textarea
                  id="msg" value={dados.mensagemPersonalizada} onChange={set('mensagemPersonalizada')}
                  rows={5} placeholder="Mensagem personalizada..."
                  className={`${inputCls} resize-none leading-relaxed`}
                />
                <button type="button"
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <Sparkles size={12} /> Melhorar texto com IA
                </button>
              </Field>
            </Accordion>

          </div>
        </aside>

        {/* PAINEL DIREITO — Live Preview */}
        <div className="lg:col-span-8 overflow-y-auto bg-[#0f0f11] flex flex-col items-center py-10 px-4 sm:px-8 gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-zinc-700 text-[10px] font-medium tracking-wide uppercase">
              Pré-visualização em tempo real
            </p>
          </div>
          <DocumentoA4 dados={dados} innerRef={docRef} />
          <p className="text-zinc-800 text-[10px] pb-6 text-center">
            Edite os campos à esquerda para actualizar instantaneamente
          </p>
        </div>

      </div>
    </div>
  );
}

