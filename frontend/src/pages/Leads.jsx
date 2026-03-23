import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import TemperaturaBadge from '../components/TemperaturaBadge';
import EtapaTag from '../components/EtapaTag';
import Modal from '../components/Modal';
import BulkActionBar from '../components/BulkActionBar';
import LeadPerfil from './LeadPerfil';
import { ETAPAS } from '../constants/etapas';

const ORIGENS = [
  { valor: 'prospeccao', label: 'Prospecção', cor: '#FF4500', bg: 'rgba(255,69,0,0.15)',    border: 'rgba(255,69,0,0.40)'    },
  { valor: 'anuncio',    label: 'Anúncio',    cor: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.40)'  },
];

const TEMPERATURAS = [
  { valor: 'quente', label: 'Quente', cor: '#f87171', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.40)'  },
  { valor: 'morno',  label: 'Morno',  cor: '#fbbf24', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.40)' },
  { valor: 'frio',   label: 'Frio',   cor: '#60a5fa', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.40)' },
];

const PERIODOS = [
  { valor: 'vencido', label: 'Vencido' },
  { valor: 'hoje',    label: 'Hoje'    },
  { valor: 'semana',  label: 'Esta semana' },
];

const FILTRO_KEY = 'growsorcio_filtro_periodo';

function filtrosPadrao() {
  // Lê filtro injetado pela notificação desktop (se houver) e limpa
  const periodo = sessionStorage.getItem(FILTRO_KEY) || '';
  sessionStorage.removeItem(FILTRO_KEY);
  return { busca: '', etapa: '', temperatura: '', periodo, origem: '', ordem: 'proxima_acao' };
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatarData(str) {
  if (!str) return '—';
  const [, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}`;
}

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

function vencido(data) {
  if (!data) return false;
  return data.slice(0, 10) < dataHoje();
}

// Filtro de período agora é feito server-side

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Avatar({ nome }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 uppercase"
      style={{ background: 'rgba(255,69,0,0.12)', color: '#FF4500' }}
    >
      {nome?.charAt(0) || '?'}
    </div>
  );
}

// Pill genérica (para temperatura e período)
function Pill({ label, ativo, onClick, cor, bg, border }) {
  const estiloAtivo = {
    background: bg   || 'rgba(255,69,0,0.15)',
    border:     `1px solid ${border || 'rgba(255,69,0,0.40)'}`,
    color:      cor  || '#FF4500',
    fontWeight: 600,
  };
  const estiloInativo = {
    background: '#27272a',
    border:     '1px solid rgba(255,255,255,0.08)',
    color:      '#a1a1aa',
  };

  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
      style={{
        ...(ativo ? estiloAtivo : estiloInativo),
        transition: 'all 150ms ease',
      }}
      onMouseEnter={e => {
        if (!ativo) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
          e.currentTarget.style.color = '#f4f4f5';
        }
      }}
      onMouseLeave={e => {
        if (!ativo) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = '#a1a1aa';
        }
      }}
    >
      {label}
    </button>
  );
}

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Leads() {
  const navigate = useNavigate();
  const [leadsBase, setLeadsBase]   = useState([]);   // dados brutos da API
  const [carregando, setCarregando] = useState(true);
  const [leadAberto, setLeadAberto] = useState(null);
  const [filtros, setFiltros]       = useState(filtrosPadrao);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Busca com debounce de 350ms para evitar fetch a cada tecla
  const [buscaInput, setBuscaInput] = useState(filtrosPadrao().busca);
  const buscaDebounceRef = useRef(null);

  // Carrega da API com todos os filtros (incluindo período server-side)
  const carregarLeads = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await api.listarLeads(filtros);
      setLeadsBase(dados);
    } finally {
      setCarregando(false);
    }
  }, [filtros]);

  useEffect(() => { carregarLeads(); }, [carregarLeads]);

  // Período é filtrado no servidor; não precisa de useMemo client-side
  const leads = leadsBase;

  // Helpers para atualizar filtros
  function setFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  // Toggle para pills (clicar no ativo = desativar)
  function toggleFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: f[campo] === valor ? '' : valor }));
  }

  function handleBuscaChange(e) {
    const valor = e.target.value;
    setBuscaInput(valor);
    clearTimeout(buscaDebounceRef.current);
    buscaDebounceRef.current = setTimeout(() => {
      setFiltros((f) => ({ ...f, busca: valor }));
    }, 350);
  }

  function limparFiltros() {
    setBuscaInput('');
    clearTimeout(buscaDebounceRef.current);
    setFiltros({ busca: '', etapa: '', temperatura: '', periodo: '', origem: '', ordem: 'proxima_acao' });
  }

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  const todosIds = leads.map((l) => l.id);
  const todosSelected = todosIds.length > 0 && todosIds.every((id) => selectedIds.has(id));
  const alguemSelected = todosIds.some((id) => selectedIds.has(id));

  function toggleSelect(id, e) {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll(e) {
    e.stopPropagation();
    if (todosSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(todosIds));
    }
  }

  function handleBulkSuccess(diffs) {
    // Aplica diffs otimisticamente — evita re-fetch completo
    setLeadsBase((prev) =>
      prev.map((lead) => {
        const diff = diffs.find((d) => d.id === lead.id);
        return diff ? { ...lead, ...diff } : lead;
      })
    );
  }

  const temFiltroAtivo =
    filtros.busca || filtros.etapa || filtros.temperatura || filtros.periodo || filtros.origem;

  const labelContador = carregando
    ? 'Carregando...'
    : `${leads.length} lead${leads.length !== 1 ? 's' : ''} encontrado${leads.length !== 1 ? 's' : ''}`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-extrabold leading-tight" style={{ fontSize: 28, color: '#f4f4f5' }}>
            Leads
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#a1a1aa' }}>
            {labelContador}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost"
            onClick={() => api.exportarCSV()}
            title="Exportar todos os leads como CSV"
          >
            ↓ Exportar CSV
          </button>
          <button className="btn-primary" onClick={() => navigate('/leads/novo')}>
            <PlusIcon /> Novo lead
          </button>
        </div>
      </div>

      {/* ── Painel de filtros ── */}
      <div
        className="rounded-2xl p-5 mb-6 space-y-4"
        style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
      >

        {/* Linha 1: Busca + Ordenar */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              <SearchIcon />
            </span>
            <input
              className="input pl-9"
              placeholder="Buscar por nome, WhatsApp ou e-mail..."
              value={buscaInput}
              onChange={handleBuscaChange}
            />
          </div>
          <div style={{ minWidth: 160 }}>
            <select
              className="input"
              value={filtros.ordem}
              onChange={(e) => setFiltro('ordem', e.target.value)}
            >
              <option value="proxima_acao">Próxima ação</option>
              <option value="criado_em">Mais recentes</option>
              <option value="nome">Nome A-Z</option>
            </select>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

        {/* Linha 2: Origem — pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="section-label" style={{ minWidth: 90 }}>Origem</span>
          <div className="flex gap-2 flex-wrap">
            {ORIGENS.map(({ valor, label, cor, bg, border }) => (
              <Pill
                key={valor}
                label={label}
                ativo={filtros.origem === valor}
                onClick={() => toggleFiltro('origem', valor)}
                cor={cor}
                bg={bg}
                border={border}
              />
            ))}
          </div>
        </div>

        {/* Linha 3: Temperatura — pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="section-label" style={{ minWidth: 90 }}>Temperatura</span>
          <div className="flex gap-2 flex-wrap">
            {TEMPERATURAS.map(({ valor, label, cor, bg, border }) => (
              <Pill
                key={valor}
                label={label}
                ativo={filtros.temperatura === valor}
                onClick={() => toggleFiltro('temperatura', valor)}
                cor={cor}
                bg={bg}
                border={border}
              />
            ))}
          </div>
        </div>

        {/* Linha 3: Próxima ação — pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="section-label" style={{ minWidth: 90 }}>Próxima ação</span>
          <div className="flex gap-2 flex-wrap">
            {PERIODOS.map(({ valor, label }) => (
              <Pill
                key={valor}
                label={label}
                ativo={filtros.periodo === valor}
                onClick={() => toggleFiltro('periodo', valor)}
              />
            ))}
          </div>
        </div>

        {/* Linha 4: Etapa — dropdown */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="section-label" style={{ minWidth: 90 }}>Etapa</span>
          <div style={{ minWidth: 220 }}>
            <select
              className="input"
              value={filtros.etapa}
              onChange={(e) => setFiltro('etapa', e.target.value)}
            >
              <option value="">Todas as etapas</option>
              {ETAPAS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          {/* Limpar filtros — aparece no final da linha da etapa */}
          {temFiltroAtivo && (
            <button
              onClick={limparFiltros}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ml-auto"
              style={{
                background: 'rgba(255,69,0,0.08)',
                border: '1px solid rgba(255,69,0,0.20)',
                color: '#FF4500',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,69,0,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,69,0,0.40)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,69,0,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,69,0,0.20)';
              }}
            >
              <XIcon /> Limpar filtros
            </button>
          )}
        </div>

      </div>

      {/* ── Tabela ── */}
      {carregando ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[68px] rounded-xl animate-pulse"
              style={{ background: '#27272a', border: '1px solid rgba(255,255,255,0.05)' }}
            />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div
          className="rounded-2xl py-20 text-center"
          style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {temFiltroAtivo ? (
            <>
              <p className="text-sm mb-2" style={{ color: '#a1a1aa' }}>
                Nenhum lead encontrado com os filtros atuais
              </p>
              <button
                onClick={limparFiltros}
                className="text-sm font-medium cursor-pointer"
                style={{ color: '#FF4500' }}
              >
                Limpar filtros
              </button>
            </>
          ) : (
            <>
              <p className="text-sm mb-4" style={{ color: '#a1a1aa' }}>Nenhum lead cadastrado</p>
              <button className="btn-primary" onClick={() => navigate('/leads/novo')}>
                <PlusIcon /> Adicionar primeiro lead
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
        >
          {/* Header */}
          <div
            className="grid px-6 py-3 items-center"
            style={{
              background: '#18181b',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              gridTemplateColumns: '36px 2fr 1fr 1.2fr 1fr 1fr',
            }}
          >
            {/* Checkbox selecionar todos */}
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={todosSelected}
                ref={(el) => { if (el) el.indeterminate = alguemSelected && !todosSelected; }}
                onChange={toggleSelectAll}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded cursor-pointer accent-orange-500"
              />
            </div>
            {['Lead', 'Tipo de bem', 'Etapa', 'Temperatura', 'Próxima ação'].map((h) => (
              <span key={h} className="section-label">{h}</span>
            ))}
          </div>

          {/* Linhas */}
          <div>
            {leads.map((lead, idx) => {
              const isSelected = selectedIds.has(lead.id);
              return (
              <div
                key={lead.id}
                onClick={() => setLeadAberto(lead.id)}
                className="grid px-6 py-4 cursor-pointer items-center"
                style={{
                  gridTemplateColumns: '36px 2fr 1fr 1.2fr 1fr 1fr',
                  borderBottom: idx < leads.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  borderLeft: isSelected
                    ? '3px solid #FF4500'
                    : lead.origem === 'anuncio' ? '3px solid #7c3aed' : '3px solid transparent',
                  background: isSelected ? 'rgba(255,69,0,0.04)' : 'transparent',
                  transition: 'background 150ms ease-out',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#27272a'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSelect(lead.id, e)}
                    className="w-4 h-4 rounded cursor-pointer accent-orange-500"
                  />
                </div>
                {/* Lead */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar nome={lead.nome} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: '#f4f4f5' }}>
                        {lead.nome}
                      </p>
                      {lead.origem === 'anuncio' && (
                        <span
                          className="flex-shrink-0 px-1.5 py-0.5 rounded-full"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: 'rgba(124,58,237,0.15)',
                            border: '1px solid rgba(124,58,237,0.35)',
                            color: '#a78bfa',
                          }}
                        >
                          📢 Anúncio
                        </span>
                      )}
                    </div>
                    {lead.whatsapp && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#a1a1aa' }}>
                        {lead.whatsapp}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tipo de bem */}
                <div className="flex items-center">
                  <span className="text-sm truncate" style={{ color: '#a1a1aa' }}>
                    {lead.tipo_de_bem || '—'}
                  </span>
                </div>

                {/* Etapa */}
                <div className="flex items-center">
                  <EtapaTag etapa={lead.etapa_funil} />
                </div>

                {/* Temperatura */}
                <div className="flex items-center">
                  <TemperaturaBadge temperatura={lead.temperatura} />
                </div>

                {/* Próxima ação */}
                <div className="flex items-center">
                  <span
                    className="flex items-center gap-1.5 text-sm font-medium"
                    style={{ color: vencido(lead.data_proxima_acao) ? '#f87171' : '#a1a1aa' }}
                  >
                    {vencido(lead.data_proxima_acao) && <AlertIcon />}
                    {formatarData(lead.data_proxima_acao)}
                  </span>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}

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

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselect={() => setSelectedIds(new Set())}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
