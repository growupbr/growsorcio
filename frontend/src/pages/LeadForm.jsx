import { useState } from 'react';
import { api } from '../api/client';

const ETAPAS = [
  'Analisar Perfil', 'Seguiu Perfil', 'Abordagem Enviada', 'Respondeu',
  'Em Desenvolvimento', 'Follow-up Ativo', 'Lead Capturado',
  'Reunião Agendada', 'Reunião Realizada', 'Proposta Enviada',
  'Follow-up Proposta', 'Fechado', 'Perdido',
];

const TIPOS_ACAO = [
  'Enviar mensagem', 'Ligar', 'Reunião', 'Agendar reunião',
  'Follow-up proposta', 'Aguardar resposta', 'Enviar case',
];

function SectionTitle({ children }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: '#484F58' }}
    >
      {children}
    </p>
  );
}

export default function LeadForm({ lead, onSalvo, onCancelar }) {
  const [form, setForm] = useState({
    nome:              lead?.nome || '',
    instagram:         lead?.instagram || '',
    whatsapp:          lead?.whatsapp || '',
    administradora:    lead?.administradora || '',
    tempo_atuacao:     lead?.tempo_atuacao || '',
    volume_mensal:     lead?.volume_mensal || '',
    temperatura:       lead?.temperatura || 'frio',
    etapa_funil:       lead?.etapa_funil || 'Analisar Perfil',
    data_seguiu:       lead?.data_seguiu || '',
    data_proxima_acao: lead?.data_proxima_acao || '',
    tipo_proxima_acao: lead?.tipo_proxima_acao || '',
    observacoes:       lead?.observacoes || '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSalvando(true);
    setErro('');
    try {
      const salvo = lead?.id
        ? await api.atualizarLead(lead.id, form)
        : await api.criarLead(form);
      onSalvo(salvo);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Identificação */}
      <section>
        <SectionTitle>Identificação</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.nome} onChange={set('nome')} placeholder="Nome completo" />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input className="input" value={form.instagram} onChange={set('instagram')} placeholder="@usuario" />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input className="input" value={form.whatsapp} onChange={set('whatsapp')} placeholder="11999000000" />
          </div>
          <div>
            <label className="label">Administradora</label>
            <input className="input" value={form.administradora} onChange={set('administradora')} placeholder="Ex: Porto Seguro" />
          </div>
          <div>
            <label className="label">Tempo de atuação</label>
            <input className="input" value={form.tempo_atuacao} onChange={set('tempo_atuacao')} placeholder="Ex: 3 anos" />
          </div>
          <div>
            <label className="label">Volume mensal</label>
            <input className="input" value={form.volume_mensal} onChange={set('volume_mensal')} placeholder="Ex: 8 cartas/mês" />
          </div>
        </div>
      </section>

      {/* Funil */}
      <section
        className="rounded-xl p-4"
        style={{ background: '#161B22', border: '1px solid #1C2333' }}
      >
        <SectionTitle>Funil &amp; Qualificação</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Etapa do funil</label>
            <select className="input" value={form.etapa_funil} onChange={set('etapa_funil')}>
              {ETAPAS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Temperatura</label>
            <select className="input" value={form.temperatura} onChange={set('temperatura')}>
              <option value="frio">Frio</option>
              <option value="morno">Morno</option>
              <option value="quente">Quente</option>
            </select>
          </div>
          <div>
            <label className="label">Data que seguiu</label>
            <input type="date" className="input" value={form.data_seguiu} onChange={set('data_seguiu')} />
          </div>
        </div>
      </section>

      {/* Próxima ação */}
      <section>
        <SectionTitle>Próxima Ação</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={form.data_proxima_acao} onChange={set('data_proxima_acao')} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.tipo_proxima_acao} onChange={set('tipo_proxima_acao')}>
              <option value="">Selecione...</option>
              {TIPOS_ACAO.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Observações */}
      <section>
        <label className="label">Observações</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.observacoes}
          onChange={set('observacoes')}
          placeholder="Anotações sobre o lead..."
        />
      </section>

      {erro && (
        <p className="text-sm" style={{ color: '#f87171' }}>{erro}</p>
      )}

      <div
        className="flex justify-end gap-3 pt-2"
        style={{ borderTop: '1px solid #1C2333' }}
      >
        <button type="button" className="btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : lead?.id ? 'Salvar alterações' : 'Criar lead'}
        </button>
      </div>
    </form>
  );
}
