import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { abrirWhatsApp } from '../utils/waWindow';
import TemperaturaBadge from '../components/TemperaturaBadge';
import EtapaTag from '../components/EtapaTag';
import Modal from '../components/Modal';
import LeadForm from './LeadForm';

const ETAPAS = [
  'Analisar Perfil', 'Seguiu Perfil', 'Abordagem Enviada', 'Respondeu',
  'Em Desenvolvimento', 'Follow-up Ativo', 'Lead Capturado',
  'Reunião Agendada', 'Reunião Realizada', 'Proposta Enviada',
  'Follow-up Proposta', 'Fechado', 'Perdido',
];

const TIPOS_INTERACAO = ['DM', 'WhatsApp', 'Ligação', 'Reunião', 'E-mail', 'Anotação'];

// SVG icons por tipo de interação
const TIPO_SVG = {
  DM: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  'Ligação': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.06 2.86 2 2 0 012.03 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  'Reunião': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  'E-mail': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  'Anotação': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
};

function formatarData(str) {
  if (!str) return '—';
  const [a, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Formulário de edição de interação ───────────────────────────────────────

function EditarInteracaoForm({ interacao, onSalvo, onCancelar }) {
  const [form, setForm] = useState({
    data: interacao.data?.slice(0, 10) || hoje(),
    tipo: interacao.tipo,
    descricao: interacao.descricao,
    proxima_acao: interacao.proxima_acao || '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.descricao.trim()) { setErro('Descreva a interação'); return; }
    setSalvando(true);
    setErro('');
    try {
      await api.editarInteracao(interacao.id, form);
      onSalvo();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#161B22', border: '1px solid rgba(255,69,0,0.30)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FF4500' }}>Editar interação</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Data</label>
          <input type="date" className="input" value={form.data} onChange={set('data')} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.tipo} onChange={set('tipo')}>
            {TIPOS_INTERACAO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">O que foi feito / dito</label>
        <textarea
          className="input resize-none"
          rows={2}
          value={form.descricao}
          onChange={set('descricao')}
        />
      </div>
      <div>
        <label className="label">Próxima ação (opcional)</label>
        <input
          className="input"
          value={form.proxima_acao}
          onChange={set('proxima_acao')}
        />
      </div>
      {erro && <p className="text-sm" style={{ color: '#f87171' }}>{erro}</p>}
      <div className="flex items-center gap-2 justify-end">
        <button type="button" className="btn-ghost text-xs py-1" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary text-xs py-1" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

// ─── Formulário de nova interação ─────────────────────────────────────────────

function NovaInteracaoForm({ leadId, onSalvo }) {
  const [form, setForm] = useState({ data: hoje(), tipo: 'DM', descricao: '', proxima_acao: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.descricao.trim()) { setErro('Descreva a interação'); return; }
    setSalvando(true);
    setErro('');
    try {
      await api.criarInteracao({ ...form, lead_id: leadId });
      onSalvo();
      setForm({ data: hoje(), tipo: 'DM', descricao: '', proxima_acao: '' });
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#0D1117', border: '1px solid #1C2333' }}
    >
      <p className="text-sm font-semibold" style={{ color: '#F0F6FC' }}>Registrar interação</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Data</label>
          <input type="date" className="input" value={form.data} onChange={set('data')} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={form.tipo} onChange={set('tipo')}>
            {TIPOS_INTERACAO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">O que foi feito / dito</label>
        <textarea
          className="input resize-none"
          rows={2}
          value={form.descricao}
          onChange={set('descricao')}
          placeholder="Descreva a interação..."
        />
      </div>
      <div>
        <label className="label">Próxima ação (opcional)</label>
        <input
          className="input"
          value={form.proxima_acao}
          onChange={set('proxima_acao')}
          placeholder="Ex: Enviar proposta amanhã"
        />
      </div>
      {erro && <p className="text-sm" style={{ color: '#f87171' }}>{erro}</p>}
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}

// ─── Cadência Checklist ───────────────────────────────────────────────────────

function CadenciaChecklist({ cadencia, onToggle }) {
  const pendentes  = cadencia.filter((i) => !i.concluido);
  const concluidos = cadencia.filter((i) => i.concluido);

  if (pendentes.length === 0 && concluidos.length === 0) {
    return <p className="text-sm py-4 text-center" style={{ color: '#484F58' }}>Nenhum item de cadência.</p>;
  }

  return (
    <div className="space-y-2">
      {[...pendentes, ...concluidos].map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-lg transition-colors"
          style={{
            background: item.concluido ? 'transparent' : '#0D1117',
            border: `1px solid ${item.concluido ? '#161B22' : '#1C2333'}`,
            opacity: item.concluido ? 0.5 : 1,
          }}
        >
          <button
            onClick={() => onToggle(item)}
            className="flex-shrink-0 w-4 h-4 mt-0.5 rounded transition-all cursor-pointer flex items-center justify-center"
            style={{
              background: item.concluido ? '#22c55e' : 'transparent',
              border: `1.5px solid ${item.concluido ? '#22c55e' : '#30363D'}`,
            }}
            onMouseEnter={e => {
              if (!item.concluido) e.currentTarget.style.borderColor = '#FF4500';
            }}
            onMouseLeave={e => {
              if (!item.concluido) e.currentTarget.style.borderColor = '#30363D';
            }}
          >
            {item.concluido && (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm"
              style={{
                color: item.concluido ? '#484F58' : '#F0F6FC',
                textDecoration: item.concluido ? 'line-through' : 'none',
              }}
            >
              {item.descricao}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: '#484F58' }}>{formatarData(item.data_prevista)}</span>
              {item.etapa_relacionada && (
                <span className="text-xs" style={{ color: '#30363D' }}>· {item.etapa_relacionada}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Lead Perfil Principal ────────────────────────────────────────────────────

export default function LeadPerfil({ leadId, onFechar, onAtualizado }) {
  const [lead, setLead] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('historico');
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [mudandoEtapa, setMudandoEtapa] = useState(false);
  const [editandoInteracaoId, setEditandoInteracaoId] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.buscarLead(leadId);
      setLead(dados);
    } catch {
      onFechar();
    } finally {
      setCarregando(false);
    }
  }, [leadId, onFechar]);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleMoverEtapa(etapa) {
    await api.moverEtapa(lead.id, etapa);
    setMudandoEtapa(false);
    carregar();
    onAtualizado?.();
  }

  async function handleExcluir() {
    await api.excluirLead(lead.id);
    onFechar();
    onAtualizado?.();
  }

  async function handleToggleCadencia(item) {
    if (item.concluido) await api.reabrirCadencia(item.id);
    else await api.concluirCadencia(item.id);
    carregar();
  }

  async function handleExcluirInteracao(id) {
    await api.excluirInteracao(id);
    carregar();
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-48">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: '#1C2333', borderTopColor: '#FF4500' }}
        />
      </div>
    );
  }

  if (!lead) return null;

  const abas = [
    { id: 'historico', label: 'Histórico', count: lead.interacoes?.length },
    { id: 'cadencia',  label: 'Cadência',  count: lead.cadencia?.filter((i) => !i.concluido).length },
    { id: 'dados',     label: 'Dados' },
  ];

  // Info rápida
  const infoItems = [
    { label: 'WhatsApp',       valor: lead.whatsapp || '—' },
    { label: 'Administradora', valor: lead.administradora || '—' },
    { label: 'Atuação',        valor: lead.tempo_atuacao || '—' },
    { label: 'Volume mensal',  valor: lead.volume_mensal || '—' },
  ];

  return (
    <>
      {/* ─── Header do lead ─────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Nome + ações */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TemperaturaBadge temperatura={lead.temperatura} />
              <EtapaTag etapa={lead.etapa_funil} />
              {lead.origem === 'anuncio' && (
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    fontSize: 11,
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
            <h2 className="font-extrabold leading-tight" style={{ fontSize: 24, color: '#F0F6FC' }}>
              {lead.nome}
            </h2>
            {lead.instagram && (
              <p className="text-sm mt-1 font-medium" style={{ color: '#FF4500' }}>
                {lead.instagram}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {lead.whatsapp && (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md cursor-pointer transition-all duration-200"
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.28)',
                  color: '#22c55e',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(34,197,94,0.20)';
                  e.currentTarget.style.borderColor = 'rgba(34,197,94,0.50)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(34,197,94,0.12)';
                  e.currentTarget.style.borderColor = 'rgba(34,197,94,0.28)';
                }}
                onClick={() => {
                  const digits = lead.whatsapp.replace(/\D/g, '');
                  const phone = digits.startsWith('55') ? digits : `55${digits}`;
                  abrirWhatsApp(`https://web.whatsapp.com/send?phone=${phone}`);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L.057 23.428a.75.75 0 00.916.916l5.579-1.471A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.5-5.241-1.377l-.375-.214-3.882 1.023 1.023-3.742-.228-.386A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Abrir WhatsApp
              </button>
            )}
            {lead.instagram && (
              <a
                href={`https://ig.me/m/${lead.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                Abrir DM
              </a>
            )}
            <button className="btn-ghost" onClick={() => setMudandoEtapa(true)}>
              Mover etapa
            </button>
            <button className="btn-ghost" onClick={() => setEditando(true)}>
              Editar
            </button>
            <button className="btn-danger" onClick={() => setConfirmandoExclusao(true)}>
              Excluir
            </button>
          </div>
        </div>

        {/* Info rápida em grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {infoItems.map(({ label, valor }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: '#161B22', border: '1px solid #1C2333' }}>
              <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: '#484F58' }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: '#F0F6FC' }}>{valor}</p>
            </div>
          ))}
        </div>

        {/* Próxima ação */}
        {lead.data_proxima_acao && (
          <div
            className="mt-3 flex items-center gap-3 rounded-lg px-4 py-3"
            style={{
              background: 'rgba(255,69,0,0.07)',
              border: '1px solid rgba(255,69,0,0.20)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: '#FF4500' }}>Próxima ação</span>
            <span className="text-sm font-medium" style={{ color: '#F0F6FC' }}>{lead.tipo_proxima_acao}</span>
            <span className="text-sm" style={{ color: '#8B949E' }}>em {formatarData(lead.data_proxima_acao)}</span>
          </div>
        )}
      </div>

      {/* ─── Abas ──────────────────────────────────────────────────── */}
      <div
        className="flex gap-0 mb-5"
        style={{ borderBottom: '1px solid #1C2333' }}
      >
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer border-b-2 -mb-px"
            style={{
              color: abaAtiva === aba.id ? '#F0F6FC' : '#8B949E',
              borderColor: abaAtiva === aba.id ? '#FF4500' : 'transparent',
            }}
            onMouseEnter={e => {
              if (abaAtiva !== aba.id) e.currentTarget.style.color = '#C9D1D9';
            }}
            onMouseLeave={e => {
              if (abaAtiva !== aba.id) e.currentTarget.style.color = '#8B949E';
            }}
          >
            {aba.label}
            {aba.count != null && aba.count > 0 && (
              <span
                className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                style={{
                  background: abaAtiva === aba.id ? 'rgba(255,69,0,0.15)' : '#161B22',
                  color: abaAtiva === aba.id ? '#FF4500' : '#484F58',
                }}
              >
                {aba.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Conteúdo das abas ─────────────────────────────────────── */}

      {abaAtiva === 'historico' && (
        <div className="space-y-4">
          <NovaInteracaoForm leadId={lead.id} onSalvo={carregar} />
          {lead.interacoes?.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: '#484F58' }}>
              Nenhuma interação registrada.
            </p>
          )}
          <div className="space-y-3">
            {lead.interacoes?.map((interacao) => (
              <div
                key={interacao.id}
                className="rounded-xl p-4"
                style={{ background: '#0D1117', border: '1px solid #1C2333' }}
              >
                {editandoInteracaoId === interacao.id ? (
                  <EditarInteracaoForm
                    interacao={interacao}
                    onSalvo={() => { setEditandoInteracaoId(null); carregar(); }}
                    onCancelar={() => setEditandoInteracaoId(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,69,0,0.08)', color: '#FF4500' }}
                    >
                      {TIPO_SVG[interacao.tipo] || TIPO_SVG['Anotação']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B949E' }}>
                          {interacao.tipo}
                        </span>
                        <span className="text-xs" style={{ color: '#484F58' }}>
                          {formatarData(interacao.data)}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => setEditandoInteracaoId(interacao.id)}
                            className="text-xs px-2 py-0.5 rounded cursor-pointer transition-colors"
                            style={{ color: '#484F58', background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#8B949E'; e.currentTarget.style.background = '#161B22'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#484F58'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleExcluirInteracao(interacao.id)}
                            className="text-xs px-2 py-0.5 rounded cursor-pointer transition-colors"
                            style={{ color: '#484F58', background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#484F58'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                      <p className="text-sm" style={{ color: '#F0F6FC' }}>{interacao.descricao}</p>
                      {interacao.proxima_acao && (
                        <p className="text-xs mt-2 font-medium" style={{ color: '#FF4500' }}>
                          → {interacao.proxima_acao}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {abaAtiva === 'cadencia' && (
        <CadenciaChecklist cadencia={lead.cadencia || []} onToggle={handleToggleCadencia} />
      )}

      {abaAtiva === 'dados' && (
        <div className="space-y-4">
          {lead.origem === 'anuncio' && lead.observacoes && (() => {
            const campos = {};
            lead.observacoes.split(' | ').forEach(parte => {
              const idx = parte.indexOf(': ');
              if (idx > -1) {
                const chave = parte.slice(0, idx).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const valor = parte.slice(idx + 2).trim().replace(/_/g, ' ');
                campos[chave] = valor;
              }
            });
            const fmt = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '—';
            const cards = [
              { label: 'Como atua', valor: campos['Como atua'], icon: '👤' },
              { label: 'Investe em tráfego', valor: campos['Investe em trafego'], icon: '💰' },
              { label: 'Maior problema', valor: campos['Maior problema'], icon: '🎯' },
              { label: 'Investe R$1.500/mês', valor: campos['Investe R$1.500'], icon: '✅' },
            ].filter(c => c.valor);
            const ads = [
              { label: 'Campanha', valor: campos['Campanha'] },
              { label: 'Anúncio', valor: campos['Anuncio'] },
            ].filter(c => c.valor);
            return (
              <>
                {cards.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: '#484F58' }}>Informações do formulário</p>
                    <div className="grid grid-cols-2 gap-3">
                      {cards.map(({ label, valor, icon }) => (
                        <div key={label} className="rounded-xl p-4" style={{ background: '#0D1117', border: '1px solid rgba(124,58,237,0.25)' }}>
                          <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: '#a78bfa' }}>{icon} {label}</p>
                          <p className="text-sm font-semibold" style={{ color: '#F0F6FC' }}>{fmt(valor)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {ads.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: '#484F58' }}>Origem do anúncio</p>
                    <div className="grid grid-cols-2 gap-3">
                      {ads.map(({ label, valor }) => (
                        <div key={label} className="rounded-xl p-4" style={{ background: '#0D1117', border: '1px solid #1C2333' }}>
                          <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: '#484F58' }}>{label}</p>
                          <p className="text-sm font-medium" style={{ color: '#C9D1D9' }}>{valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          {lead.observacoes && lead.origem !== 'anuncio' && (
            <div className="rounded-xl p-4" style={{ background: '#0D1117', border: '1px solid #1C2333' }}>
              <p className="text-[11px] uppercase tracking-widest font-medium mb-2" style={{ color: '#484F58' }}>Observações</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#C9D1D9' }}>{lead.observacoes}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Seguiu em', valor: formatarData(lead.data_seguiu) },
              { label: 'Criado em', valor: formatarData(lead.criado_em) },
              { label: 'Atualizado em', valor: formatarData(lead.atualizado_em) },
            ].map(({ label, valor }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: '#161B22', border: '1px solid #1C2333' }}>
                <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: '#484F58' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: '#C9D1D9' }}>{valor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Modal: mover etapa ─────────────────────────────────────── */}
      {mudandoEtapa && (
        <Modal title="Mover para etapa" onClose={() => setMudandoEtapa(false)}>
          <div className="space-y-1">
            {ETAPAS.map((etapa) => (
              <button
                key={etapa}
                onClick={() => handleMoverEtapa(etapa)}
                className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
                style={{
                  background: etapa === lead.etapa_funil ? 'rgba(255,69,0,0.10)' : 'transparent',
                  color: etapa === lead.etapa_funil ? '#FF4500' : '#8B949E',
                  border: `1px solid ${etapa === lead.etapa_funil ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
                }}
                onMouseEnter={e => {
                  if (etapa !== lead.etapa_funil) {
                    e.currentTarget.style.background = '#161B22';
                    e.currentTarget.style.color = '#F0F6FC';
                  }
                }}
                onMouseLeave={e => {
                  if (etapa !== lead.etapa_funil) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#8B949E';
                  }
                }}
              >
                {etapa === lead.etapa_funil && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                <span className={etapa === lead.etapa_funil ? 'font-semibold' : ''}>{etapa}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ─── Modal: editar lead ─────────────────────────────────────── */}
      {editando && (
        <Modal title="Editar lead" onClose={() => setEditando(false)} wide>
          <LeadForm
            lead={lead}
            onSalvo={() => { setEditando(false); carregar(); onAtualizado?.(); }}
            onCancelar={() => setEditando(false)}
          />
        </Modal>
      )}

      {/* ─── Modal: confirmar exclusão ──────────────────────────────── */}
      {confirmandoExclusao && (
        <Modal title="Confirmar exclusão" onClose={() => setConfirmandoExclusao(false)}>
          <p className="text-sm mb-6" style={{ color: '#8B949E' }}>
            Tem certeza que deseja excluir{' '}
            <strong style={{ color: '#F0F6FC' }}>{lead.nome}</strong>?
            {' '}Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn-ghost" onClick={() => setConfirmandoExclusao(false)}>Cancelar</button>
            <button className="btn-danger" onClick={handleExcluir}>Excluir lead</button>
          </div>
        </Modal>
      )}
    </>
  );
}

