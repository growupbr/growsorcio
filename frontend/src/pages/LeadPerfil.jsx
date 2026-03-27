import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { abrirWhatsApp } from '../utils/waWindow';
import TemperaturaBadge from '../components/TemperaturaBadge';
import EtapaTag from '../components/EtapaTag';
import Modal from '../components/Modal';
import LeadForm from './LeadForm';
import { ETAPAS } from '../constants/etapas';

const MOTIVOS_DESCARTE = [
  'Sem margem', 'Restrição CPF', 'Apenas curioso',
  'Parou de responder', 'Optou por financiamento', 'Sem recurso para lance',
  'Urgência incompatível', 'Outro',
];

const TIPOS_INTERACAO = ['DM', 'WhatsApp', 'Ligação', 'Reunião', 'E-mail', 'Anotação'];

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

function formatarMoeda(val) {
  if (val == null || val === '') return '—';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Formulário edição de interação ───────────────────────────────────────────

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
    <form onSubmit={handleSubmit} className="rounded-xl p-4 space-y-3"
      style={{ background: '#27272a', border: '1px solid rgba(255,69,0,0.32)' }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FF4500' }}>Editar interação</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <textarea className="input resize-none" rows={2} value={form.descricao} onChange={set('descricao')} />
      </div>
      <div>
        <label className="label">Próxima ação (opcional)</label>
        <input className="input" value={form.proxima_acao} onChange={set('proxima_acao')} />
      </div>
      {erro && <p className="text-sm" style={{ color: '#f87171' }}>{erro}</p>}
      <div className="flex items-center gap-2 justify-end">
        <button type="button" className="btn-ghost text-xs py-1" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn-primary text-xs py-1" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

// ─── Formulário nova interação ─────────────────────────────────────────────────

function NovaInteracaoForm({ leadId, onSalvo }) {
  const [form, setForm] = useState({ data: hoje(), tipo: 'WhatsApp', descricao: '', proxima_acao: '' });
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
      setForm({ data: hoje(), tipo: 'WhatsApp', descricao: '', proxima_acao: '' });
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl p-4 space-y-3"
      style={{ background: '#18181b', border: '1px solid #3f3f46' }}>
      <p className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>Registrar interação</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <textarea className="input resize-none" rows={2} value={form.descricao} onChange={set('descricao')}
          placeholder="Descreva a interação..." />
      </div>
      <div>
        <label className="label">Próxima ação (opcional)</label>
        <input className="input" value={form.proxima_acao} onChange={set('proxima_acao')}
          placeholder="Ex: Enviar simulação amanhã" />
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
    return <p className="text-sm py-4 text-center" style={{ color: '#71717a' }}>Nenhum item de cadência.</p>;
  }

  return (
    <div className="space-y-2">
      {[...pendentes, ...concluidos].map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg transition-colors"
          style={{
            background: item.concluido ? 'transparent' : '#18181b',
            border: `1px solid ${item.concluido ? '#27272a' : '#3f3f46'}`,
            opacity: item.concluido ? 0.5 : 1,
          }}>
          <button onClick={() => onToggle(item)}
            className="flex-shrink-0 w-4 h-4 mt-0.5 rounded transition-all cursor-pointer flex items-center justify-center"
            style={{
              background: item.concluido ? '#22c55e' : 'transparent',
              border: `1.5px solid ${item.concluido ? '#22c55e' : '#52525b'}`,
            }}
            onMouseEnter={e => { if (!item.concluido) e.currentTarget.style.borderColor = '#FF4500'; }}
            onMouseLeave={e => { if (!item.concluido) e.currentTarget.style.borderColor = '#52525b'; }}>
            {item.concluido && (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{
              color: item.concluido ? '#71717a' : '#f4f4f5',
              textDecoration: item.concluido ? 'line-through' : 'none',
            }}>
              {item.descricao}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs" style={{ color: '#71717a' }}>{formatarData(item.data_prevista)}</span>
              {item.etapa_relacionada && (
                <span className="text-xs" style={{ color: '#52525b' }}>· {item.etapa_relacionada}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Modal: Mover Etapa ───────────────────────────────────────────────────────

function MoverEtapaModal({ lead, onMover, onFechar }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(lead.etapa_funil);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const descartando = etapaSelecionada === 'Perdido';

  async function confirmar() {
    if (descartando && !motivo) return;
    setSalvando(true);
    await onMover(etapaSelecionada, descartando ? motivo : undefined);
    setSalvando(false);
  }

  return (
    <Modal title="Mover para etapa" onClose={onFechar}>
      <div className="space-y-1 mb-4">
        {ETAPAS.map((etapa) => (
          <button key={etapa} onClick={() => setEtapaSelecionada(etapa)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer"
            style={{
              background: etapaSelecionada === etapa ? 'rgba(255,69,0,0.10)' : 'transparent',
              color: etapaSelecionada === etapa ? '#FF4500' : '#a1a1aa',
              border: `1px solid ${etapaSelecionada === etapa ? 'rgba(255,69,0,0.25)' : 'transparent'}`,
            }}
            onMouseEnter={e => {
              if (etapaSelecionada !== etapa) {
                e.currentTarget.style.background = '#18181b';
                e.currentTarget.style.color = '#f4f4f5';
              }
            }}
            onMouseLeave={e => {
              if (etapaSelecionada !== etapa) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#a1a1aa';
              }
            }}>
            {etapaSelecionada === etapa && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span className={etapaSelecionada === etapa ? 'font-semibold' : ''}>{etapa}</span>
          </button>
        ))}
      </div>

      {descartando && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
          <select className="input" value={motivo} onChange={e => setMotivo(e.target.value)}
            style={{ borderColor: !motivo ? 'rgba(239,68,68,0.50)' : undefined }}>
            <option value="">Selecione o motivo...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={confirmar}
          disabled={salvando || (descartando && !motivo) || etapaSelecionada === lead.etapa_funil}
        >
          {salvando ? 'Movendo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Modal: Snooze / Congelar ─────────────────────────────────────────────────

function SnoozeModal({ lead, onSalvo, onFechar }) {
  const [data, setData] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().slice(0, 10);
  });
  const [salvando, setSalvando] = useState(false);

  async function confirmar() {
    setSalvando(true);
    await onSalvo(data);
    setSalvando(false);
  }

  async function remover() {
    setSalvando(true);
    await onSalvo(null);
    setSalvando(false);
  }

  return (
    <Modal title="Congelar lead — Régua 21 dias" onClose={onFechar}>
      <div className="space-y-4">
        <p className="text-sm" style={{ color: '#a1a1aa' }}>
          Congela o lead em <strong style={{ color: '#f4f4f5' }}>Follow-up Ativo</strong> e aciona
          a régua de reengajamento de 21 dias via webhook no n8n.
        </p>
        <div>
          <label className="label">Reativar em</label>
          <input type="date" className="input" value={data} onChange={e => setData(e.target.value)}
            min={hoje()} />
        </div>
        <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid #3f3f46' }}>
          {lead.snooze_ate ? (
            <button className="btn-ghost text-sm" onClick={remover} disabled={salvando}>Descongelar</button>
          ) : <div />}
          <div className="flex gap-3">
            <button className="btn-ghost" onClick={onFechar}>Cancelar</button>
            <button className="btn-primary" onClick={confirmar} disabled={salvando}>
              {salvando ? 'Salvando...' : '❄ Congelar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
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
  const [snoozeModal, setSnoozeModal] = useState(false);
  const [editandoInteracaoId, setEditandoInteracaoId] = useState(null);

  // onFechar é arrow inline no pai — instável a cada render.
  // Guardamos em ref para que `carregar` só recrie quando `leadId` muda.
  const onFecharRef = useRef(onFechar);
  useEffect(() => { onFecharRef.current = onFechar; }, [onFechar]);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.buscarLead(leadId);
      setLead(dados);
    } catch {
      onFecharRef.current();
    } finally {
      setCarregando(false);
    }
  }, [leadId]);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleMoverEtapa(etapa, motivo_descarte) {
    await api.moverEtapa(lead.id, etapa, motivo_descarte);
    setMudandoEtapa(false);
    carregar();
    onAtualizado?.();
  }

  async function handleSnooze(snooze_ate) {
    await api.snooze(lead.id, snooze_ate);
    setSnoozeModal(false);
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
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: '#27272a', borderTopColor: '#FF4500' }} />
      </div>
    );
  }

  if (!lead) return null;

  const snoozado = lead.snooze_ate && lead.snooze_ate > hoje();

  const abas = [
    { id: 'historico', label: 'Histórico', count: lead.interacoes?.length },
    { id: 'cadencia',  label: 'Cadência',  count: lead.cadencia?.filter((i) => !i.concluido).length },
    { id: 'dados',     label: 'Dados' },
  ];

  const infoItems = [
    { label: 'WhatsApp',         valor: lead.whatsapp || '—' },
    { label: 'E-mail',           valor: lead.email || '—' },
    { label: 'Tipo de bem',      valor: lead.tipo_de_bem || '—' },
    { label: 'Valor da carta',   valor: formatarMoeda(lead.valor_da_carta) },
    { label: 'Lance disponível', valor: formatarMoeda(lead.recurso_para_lance) },
    { label: 'Urgência',         valor: lead.urgencia || '—' },
  ];

  return (
    <>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <TemperaturaBadge temperatura={lead.temperatura} />
              <EtapaTag etapa={lead.etapa_funil} />
              {lead.restricao_cpf === 1 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#ef4444' }}>
                  ⚠ Restrição CPF
                </span>
              )}
              {snoozado && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.30)', color: '#38bdf8' }}>
                  ❄ Congelado até {formatarData(lead.snooze_ate)}
                </span>
              )}
              {lead.origem === 'anuncio' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}>
                  📢 Anúncio
                </span>
              )}
            </div>
            <h2 className="font-extrabold leading-tight" style={{ fontSize: 24, color: '#f4f4f5' }}>
              {lead.nome}
            </h2>
            {lead.motivo_descarte && (
              <p className="text-sm mt-1 font-medium" style={{ color: '#ef4444' }}>
                Descartado: {lead.motivo_descarte}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {lead.whatsapp && (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md cursor-pointer transition-all duration-200"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.28)', color: '#22c55e' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.20)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.50)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.28)'; }}
                onClick={() => {
                  const digits = lead.whatsapp.replace(/\D/g, '');
                  const phone = digits.startsWith('55') ? digits : `55${digits}`;
                  abrirWhatsApp(`https://web.whatsapp.com/send?phone=${phone}`);
                }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L.057 23.428a.75.75 0 00.916.916l5.579-1.471A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.5-5.241-1.377l-.375-.214-3.882 1.023 1.023-3.742-.228-.386A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Abrir WhatsApp
              </button>
            )}
            {lead.etapa_funil === 'Follow-up Ativo' && (
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md cursor-pointer transition-all duration-200"
                style={{
                  background: snoozado ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.10)',
                  border: `1px solid ${snoozado ? 'rgba(14,165,233,0.45)' : 'rgba(14,165,233,0.25)'}`,
                  color: '#38bdf8',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.20)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = snoozado ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.10)'; }}
                onClick={() => setSnoozeModal(true)}>
                ❄ {snoozado ? 'Congelado' : 'Congelar lead'}
              </button>
            )}
            <button className="btn-ghost min-h-[44px] min-w-[44px]" onClick={() => setMudandoEtapa(true)}>Mover etapa</button>
            <button className="btn-ghost min-h-[44px] min-w-[44px]" onClick={() => setEditando(true)}>Editar</button>
            <button className="btn-danger min-h-[44px] min-w-[44px]" onClick={() => setConfirmandoExclusao(true)}>Excluir</button>
          </div>
        </div>

        {/* Info rápida */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {infoItems.map(({ label, valor }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: '#27272a', border: '1px solid #3f3f46' }}>
              <p className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#a1a1aa' }}>{label}</p>
              <p className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>{valor}</p>
            </div>
          ))}
        </div>

        {/* Próxima ação */}
        {lead.data_proxima_acao && (
          <div className="mt-3 flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ background: 'rgba(255,69,0,0.07)', border: '1px solid rgba(255,69,0,0.20)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#FF4500" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-sm font-semibold" style={{ color: '#FF4500' }}>Próxima ação</span>
            <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>{lead.tipo_proxima_acao}</span>
            <span className="text-sm" style={{ color: '#a1a1aa' }}>
              em {formatarData(lead.data_proxima_acao)}
              {lead.hora_proxima_acao && (
                <span className="ml-1 font-semibold" style={{ color: '#FF4500' }}>às {lead.hora_proxima_acao}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* ─── Abas ──────────────────────────────────────────────────── */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: '1px solid #3f3f46' }}>
        {abas.map((aba) => (
          <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer border-b-2 -mb-px"
            style={{
              color: abaAtiva === aba.id ? '#f4f4f5' : '#a1a1aa',
              borderColor: abaAtiva === aba.id ? '#FF4500' : 'transparent',
            }}
            onMouseEnter={e => { if (abaAtiva !== aba.id) e.currentTarget.style.color = '#d4d4d8'; }}
            onMouseLeave={e => { if (abaAtiva !== aba.id) e.currentTarget.style.color = '#a1a1aa'; }}>
            {aba.label}
            {aba.count != null && aba.count > 0 && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                style={{
                  background: abaAtiva === aba.id ? 'rgba(255,69,0,0.15)' : '#18181b',
                  color: abaAtiva === aba.id ? '#FF4500' : '#71717a',
                }}>
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
            <p className="text-sm text-center py-6" style={{ color: '#71717a' }}>Nenhuma interação registrada.</p>
          )}
          <div className="space-y-3">
            {lead.interacoes?.map((interacao) => (
              <div key={interacao.id} className="rounded-xl p-4" style={{ background: '#18181b', border: '1px solid #3f3f46' }}>
                {editandoInteracaoId === interacao.id ? (
                  <EditarInteracaoForm
                    interacao={interacao}
                    onSalvo={() => { setEditandoInteracaoId(null); carregar(); }}
                    onCancelar={() => setEditandoInteracaoId(null)}
                  />
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,69,0,0.08)', color: '#FF4500' }}>
                      {TIPO_SVG[interacao.tipo] || TIPO_SVG['Anotação']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a1a1aa' }}>
                          {interacao.tipo}
                        </span>
                        <span className="text-xs" style={{ color: '#71717a' }}>{formatarData(interacao.data)}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          <button onClick={() => setEditandoInteracaoId(interacao.id)}
                            className="text-xs px-2 py-0.5 rounded cursor-pointer transition-colors"
                            style={{ color: '#71717a', background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = '#18181b'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'transparent'; }}>
                            Editar
                          </button>
                          <button onClick={() => handleExcluirInteracao(interacao.id)}
                            className="text-xs px-2 py-0.5 rounded cursor-pointer transition-colors"
                            style={{ color: '#71717a', background: 'transparent' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.background = 'transparent'; }}>
                            Excluir
                          </button>
                        </div>
                      </div>
                      <p className="text-sm" style={{ color: '#f4f4f5' }}>{interacao.descricao}</p>
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
          <div>
            <p className="text-[11px] uppercase tracking-widest font-medium mb-3" style={{ color: '#71717a' }}>
              Filtro Blessed 4.0
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Tipo de bem',      valor: lead.tipo_de_bem || '—',                   icon: '🏠' },
                { label: 'Valor da carta',   valor: formatarMoeda(lead.valor_da_carta),         icon: '💰' },
                { label: 'Lance disponível', valor: formatarMoeda(lead.recurso_para_lance),     icon: '🎯' },
                { label: 'Urgência',         valor: lead.urgencia || '—',                       icon: '⏱' },
                { label: 'Restrição CPF',    valor: lead.restricao_cpf ? '⚠ Sim' : '✅ Não',   icon: '📋' },
              ].map(({ label, valor, icon }) => (
                <div key={label} className="rounded-xl p-4"
                  style={{
                  background: '#18181b',
                    border: `1px solid ${label === 'Restrição CPF' && lead.restricao_cpf ? 'rgba(239,68,68,0.35)' : '#3f3f46'}`,
                  }}>
                  <p className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#a1a1aa' }}>
                    {label}
                  </p>
                  <p className="text-sm font-semibold"
                    style={{ color: label === 'Restrição CPF' && lead.restricao_cpf ? '#ef4444' : '#f4f4f5' }}>
                    {valor}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {lead.observacoes && (
            <div className="rounded-xl p-4" style={{ background: '#18181b', border: '1px solid #3f3f46' }}>
              <p className="text-[11px] uppercase tracking-widest font-semibold mb-2" style={{ color: '#a1a1aa' }}>Observações</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#CBD5E1' }}>{lead.observacoes}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Origem',        valor: lead.origem || '—' },
              { label: 'Criado em',     valor: formatarData(lead.criado_em) },
              { label: 'Atualizado em', valor: formatarData(lead.atualizado_em) },
            ].map(({ label, valor }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: '#27272a', border: '1px solid #3f3f46' }}>
                <p className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#a1a1aa' }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: '#CBD5E1' }}>{valor}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Modais ──────────────────────────────────────────────────── */}

      {mudandoEtapa && (
        <MoverEtapaModal lead={lead} onMover={handleMoverEtapa} onFechar={() => setMudandoEtapa(false)} />
      )}

      {snoozeModal && (
        <SnoozeModal lead={lead} onSalvo={handleSnooze} onFechar={() => setSnoozeModal(false)} />
      )}

      {editando && (
        <Modal title="Editar lead" onClose={() => setEditando(false)} wide>
          <LeadForm
            lead={lead}
            onSalvo={() => { setEditando(false); carregar(); onAtualizado?.(); }}
            onCancelar={() => setEditando(false)}
          />
        </Modal>
      )}

      {confirmandoExclusao && (
        <Modal title="Confirmar exclusão" onClose={() => setConfirmandoExclusao(false)}>
          <p className="text-sm mb-6" style={{ color: '#a1a1aa' }}>
            Tem certeza que deseja excluir{' '}
            <strong style={{ color: '#f4f4f5' }}>{lead.nome}</strong>?{' '}
            Esta ação não pode ser desfeita.
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
