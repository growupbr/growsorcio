import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, closestCenter,
  useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { Building2, Banknote, TrendingUp, Shield, Zap } from 'lucide-react';
import logoGrow from '../assets/logogrowsorcio.webp';
import mascoteFoguete from '../assets/file.svg';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';
import { useAuth } from '../hooks/useAuth';
import TemperaturaBadge from '../components/TemperaturaBadge';
import BulkActionBar from '../components/BulkActionBar';
import Modal from '../components/Modal';
import LeadPerfil from './LeadPerfil';

function formatarMoeda(val) {
  if (val == null || val === '') return null;
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatarCompacto(val) {
  if (!val || val === 0) return null;
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (val >= 1_000) return `R$ ${Math.round(val / 1_000)}k`;
  return formatarMoeda(val);
}

const ETAPAS_POTENCIAL = new Set([
  'Reunião Agendada', 'Reunião Realizada', 'Proposta Enviada', 'Follow-up Proposta',
]);

function formatarData(str) {
  if (!str) return null;
  const [, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}`;
}

function vencido(data) {
  if (!data) return false;
  return data.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

// ─── Ícones inline ───────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>
);

const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const InboxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"/>
  </svg>
);

// ─── Som de caixa registradora ──────────────────────────────────────────────

function playRegisterSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Clique mecânico: burst de noise branco curto
    const bufLen = ctx.sampleRate * 0.04;
    const noiseBuffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    noiseSource.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(ctx.currentTime);

    // Ding 1 — 880 Hz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.02);
    osc1.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.35);
    gain1.gain.setValueAtTime(0, ctx.currentTime + 0.02);
    gain1.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime + 0.02);
    osc1.stop(ctx.currentTime + 0.6);

    // Ding 2 — 1100 Hz (0.07s depois)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.4);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.09);
    gain2.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.09);
    osc2.stop(ctx.currentTime + 0.7);

    // Fecha o contexto após o som terminar
    setTimeout(() => ctx.close(), 900);
  } catch (_) {
    // Silently ignore: AudioContext not available
  }
}

// ─── Modal "Money in the Bank" ──────────────────────────────────────────────

function ModalFechado({ lead, onFechar, user }) {
  const nomeAssinante = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Campeão';

  useEffect(() => {
    playRegisterSound();
    const handler = (e) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(14px)', background: 'rgba(2,6,23,0.70)' }}
      onClick={onFechar}
    >
      <div
        className="relative max-w-sm w-full rounded-2xl overflow-hidden text-center select-none"
        style={{
          background: '#09090b',
          border: '1px solid #27272a',
          boxShadow: '0 0 0 1px rgba(255,69,0,0.12), 0 24px 80px rgba(0,0,0,0.8)',
          animation: 'modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent line */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #FF4500 30%, #22C55E 70%, transparent)' }} />

        <div className="pt-8 pb-8 px-8">
          {/* Mascote decolando */}
          <div className="flex justify-center mb-5" style={{ animation: 'rocketLaunch 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <div style={{ animation: 'rocketFloat 2s ease-in-out 0.9s infinite' }}>
              <img
                src={mascoteFoguete}
                alt="Mascote decolando"
                className="w-28 h-28 object-contain drop-shadow-lg"
                style={{ filter: 'drop-shadow(0 0 18px rgba(255,99,0,0.55))' }}
              />
            </div>
          </div>

          <h2 className="text-white font-bold text-xl leading-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
            Negócio fechado!
          </h2>
          <p className="text-sm font-semibold mb-5" style={{ color: '#F59E0B' }}>
            Parabéns, {nomeAssinante}!
          </p>

          {lead.valor_da_carta > 0 && (
            <>
              <div
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl mb-2 w-full"
                style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}
              >
                <span className="text-2xl font-black leading-none" style={{ color: '#22C55E' }}>
                  {formatarMoeda(lead.valor_da_carta)}
                </span>
              </div>
              <p className="text-xs font-medium mb-5" style={{ color: '#71717a', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                em carta de crédito vendido
              </p>
            </>
          )}

          <button
            onClick={onFechar}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] cursor-pointer"
            style={{ background: '#FF4500', boxShadow: '0 0 20px rgba(255,69,0,0.28)' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e03d00'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FF4500'; }}
          >
            Continuar escalando 🚀
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalPop {
          0%   { opacity: 0; transform: scale(0.88) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rocketLaunch {
          0%   { opacity: 0; transform: translateY(30px) scale(0.7); }
          60%  { opacity: 1; transform: translateY(-10px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        @keyframes rocketFloat {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}

// ─── Blessed Badge ────────────────────────────────────────────────────────────

const BLESSED_ITEMS = [
  { Icon: Building2,  key: 'tipo_de_bem',       label: 'Bem',      check: (v) => !!v },
  { Icon: Banknote,   key: 'valor_da_carta',     label: 'Valor',    check: (v) => v > 0 },
  { Icon: TrendingUp, key: 'recurso_para_lance', label: 'Lance',    check: (v) => v > 0 },
  { Icon: Shield,     key: 'restricao_cpf',      label: 'CPF ok',   check: (v) => v === false || v === 0 },
  { Icon: Zap,        key: 'urgencia',           label: 'Urgência', check: (v) => !!v },
];

function BlessedBadge({ lead }) {
  return (
    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-white/5">
      {BLESSED_ITEMS.map(({ Icon, key, label, check }) => {
        const lit = check(lead[key]);
        return (
          <div
            key={key}
            title={label}
            className={`transition-transform duration-150 hover:scale-110 ${lit ? 'text-yellow-400' : 'text-zinc-700'}`}
          >
            <Icon size={11} strokeWidth={lit ? 2.5 : 1.5} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Formulário inline ───────────────────────────────────────────────────────

function InlineAddForm({ etapaNome, onAdd, onCancel }) {
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleAdd() {
    const nome = valor.trim();
    if (!nome || salvando) return;
    setSalvando(true);
    await onAdd(nome, etapaNome);
    setSalvando(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div
      className="mt-2 space-y-2"
      style={{ animation: 'fadeSlideIn 0.15s ease' }}
    >
      <textarea
        ref={textareaRef}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nome ou @instagram..."
        rows={2}
        className="w-full rounded-xl px-3 py-2 text-sm resize-none bg-zinc-900 text-zinc-100
                   border border-orange-500/40 outline-none focus:ring-2 focus:ring-orange-500/20"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleAdd}
          disabled={!valor.trim() || salvando}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
        >
          {salvando ? '...' : 'Adicionar'}
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Lead Card (draggável) ────────────────────────────────────────────────────

function LeadCard({ lead, onClick, isSelected, onToggleSelect }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(lead.id),
    data: { lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    transition: isDragging ? 'none' : 'opacity 0.2s ease',
    ...(isSelected ? { borderColor: 'rgba(255,69,0,0.45)', background: 'rgba(255,69,0,0.05)' } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!transform || (Math.abs(transform.x) < 4 && Math.abs(transform.y) < 4)) {
          onClick(lead.id);
        }
      }}
      className="kanban-card group hover:border-zinc-700/60 transition-colors duration-200 relative"
    >
      {/* Checkbox de seleção — top-right, visível no hover ou quando selecionado */}
      <div
        className={`absolute top-2 right-2 z-10 transition-opacity duration-150 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggleSelect && onToggleSelect(lead.id); }}
      >
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={() => {}}
          className="w-4 h-4 rounded cursor-pointer accent-orange-500"
        />
      </div>

      {/* Badge anúncio */}
      {lead.origem === 'anuncio' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2
                         text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
          📢 Anúncio
        </span>
      )}

      {/* Nome + dot de temperatura */}
      <div className="flex items-start gap-2 mb-2">
        <TemperaturaBadge temperatura={lead.temperatura} small />
        <p className="leading-snug line-clamp-2 flex-1 text-sm font-bold text-zinc-100">
          {lead.nome}
        </p>
      </div>

      {/* Instagram */}
      {lead.instagram && (
        <a
          href={`https://ig.me/m/${lead.instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 truncate mb-3 pl-[18px]
                     text-xs text-zinc-500 hover:text-orange-400 transition-colors cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[11px] h-[11px] flex-shrink-0">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
          <span className="truncate">{lead.instagram}</span>
        </a>
      )}

      {/* Pills — valor do crédito + urgência */}
      <div className="flex flex-wrap gap-1.5 mb-2 pl-[18px]">
        {formatarMoeda(lead.valor_da_carta) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold
                           bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5 flex-shrink-0">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            {formatarMoeda(lead.valor_da_carta)}
          </span>
        )}
        {lead.urgencia && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                           bg-amber-500/10 text-amber-400">
            {lead.urgencia}
          </span>
        )}
      </div>

      {/* Rodapé — data próxima ação */}
      {lead.data_proxima_acao && (
        <div className={`flex items-center gap-1.5 mt-auto pt-2 border-t border-white/5
                         text-[11px] font-medium ${vencido(lead.data_proxima_acao) ? 'text-red-400' : 'text-zinc-600'}`}>
          {vencido(lead.data_proxima_acao) ? <AlertIcon /> : <CalIcon />}
          <span>{formatarData(lead.data_proxima_acao)}</span>
          {lead.tipo_proxima_acao && (
            <span className="truncate ml-auto text-zinc-700">
              {lead.tipo_proxima_acao}
            </span>
          )}
        </div>
      )}

      {/* Blessed Badge — Método Blessed */}
      <BlessedBadge lead={lead} />
    </div>
  );
}

// ─── Card estático para DragOverlay ──────────────────────────────────────────

function LeadCardOverlay({ lead }) {
  return (
    <div className="rounded-xl p-3 w-56 cursor-grabbing select-none bg-zinc-900 border border-orange-500/50"
         style={{
           boxShadow: '0 0 20px rgba(249,115,22,0.4), 0 0 60px rgba(249,115,22,0.15), 0 24px 64px rgba(0,0,0,0.8)',
           transform: 'rotate(3deg) scale(1.03)',
           zIndex: 9999,
         }}>
      <div className="flex items-start gap-2 mb-2">
        <TemperaturaBadge temperatura={lead.temperatura} small />
        <p className="text-sm font-semibold leading-tight text-zinc-100">{lead.nome}</p>
      </div>
      {lead.instagram && (
        <p className="text-xs truncate text-zinc-500">{lead.instagram}</p>
      )}
    </div>
  );
}

// ─── Coluna do Kanban ─────────────────────────────────────────────────────────

function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd, selectedIds, onToggleSelect, totalValor }) {
  const { setNodeRef } = useDroppable({ id: etapa.name });
  const dotColor = etapa.color || '#52525b';
  const isFechado = etapa.name === 'Fechado';

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 flex flex-col rounded-xl transition-all duration-200"
      style={{
        width: 280,
        ...(isOver ? { background: 'rgba(255,255,255,0.022)', outline: '1px solid rgba(255,255,255,0.08)' } : {}),
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-2.5 pb-2 border-b border-white/5">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <span className="text-sm font-semibold text-zinc-200 truncate flex-1">
          {etapa.name}
        </span>
        <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-zinc-900 text-zinc-500 border border-white/5">
          {leads.length}
        </span>
      </div>

      {/* Totalizador */}
      {totalValor != null && (
        <div
          className={`mx-1 mt-2 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold tabular-nums ${
            isFechado
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          <span>{isFechado ? '✅ Realizados' : '⚡ Potencial'}</span>
          <span>{formatarCompacto(totalValor)}</span>
        </div>
      )}

      {/* "+" ou formulário inline */}
      <div className="px-1 pt-1.5">
        {adicionando ? (
          <InlineAddForm
            etapaNome={etapa.name}
            onAdd={onAdd}
            onCancel={onCancelarAdd}
          />
        ) : (
          <button
            onClick={onIniciarAdd}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium
                       text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03]
                       transition-all duration-150 cursor-pointer group"
          >
            <span className="text-orange-500/70 group-hover:text-orange-400 transition-colors"><PlusIcon /></span>
            Adicionar lead
          </button>
        )}
      </div>

      {/* Área droppável */}
      <div
        className="flex-1 flex flex-col gap-2.5 mt-2 px-1 pb-2"
        style={{ minHeight: 460 }}
      >
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700/40 py-10 mt-1 text-center">
            <InboxIcon />
            <div>
              <p className="text-[11px] font-medium text-zinc-600">Sem leads aqui</p>
              <p className="text-[10px] text-zinc-700 mt-0.5">Arraste para mover</p>
            </div>
          </div>
        ) : leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={onCardClick}
            isSelected={selectedIds?.has(lead.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton de carregamento ────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="flex-shrink-0 border-b border-white/5 px-6 pt-5 pb-4">
        <div className="h-4 w-20 bg-zinc-800 rounded-full animate-pulse mb-3" />
        <div className="flex gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-2.5 w-14 bg-zinc-800 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-x-auto px-6 py-5">
        <div className="flex gap-4 items-start">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 space-y-3" style={{ width: 280 }}>
              <div className="h-3 w-28 bg-zinc-800 rounded-full animate-pulse" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="rounded-xl bg-zinc-900 border border-white/5 animate-pulse p-3 space-y-2.5"
                  style={{ animationDelay: `${(i * 3 + j) * 60}ms` }}
                >
                  <div className="h-2 w-2 rounded-full bg-zinc-800" />
                  <div className="h-3 w-3/4 bg-zinc-800 rounded-full" />
                  <div className="h-2.5 w-1/2 bg-zinc-800/70 rounded-full" />
                  <div className="h-2 w-1/3 bg-zinc-800/50 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Página Kanban ────────────────────────────────────────────────────────────

export default function Kanban() {
  const { user } = useAuth();
  const { etapas, carregando: carregandoEtapas } = useFunilStages();
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [leadAberto, setLeadAberto] = useState(null);
  const [ativo, setAtivo] = useState(null);
  const [sobreColuna, setSobreColuna] = useState(null);
  // Coluna com formulário inline ativo (null = nenhuma)
  const [colunaAdicionando, setColunaAdicionando] = useState(null);
  const [selectedIds, setSelectedIds]               = useState(new Set());
  const [leadFechado, setLeadFechado]               = useState(null);

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBulkSuccess(diffs) {
    setLeads((prev) =>
      prev.map((lead) => {
        const diff = diffs.find((d) => d.id === lead.id);
        return diff ? { ...lead, ...diff } : lead;
      })
    );
  }

  const carregarLeads = useCallback(async () => {
    try {
      const dados = await api.listarLeads();
      setLeads(dados);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarLeads(); }, [carregarLeads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Agrupa leads por etapa — memoizado para não reprocessar em cada drag/hover
  const leadsPorEtapa = useMemo(() => {
    const mapa = {};
    etapas.forEach(({ name }) => { mapa[name] = []; });
    leads.forEach((lead) => {
      if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
    });
    return mapa;
  }, [leads, etapas]);

  // Soma valor_da_carta por etapa para totalizador
  const totalPorEtapa = useMemo(() => {
    const mapa = {};
    leads.forEach((lead) => {
      if (!lead.valor_da_carta) return;
      const etapa = lead.etapa_funil;
      if (etapa === 'Fechado' || ETAPAS_POTENCIAL.has(etapa)) {
        mapa[etapa] = (mapa[etapa] || 0) + Number(lead.valor_da_carta);
      }
    });
    return mapa;
  }, [leads]);

  // Criação inline (estilo Trello)
  async function handleAdicionarLead(nome, etapaNome) {
    // Detecta @instagram → usa como instagram, deriva nome sem @
    const isInstagram = nome.startsWith('@');
    const dadosLead = {
      nome:        isInstagram ? nome.slice(1) : nome,
      instagram:   isInstagram ? nome : '',
      etapa_funil: etapaNome,
      temperatura: 'frio',
      origem:      etapaNome === 'Lead Anúncio' ? 'anuncio' : 'prospeccao',
    };

    try {
      const novoLead = await api.criarLead(dadosLead);
      // Adiciona otimisticamente na UI
      setLeads((prev) => [...prev, novoLead]);
      setColunaAdicionando(null);
    } catch (err) {
      console.error('Erro ao criar lead:', err);
    }
  }

  // DnD handlers
  function handleDragStart({ active }) {
    setAtivo(leads.find((l) => String(l.id) === active.id) || null);
    // Fecha formulário inline ao iniciar drag
    setColunaAdicionando(null);
  }

  function handleDragOver({ over }) {
    setSobreColuna(over?.id || null);
  }

  async function handleDragEnd({ active, over }) {
    setAtivo(null);
    setSobreColuna(null);
    if (!over) return;
    const leadId = Number(active.id);
    const novaEtapa = over.id;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.etapa_funil === novaEtapa) return;
    setLeads((prev) =>
      prev.map((l) => l.id === leadId ? { ...l, etapa_funil: novaEtapa } : l)
    );
    // 🏆 "Money in the Bank"
    if (novaEtapa === 'Fechado') {
      setLeadFechado({ ...lead, etapa_funil: novaEtapa });
      const colors = ['#22C55E', '#FFD700', '#FF4500', '#F59E0B', '#ffffff'];
      const end = Date.now() + 2800;
      (function frame() {
        confetti({ particleCount: 4, angle: 60,  spread: 60, origin: { x: 0, y: 0.65 }, colors, zIndex: 300 });
        confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.65 }, colors, zIndex: 300 });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
    try {
      await api.moverEtapa(leadId, novaEtapa);
    } catch {
      carregarLeads();
    }
  }

  if (carregando || carregandoEtapas) return <KanbanSkeleton />;

  return (
    <div className="h-full flex flex-col bg-zinc-950">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-white/5">
        <h1 className="text-base font-bold tracking-tight text-zinc-100">Kanban</h1>
        <span className="text-[11px] font-medium text-zinc-600 tabular-nums">
          {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-auto dot-grid" style={{ scrollBehavior: 'smooth', overscrollBehavior: 'contain' }}>
        <div className="px-6 py-5" style={{ minWidth: 'max-content', minHeight: '100%' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 items-start">
              {etapas.map((etapa) => (
                <Coluna
                  key={etapa.id}
                  etapa={etapa}
                  leads={leadsPorEtapa[etapa.name] || []}
                  onCardClick={setLeadAberto}
                  isOver={sobreColuna === etapa.name}
                  adicionando={colunaAdicionando === etapa.name}
                  onIniciarAdd={() => setColunaAdicionando(etapa.name)}
                  onAdd={handleAdicionarLead}
                  onCancelarAdd={() => setColunaAdicionando(null)}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  totalValor={totalPorEtapa[etapa.name] ?? null}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {ativo ? <LeadCardOverlay lead={ativo} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>


      {/* Modal: perfil do lead */}
      {leadAberto && (
        <Modal title="Perfil do Lead" onClose={() => setLeadAberto(null)} wide>
          <LeadPerfil
            leadId={leadAberto}
            onFechar={() => setLeadAberto(null)}
            onAtualizado={carregarLeads}
          />
        </Modal>
      )}

      {/* Modal: "Money in the Bank" 🏆 */}
      {leadFechado && (
        <ModalFechado lead={leadFechado} onFechar={() => setLeadFechado(null)} user={user} />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselect={() => setSelectedIds(new Set())}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
