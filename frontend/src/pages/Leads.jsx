import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import TemperaturaBadge from '../components/TemperaturaBadge';
import EtapaTag from '../components/EtapaTag';
import Modal from '../components/Modal';
import LeadPerfil from './LeadPerfil';

const ETAPAS = [
  'Lead Anúncio', 'Analisar Perfil', 'Seguiu Perfil', 'Abordagem Enviada', 'Respondeu',
  'Em Desenvolvimento', 'Follow-up Ativo', 'Lead Capturado',
  'Reunião Agendada', 'Reunião Realizada', 'Proposta Enviada',
  'Follow-up Proposta', 'Fechado', 'Perdido',
];

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

const FILTRO_KEY = 'crm_filtro_periodo';

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
    background: '#161B22',
    border:     '1px solid #1C2333',
    color:      '#8B949E',
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
          e.currentTarget.style.borderColor = '#30363D';
          e.currentTarget.style.color = '#F0F6FC';
        }
      }}
      onMouseLeave={e => {
        if (!ativo) {
          e.currentTarget.style.borderColor = '#1C2333';
          e.currentTarget.style.color = '#8B949E';
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

  function limparFiltros() {
    setFiltros({ busca: '', etapa: '', temperatura: '', periodo: '', origem: '', ordem: 'proxima_acao' });
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
          <h1 className="font-extrabold leading-tight" style={{ fontSize: 28, color: '#F0F6FC' }}>
            Leads
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#8B949E' }}>
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
        className="rounded-xl p-5 mb-6 space-y-4"
        style={{ background: '#0D1117', border: '1px solid #1C2333' }}
      >

        {/* Linha 1: Busca + Ordenar */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#484F58' }}
            >
              <SearchIcon />
            </span>
            <input
              className="input pl-9"
              placeholder="Buscar por nome ou @instagram..."
              value={filtros.busca}
              onChange={(e) => setFiltro('busca', e.target.value)}
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
        <div style={{ borderTop: '1px solid #1C2333' }} />

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
              style={{ background: '#0D1117', border: '1px solid #1C2333' }}
            />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div
          className="rounded-xl py-20 text-center"
          style={{ background: '#0D1117', border: '1px solid #1C2333' }}
        >
          {temFiltroAtivo ? (
            <>
              <p className="text-sm mb-2" style={{ color: '#8B949E' }}>
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
              <p className="text-sm mb-4" style={{ color: '#8B949E' }}>Nenhum lead cadastrado</p>
              <button className="btn-primary" onClick={() => navigate('/leads/novo')}>
                <PlusIcon /> Adicionar primeiro lead
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid #1C2333', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
        >
          {/* Header */}
          <div
            className="grid px-6 py-3"
            style={{
              background: '#0D1117',
              borderBottom: '1px solid #1C2333',
              gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr',
            }}
          >
            {['Lead', 'Administradora', 'Etapa', 'Temperatura', 'Próxima ação'].map((h) => (
              <span
                key={h}
                className="section-label"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Linhas */}
          <div>
            {leads.map((lead, idx) => (
              <div
                key={lead.id}
                onClick={() => setLeadAberto(lead.id)}
                className="grid px-6 py-4 cursor-pointer"
                style={{
                  gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1fr',
                  borderBottom: idx < leads.length - 1 ? '1px solid #1C2333' : 'none',
                  borderLeft: lead.origem === 'anuncio' ? '3px solid #7c3aed' : '3px solid transparent',
                  background: 'transparent',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Lead */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar nome={lead.nome} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: '#F0F6FC' }}>
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
                    {lead.instagram && (
                      <a
                        href={`https://ig.me/m/${lead.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 mt-0.5 cursor-pointer"
                        style={{ color: '#8B949E', fontSize: 12 }}
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
                  </div>
                </div>

                {/* Administradora */}
                <div className="flex items-center">
                  <span className="text-sm truncate" style={{ color: '#8B949E' }}>
                    {lead.administradora || '—'}
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
                    style={{ color: vencido(lead.data_proxima_acao) ? '#f87171' : '#8B949E' }}
                  >
                    {vencido(lead.data_proxima_acao) && <AlertIcon />}
                    {formatarData(lead.data_proxima_acao)}
                  </span>
                </div>
              </div>
            ))}
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
    </div>
  );
}
