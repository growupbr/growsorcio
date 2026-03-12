import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, closestCenter,
  useSensor, useSensors, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../api/client';
import TemperaturaBadge from '../components/TemperaturaBadge';
import Modal from '../components/Modal';
import LeadPerfil from './LeadPerfil';

const ETAPAS = [
  { nome: 'Lead Anúncio',       fase: 'anuncio'  },
  { nome: 'Analisar Perfil',    fase: 'captacao' },
  { nome: 'Seguiu Perfil',      fase: 'captacao' },
  { nome: 'Abordagem Enviada',  fase: 'captacao' },
  { nome: 'Respondeu',          fase: 'captacao' },
  { nome: 'Em Desenvolvimento', fase: 'captacao' },
  { nome: 'Follow-up Ativo',    fase: 'captacao' },
  { nome: 'Lead Capturado',     fase: 'captacao' },
  { nome: 'Reunião Agendada',   fase: 'captacao' },
  { nome: 'Reunião Realizada',  fase: 'captacao' },
  { nome: 'Proposta Enviada',   fase: 'comercial' },
  { nome: 'Follow-up Proposta', fase: 'comercial' },
  { nome: 'Fechado',            fase: 'fechado' },
  { nome: 'Perdido',            fase: 'perdido' },
];

const FASE_STYLE = {
  anuncio:   { color: '#a78bfa', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.30)' },
  captacao:  { color: '#FF4500', bg: 'rgba(255,69,0,0.08)',   border: 'rgba(255,69,0,0.25)' },
  comercial: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  fechado:   { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)' },
  perdido:   { color: '#484F58', bg: 'rgba(72,79,88,0.08)',   border: 'rgba(72,79,88,0.25)' },
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

// ─── Formulário inline (estilo Trello) ───────────────────────────────────────

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
        className="w-full rounded-lg px-3 py-2 text-sm resize-none"
        style={{
          background: '#0D1117',
          border: '1px solid #FF4500',
          color: '#F0F6FC',
          outline: 'none',
          boxShadow: '0 0 0 3px rgba(255,69,0,0.12)',
        }}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleAdd}
          disabled={!valor.trim() || salvando}
          className="btn-primary text-xs py-1.5 px-3"
        >
          {salvando ? '...' : 'Adicionar'}
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-md transition-colors cursor-pointer"
          style={{ color: '#484F58' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F0F6FC'}
          onMouseLeave={e => e.currentTarget.style.color = '#484F58'}
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
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(lead.origem === 'anuncio' ? { borderLeft: '3px solid #7c3aed' } : {}),
      }}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!transform || (Math.abs(transform.x) < 4 && Math.abs(transform.y) < 4)) {
          onClick(lead.id);
        }
      }}
      className="kanban-card"
    >
      {/* Badge anúncio */}
      {lead.origem === 'anuncio' && (
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full mb-2"
          style={{
            fontSize: 10,
            fontWeight: 700,
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.35)',
            color: '#a78bfa',
          }}
        >
          📢 Anúncio
        </div>
      )}

      {/* Nome + dot de temperatura */}
      <div className="flex items-start gap-2 mb-2">
        <TemperaturaBadge temperatura={lead.temperatura} small />
        <p
          className="leading-snug line-clamp-2 flex-1"
          style={{ fontSize: 14, fontWeight: 700, color: '#F0F6FC' }}
        >
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
          className="flex items-center gap-1 truncate mb-3 cursor-pointer"
          style={{ fontSize: 12, color: '#8B949E', paddingLeft: 18 }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FF4500'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8B949E'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 11, height: 11, flexShrink: 0 }}>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
          </svg>
          <span className="truncate">{lead.instagram}</span>
        </a>
      )}

      {/* Rodapé — data próxima ação */}
      {lead.data_proxima_acao && (
        <div
          className="flex items-center gap-1.5 mt-auto pt-2"
          style={{
            borderTop: '1px solid #1C2333',
            fontSize: 11,
            fontWeight: 500,
            color: vencido(lead.data_proxima_acao) ? '#f87171' : '#484F58',
          }}
        >
          {vencido(lead.data_proxima_acao) ? <AlertIcon /> : <CalIcon />}
          <span>{formatarData(lead.data_proxima_acao)}</span>
          {lead.tipo_proxima_acao && (
            <span className="truncate ml-auto" style={{ color: '#30363D' }}>
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
    <div
      className="rounded-lg p-3 w-56 cursor-grabbing select-none"
      style={{
        background: '#161B22',
        border: '1px solid rgba(255,69,0,0.5)',
        boxShadow: '0 0 30px rgba(255,69,0,0.15), 0 16px 48px rgba(0,0,0,0.7)',
        transform: 'rotate(2deg)',
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <TemperaturaBadge temperatura={lead.temperatura} small />
        <p className="text-sm font-semibold leading-tight" style={{ color: '#F0F6FC' }}>{lead.nome}</p>
      </div>
      {lead.instagram && (
        <p className="text-xs truncate" style={{ color: '#8B949E' }}>{lead.instagram}</p>
      )}
    </div>
  );
}

// ─── Coluna do Kanban ─────────────────────────────────────────────────────────

function Coluna({ etapa, leads, onCardClick, isOver, adicionando, onIniciarAdd, onAdd, onCancelarAdd }) {
  const { setNodeRef } = useDroppable({ id: etapa.nome });
  const fase = FASE_STYLE[etapa.fase];
  const isAnuncio = etapa.fase === 'anuncio';

  return (
    <div ref={setNodeRef} className="flex-shrink-0 flex flex-col" style={{ width: 248 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 mb-2 rounded-lg"
        style={{ background: fase.bg, border: `1px solid ${fase.border}` }}
      >
        <span className="text-xs font-semibold truncate" style={{ color: fase.color }}>
          {etapa.nome}
        </span>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-md ml-2 flex-shrink-0 tabular-nums"
          style={{ background: 'rgba(0,0,0,0.3)', color: fase.color, minWidth: 20, textAlign: 'center' }}
        >
          {leads.length}
        </span>
      </div>

      {/* Área droppável */}
      <div
        className="flex-1 rounded-xl p-2 space-y-2"
        style={{
          minHeight: 500,
          background: isOver ? (isAnuncio ? 'rgba(124,58,237,0.05)' : 'rgba(255,69,0,0.04)') : '#0D1117',
          border: `1px solid ${isOver ? (isAnuncio ? 'rgba(124,58,237,0.35)' : 'rgba(255,69,0,0.30)') : '#1C2333'}`,
          boxShadow: isOver ? (isAnuncio ? '0 0 16px rgba(124,58,237,0.08) inset' : '0 0 16px rgba(255,69,0,0.06) inset') : '0 4px 24px rgba(0,0,0,0.3)',
          transition: 'border-color 150ms ease, background 150ms ease',
        }}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={onCardClick} />
        ))}

        {leads.length === 0 && !adicionando && (
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              height: 80,
              border: `1px dashed ${isOver ? 'rgba(255,69,0,0.40)' : '#1C2333'}`,
            }}
          >
            <span className="text-xs" style={{ color: '#30363D' }}>Vazio</span>
          </div>
        )}
      </div>

      {/* Formulário inline OU botão "+" */}
      {adicionando ? (
        <InlineAddForm
          etapaNome={etapa.nome}
          onAdd={onAdd}
          onCancel={onCancelarAdd}
        />
      ) : (
        <button
          onClick={onIniciarAdd}
          className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                     transition-all duration-150 cursor-pointer group"
          style={{ color: '#484F58' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#FF4500';
            e.currentTarget.style.background = 'rgba(255,69,0,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#484F58';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <PlusIcon />
          Adicionar lead
        </button>
      )}
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

  // Agrupa leads por etapa
  const leadsPorEtapa = {};
  ETAPAS.forEach(({ nome }) => { leadsPorEtapa[nome] = []; });
  leads.forEach((lead) => {
    if (leadsPorEtapa[lead.etapa_funil]) leadsPorEtapa[lead.etapa_funil].push(lead);
  });

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

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
            style={{ borderColor: '#1C2333', borderTopColor: '#FF4500' }}
          />
          <p className="text-sm" style={{ color: '#8B949E' }}>Carregando kanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #1C2333' }}
      >
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-extrabold" style={{ color: '#F0F6FC' }}>Kanban</h1>
          <div className="flex items-center gap-4">
            {Object.entries(FASE_STYLE).map(([fase, style]) => (
              <span
                key={fase}
                className="flex items-center gap-1.5 text-xs font-medium capitalize"
                style={{ color: style.color }}
              >
                <span
                  className="w-2 h-2 rounded-sm inline-block"
                  style={{ background: style.color, opacity: 0.7 }}
                />
                {fase}
              </span>
            ))}
          </div>
        </div>
        <span className="text-xs font-medium" style={{ color: '#484F58' }}>
          {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
        <div className="px-6 py-5" style={{ minWidth: 'max-content', minHeight: '100%' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 items-start">
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
