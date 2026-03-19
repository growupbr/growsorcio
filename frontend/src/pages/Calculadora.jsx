import { useState, useMemo, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import logoSrc from '../assets/logogrowsorcio.webp';
import {
  Calculator, CheckCircle, MessageCircle, DollarSign,
  ImageDown, TrendingDown, Trophy, User,
} from 'lucide-react';

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

// ─── Sub-componentes UI ───────────────────────────────────────────────────────

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

function Toast({ show, message }) {
  return (
    <div
      className={[
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5',
        'bg-zinc-800 border border-white/10 text-sm text-zinc-100 px-5 py-3 rounded-2xl shadow-xl',
        'transition-all duration-300 select-none whitespace-nowrap',
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      ].join(' ')}
    >
      <CheckCircle size={16} className="text-orange-400 shrink-0" />
      {message}
    </div>
  );
}

// ─── Card Exportável ──────────────────────────────────────────────────────────

/** Linha horizontal estilo recibo — label esquerda, valor direita */
function DataRow({ label, value, valueColor = '#f4f4f5', isLast = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '9px 0',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{
        fontSize: 10,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: '#71717a',
        fontWeight: 600,
        fontFamily: 'system-ui, sans-serif',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 15,
        fontWeight: 700,
        color: valueColor,
        fontFamily: 'system-ui, sans-serif',
        letterSpacing: '-0.01em',
      }}>
        {value}
      </span>
    </div>
  );
}

function ExportCard({ exportRef, res, valorCreditoStr, prazoC, prazoF, taxaAdm, taxaJuros, valorEntradaStr }) {
  const ready = res.parcelaC > 0 && res.parcelaF > 0;

  return (
    <div
      ref={exportRef}
      id="comparison-export-node"
      style={{
        backgroundColor: '#09090b',
        padding: 40,
        borderRadius: 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        border: '1px solid rgba(255,255,255,0.06)',
        width: '100%',
        aspectRatio: '1 / 1',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* ── Branding ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <img
          src={logoSrc}
          alt="Growsorcio"
          style={{ height: 36, width: 'auto', display: 'block' }}
        />
      </div>

      {/* ── Título central ── */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{
          color: '#f4f4f5',
          fontSize: 26,
          fontWeight: 900,
          margin: 0,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
        }}>
          Consórcio vs Financiamento
        </h2>
      </div>

      {/* ── Grid de batalha ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>

        {/* Coluna Consórcio */}
        <div style={{
          background: 'linear-gradient(to bottom, rgba(16,185,129,0.1), transparent)',
          border: '1px solid rgba(52,211,153,0.2)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Badge + Linhas de dado */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(52,211,153,0.18)',
              border: '1px solid rgba(52,211,153,0.35)',
              borderRadius: 999,
              padding: '4px 12px',
              marginBottom: 14,
            }}>
              <span style={{ color: '#34d399', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ✓ Consórcio
              </span>
            </div>
            <DataRow label="Crédito"  value={fmtBRL(toNum(valorCreditoStr))} />
            <DataRow label="Prazo"    value={`${prazoC} meses`} />
            <DataRow label="Taxa Adm." value={`${taxaAdm}%`} />
            <DataRow label="Parcela"  value={fmtBRL(res.parcelaC)} valueColor="#34d399" isLast />
          </div>
          {/* Custo Total — isolado no fundo */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(52,211,153,0.15)' }}>
            <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Custo Total
            </div>
            <div style={{ color: '#34d399', fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'system-ui, sans-serif' }}>
              {fmtBRL(res.totalC)}
            </div>
          </div>
        </div>

        {/* Coluna Financiamento */}
        <div style={{
          background: 'linear-gradient(to bottom, rgba(239,68,68,0.1), transparent)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Badge + Linhas de dado */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(239,68,68,0.18)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 999,
              padding: '4px 12px',
              marginBottom: 14,
            }}>
              <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ✗ Financiamento
              </span>
            </div>
            <DataRow label="Crédito"   value={fmtBRL(toNum(valorCreditoStr))} />
            <DataRow label="Prazo"     value={`${prazoF} meses`} />
            <DataRow label="Juros a.a." value={`${taxaJuros}%`} />
            <DataRow label="Parcela"   value={fmtBRL(res.parcelaF)} valueColor="#ef4444" isLast />
          </div>
          {/* Custo Total — isolado no fundo */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(239,68,68,0.15)' }}>
            <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Custo Total
            </div>
            <div style={{ color: '#ef4444', fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'system-ui, sans-serif' }}>
              {fmtBRL(res.totalF)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Troféu — Economia Total ── */}
      <div style={{
        background: 'linear-gradient(to right, #ea580c, #fb923c)',
        borderRadius: 16,
        padding: '20px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 12px 32px rgba(249,115,22,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🏆</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Economia Total com Consórcio
          </span>
        </div>
        <div style={{
          color: '#fff',
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontFamily: 'system-ui, sans-serif',
          textShadow: '0 2px 12px rgba(0,0,0,0.25)',
        }}>
          {ready ? fmtBRL(res.economia) : 'R$ —'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 500 }}>
          valor que fica no seu bolso
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <span style={{ color: '#3f3f46', fontSize: 10 }}>
          Simulação ilustrativa • growsorcio.com.br
        </span>
      </div>
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
  const [nomeCliente, setNomeCliente] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });
  const [exporting, setExporting] = useState(false);

  const exportRef = useRef(null);

  const handleMoney = (setter) => (e) => setter(maskMoney(e.target.value));

  // Gera nome do arquivo: "josecomparativo80k.png"
  const gerarNomeArquivo = useCallback(() => {
    const nome = nomeCliente
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const v = toNum(valorCreditoStr);
    const valorStr = v >= 1_000_000
      ? `${Math.round(v / 1_000_000)}m`
      : v >= 1_000
      ? `${Math.round(v / 1_000)}k`
      : `${Math.round(v)}`;
    return nome ? `${nome}comparativo${valorStr}` : `comparativo${valorStr}`;
  }, [nomeCliente, valorCreditoStr]);

  const res = useMemo(() => calcular({
    valorCredito: toNum(valorCreditoStr),
    prazoC:       parseInt(prazoC, 10) || 0,
    taxaAdm:      parseFloat(taxaAdm.replace(',', '.')) || 0,
    valorEntrada: toNum(valorEntradaStr),
    prazoF:       parseInt(prazoF, 10) || 0,
    taxaJurosAA:  parseFloat(taxaJuros.replace(',', '.')) || 0,
  }), [valorCreditoStr, prazoC, taxaAdm, valorEntradaStr, prazoF, taxaJuros]);

  const canCopy = res.parcelaC > 0 && res.parcelaF > 0;

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  }, []);

  const handleCopiarTexto = async () => {
    const texto =
      `Olá! Fiz a simulação que combinamos. 🏠\n\n` +
      `Para um crédito de ${fmtBRL(toNum(valorCreditoStr))}, no consórcio sua parcela fica em torno de ${fmtBRL(res.parcelaC)}/mês, sem juros.\n\n` +
      `Se fôssemos para o financiamento, sua parcela saltaria para ${fmtBRL(res.parcelaF)}/mês.\n\n` +
      `No final das contas, o consórcio te faz economizar ${fmtBRL(res.economia)}! 💰\n\n` +
      `Vamos dar andamento?`;
    try {
      await navigator.clipboard.writeText(texto);
      showToast('Resumo copiado! Cole no WhatsApp do cliente.');
    } catch { /* fallback */ }
  };

  const handleBaixarImagem = async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      // Captura o elemento em alta resolução
      const captured = await html2canvas(exportRef.current, {
        backgroundColor: '#09090b',
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      // Centraliza em canvas 1080x1080
      const out = document.createElement('canvas');
      out.width = 1080;
      out.height = 1080;
      const ctx = out.getContext('2d');
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 1080, 1080);
      const scale = Math.min(1080 / captured.width, 1080 / captured.height);
      const dw = captured.width * scale;
      const dh = captured.height * scale;
      const dx = (1080 - dw) / 2;
      const dy = (1080 - dh) / 2;
      ctx.drawImage(captured, 0, 0, captured.width, captured.height, dx, dy, dw, dh);

      const url = out.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${gerarNomeArquivo()}.png`;
      link.click();
      showToast('Imagem 1080×1080 baixada! Envie no WhatsApp do cliente.');
    } catch {
      showToast('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen">
      {/* ── Header ── */}
      <div className="mb-6 border-b border-white/5 pb-6 flex items-start justify-between">
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

      {/* ── Formulário — 3 colunas em cima ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* Card Consórcio */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
          <SectionTitle icon={Calculator} label="Consórcio" iconBg="bg-orange-500/20" />
          <div className="space-y-3">
            <MoneyField
              label="Valor do Crédito"
              value={valorCreditoStr}
              onChange={handleMoney(setValorCreditoStr)}
              placeholder="80.000"
            />
            <div className="grid grid-cols-2 gap-3">
              <CompactField
                label="Prazo"
                value={prazoC}
                onChange={(e) => setPrazoC(e.target.value)}
                suffix="meses"
                placeholder="180"
              />
              <CompactField
                label="Taxa Adm."
                value={taxaAdm}
                onChange={(e) => setTaxaAdm(e.target.value)}
                suffix="%"
                placeholder="16"
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Parcela estimada</span>
            <span className="text-sm font-semibold text-orange-400 tabular-nums">
              {fmtBRL(res.parcelaC)}<span className="text-zinc-600 font-normal"> /mês</span>
            </span>
          </div>
        </div>

        {/* Card Financiamento */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
          <SectionTitle icon={DollarSign} label="Financiamento" iconBg="bg-red-500/20" />
          <div className="space-y-3">
            <MoneyField
              label="Valor de Entrada"
              value={valorEntradaStr}
              onChange={handleMoney(setValorEntradaStr)}
              placeholder="20.000"
            />
            <div className="grid grid-cols-2 gap-3">
              <CompactField
                label="Prazo"
                value={prazoF}
                onChange={(e) => setPrazoF(e.target.value)}
                suffix="meses"
                placeholder="360"
              />
              <CompactField
                label="Juros a.a."
                value={taxaJuros}
                onChange={(e) => setTaxaJuros(e.target.value)}
                suffix="%"
                placeholder="12"
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Parcela estimada (Price)</span>
            <span className="text-sm font-semibold text-red-400 tabular-nums">
              {fmtBRL(res.parcelaF)}<span className="text-zinc-600 font-normal"> /mês</span>
            </span>
          </div>
        </div>

        {/* Card Cliente + Ações */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div>
            <SectionTitle icon={User} label="Cliente" iconBg="bg-zinc-700/60" />
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">
                Nome do cliente
              </label>
              <input
                type="text"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Ex: José Silva"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-100 placeholder-zinc-700 py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30"
              />
              {nomeCliente && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  Arquivo: <span className="text-orange-400 font-medium">{gerarNomeArquivo()}.png</span>
                </p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleBaixarImagem}
              disabled={!canCopy || exporting}
              className={[
                'flex items-center justify-center gap-2 rounded-xl py-3 px-4',
                'text-sm font-semibold transition-all duration-150',
                canCopy && !exporting
                  ? 'bg-orange-500 hover:bg-orange-400 text-white active:scale-[0.98] cursor-pointer shadow-md shadow-orange-500/30'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed',
              ].join(' ')}
            >
              <ImageDown size={16} className={exporting ? 'animate-bounce' : ''} />
              {exporting ? 'Gerando…' : 'Baixar Imagem 1080×1080'}
            </button>
            <button
              onClick={handleCopiarTexto}
              disabled={!canCopy}
              className={[
                'flex items-center justify-center gap-2 rounded-xl py-2.5 px-4',
                'text-sm font-semibold border transition-all duration-150',
                canCopy
                  ? 'bg-zinc-900 border-white/10 text-zinc-200 hover:bg-zinc-800 hover:border-white/20 cursor-pointer'
                  : 'bg-zinc-900/50 border-white/5 text-zinc-600 cursor-not-allowed',
              ].join(' ')}
            >
              <MessageCircle size={15} />
              Copiar Texto para WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview do card exportável — 1:1 embaixo ── */}
      <div className="max-w-xl mx-auto space-y-3">
        <p className="text-[11px] text-zinc-500 text-center uppercase tracking-widest font-medium">
          Preview da imagem gerada
        </p>
        <ExportCard
          exportRef={exportRef}
          res={res}
          valorCreditoStr={valorCreditoStr}
          prazoC={prazoC}
          prazoF={prazoF}
          taxaAdm={taxaAdm}
          taxaJuros={taxaJuros}
          valorEntradaStr={valorEntradaStr}
        />
        <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
          Consórcio com taxa administrativa total. Financiamento via Sistema Price. Uso exclusivo para fins ilustrativos.
        </p>
      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  );
}

