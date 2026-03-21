import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, closestCenter,
  useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import TemperaturaBadge from '../components/TemperaturaBadge';
import Modal from '../components/Modal';
import LeadPerfil from './LeadPerfil';
import { ETAPAS_KANBAN as ETAPAS } from '../constants/etapas';

// Dot colors per phase — minimal Huly-style indicators
const FASE_DOT = {
  anuncio:   '#a78bfa',
  captacao:  '#f97316',
  comercial: '#f59e0b',
  fechado:   '#22c55e',
  perdido:   '#52525b',
};

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

function LeadCard({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(lead.id),
    data: { lead },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    transition: isDragging ? 'none' : 'opacity 0.2s ease',
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
      className="kanban-card group hover:border-zinc-700/60 transition-colors duration-200"
    >
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

      {/* Pills — valor da carta, urgência, etc. */}
      <div className="flex flex-wrap gap-1.5 mb-2 pl-[18px]">
        {lead.valor_carta && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
                           bg-orange-500/10 text-orange-400">
            R$ {lead.valor_carta}
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

function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.nome });
  const dotColor = FASE_DOT[etapa.fase] || '#52525b';

  return (
    <div ref={setNodeRef} className="flex-shrink-0 flex flex-col" style={{ width: 260 }}>
      {/* Header — minimal Huly-style */}
      <div className="flex items-center gap-2 px-1 py-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        <span className="text-xs font-semibold text-zinc-300 truncate">
          {etapa.nome}
        </span>
        <span className="text-[10px] font-bold text-zinc-600 tabular-nums ml-auto">
          {leads.length}
        </span>
      </div>

      {/* Botão "+" ou formulário inline — logo abaixo do header */}
      {adicionando ? (
        <InlineAddForm
          etapaNome={etapa.nome}
          onAdd={onAdd}
          onCancel={onCancelarAdd}
        />
      ) : (
        <button
          onClick={onIniciarAdd}
          className="w-full flex items-center gap-1.5 px-1 py-1.5 rounded-md text-xs font-medium
                     text-zinc-500 hover:text-zinc-300
                     transition-all duration-150 cursor-pointer"
        >
          <PlusIcon />
          Adicionar lead
        </button>
      )}

      {/* Área droppável — zero bordas, zero backgrounds, espaço negativo puro */}
      <div
        className="flex-1 flex flex-col gap-2 mt-2 px-0.5 transition-colors duration-150"
        style={{
          minHeight: 460,
          ...(isOver ? { background: 'rgba(249,115,22,0.04)', borderRadius: 12 } : {}),
        }}
      >
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 py-10 mt-1 text-center text-zinc-700">
            <InboxIcon />
            <p className="text-[11px] leading-relaxed">
              Sem leads aqui.<br />Arraste para mover.
            </p>
          </div>
        ) : leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onCardClick} />
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
            <div key={i} className="flex-shrink-0 space-y-3" style={{ width: 260 }}>
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
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [leadAberto, setLeadAberto] = useState(null);
  const [ativo, setAtivo] = useState(null);
  const [sobreColuna, setSobreColuna] = useState(null);
  // Coluna com formulário inline ativo (null = nenhuma)
  const [colunaAdicionando, setColunaAdicionando] = useState(null);

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
    ETAPAS.forEach(({ nome }) => { mapa[nome] = []; });
    leads.forEach((lead) => {
      if (mapa[lead.etapa_funil]) mapa[lead.etapa_funil].push(lead);
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
    try {
      await api.moverEtapa(leadId, novaEtapa);
    } catch {
      carregarLeads();
    }
  }

  if (carregando) return <KanbanSkeleton />;

  return (
    <div className="h-full flex flex-col bg-zinc-950">

      {/* Header */}
      <div className="flex flex-col gap-3 px-6 pt-5 pb-4 flex-shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold tracking-tight text-zinc-100">Kanban</h1>
          <span className="text-[11px] font-medium text-zinc-600 tabular-nums">
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-5">
          {Object.entries(FASE_DOT).map(([fase, color]) => (
            <span
              key={fase}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500"
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ background: color }} />
              {fase}
            </span>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ scrollBehavior: 'smooth', overscrollBehavior: 'contain' }}>
        <div className="px-6 py-5" style={{ minWidth: 'max-content', minHeight: '100%' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 items-start">
              {ETAPAS.map((etapa) => (
                <Coluna
                  key={etapa.nome}
                  etapa={etapa}
                  leads={leadsPorEtapa[etapa.nome]}
                  onCardClick={setLeadAberto}
                  isOver={sobreColuna === etapa.nome}
                  adicionando={colunaAdicionando === etapa.nome}
                  onIniciarAdd={() => setColunaAdicionando(etapa.nome)}
                  onAdd={handleAdicionarLead}
                  onCancelarAdd={() => setColunaAdicionando(null)}
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
    </div>
  );
}
