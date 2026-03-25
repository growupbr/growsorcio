import { useState } from 'react';
import { api } from '../api/client';
import { ETAPAS } from '../constants/etapas';

const TIPOS_BEM = ['Imóvel', 'Veículo', 'Pesados', 'Serviços'];
const URGENCIAS = ['Imediata', '3 a 6 meses', 'Planejamento longo'];
const TIPOS_ACAO = [
  'Ligar', 'Enviar mensagem', 'Reunião', 'Agendar reunião',
  'Enviar simulação', 'Follow-up simulação', 'Solicitar documentos',
  'Aguardar resposta',
];
const MOTIVOS_DESCARTE = [
  'Sem margem', 'Restrição CPF', 'Apenas curioso',
  'Parou de responder', 'Optou por financiamento', 'Sem recurso para lance',
  'Urgência incompatível', 'Outro',
];

function SectionTitle({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#71717a' }}>
      {children}
    </p>
  );
}

function formatMoeda(val) {
  if (!val && val !== 0) return '';
  return String(val);
}

export default function LeadForm({ lead, onSalvo, onCancelar }) {
  const [form, setForm] = useState({
    nome:               lead?.nome || '',
    whatsapp:           lead?.whatsapp || '',
    email:              lead?.email || '',
    instagram:          lead?.instagram || '',
    tipo_de_bem:        lead?.tipo_de_bem || '',
    valor_da_carta:     formatMoeda(lead?.valor_da_carta),
    recurso_para_lance: formatMoeda(lead?.recurso_para_lance),
    restricao_cpf:      lead?.restricao_cpf ? true : false,
    urgencia:           lead?.urgencia || '',
    temperatura:        lead?.temperatura || 'frio',
    etapa_funil:        lead?.etapa_funil || 'Analisar Perfil',
    motivo_descarte:    lead?.motivo_descarte || '',
    data_proxima_acao:  lead?.data_proxima_acao || '',
    hora_proxima_acao:  lead?.hora_proxima_acao || '',
     tipo_proxima_acao:  lead?.tipo_proxima_acao || '',
    observacoes:        lead?.observacoes || '',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const setCheck = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.checked }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório'); return; }
    if (form.etapa_funil === 'Perdido' && !form.motivo_descarte) {
      setErro('Selecione o motivo do descarte');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const payload = {
        ...form,
        valor_da_carta:      form.valor_da_carta     ? Number(form.valor_da_carta.replace(/\./g, '').replace(',', '.'))     : null,
        recurso_para_lance:  form.recurso_para_lance ? Number(form.recurso_para_lance.replace(/\./g, '').replace(',', '.')) : null,
        restricao_cpf:       form.restricao_cpf ? 1 : 0,
        // Campos de data: string vazia → null para evitar erro "invalid input syntax for type date"
        data_proxima_acao:   form.data_proxima_acao   || null,
        hora_proxima_acao:   form.hora_proxima_acao   || null,
        tipo_proxima_acao:   form.tipo_proxima_acao   || null,
        motivo_descarte:     form.motivo_descarte     || null,
        urgencia:            form.urgencia            || null,
        instagram:           form.instagram           || null,
        email:               form.email               || null,
        whatsapp:            form.whatsapp            || null,
      };
      const salvo = lead?.id
        ? await api.atualizarLead(lead.id, payload)
        : await api.criarLead(payload);
      onSalvo(salvo);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  const descartando = form.etapa_funil === 'Perdido';

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
            <label className="label">WhatsApp</label>
            <input className="input" value={form.whatsapp} onChange={set('whatsapp')} placeholder="11999000000" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input className="input" value={form.instagram} onChange={set('instagram')} placeholder="@usuario" />
          </div>
        </div>
      </section>

      {/* Método Blessed 4.0 */}
      <section
        className="rounded-xl p-4"
        style={{ background: '#18181b', border: '1px solid rgba(255,69,0,0.20)' }}
      >
        <SectionTitle>Filtro Blessed 4.0</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo de bem</label>
            <select className="input" value={form.tipo_de_bem} onChange={set('tipo_de_bem')}>
              <option value="">Selecione...</option>
              {TIPOS_BEM.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Urgência</label>
            <select className="input" value={form.urgencia} onChange={set('urgencia')}>
              <option value="">Selecione...</option>
              {URGENCIAS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Valor da carta (R$)</label>
            <input
              className="input"
              value={form.valor_da_carta}
              onChange={set('valor_da_carta')}
              placeholder="Ex: 350000"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="label">Recurso para lance (R$)</label>
            <input
              className="input"
              value={form.recurso_para_lance}
              onChange={set('recurso_para_lance')}
              placeholder="Ex: 50000"
              inputMode="numeric"
            />
          </div>
        </div>
        {/* Restrição CPF — destaque visual */}
        <div
          className="mt-3 flex items-center gap-3 p-3 rounded-lg cursor-pointer"
          style={{
            background: form.restricao_cpf ? 'rgba(239,68,68,0.08)' : 'transparent',
            border: `1px solid ${form.restricao_cpf ? 'rgba(239,68,68,0.30)' : '#27272a'}`,
          }}
          onClick={() => setForm(f => ({ ...f, restricao_cpf: !f.restricao_cpf }))}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{
              background: form.restricao_cpf ? '#ef4444' : 'transparent',
              border: `2px solid ${form.restricao_cpf ? '#ef4444' : '#52525b'}`,
            }}
          >
            {form.restricao_cpf && (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: form.restricao_cpf ? '#ef4444' : '#a1a1aa' }}>
              Restrição no CPF
            </p>
            <p className="text-xs" style={{ color: '#71717a' }}>Marque se o lead tem CPF negativado ou restrito</p>
          </div>
        </div>
      </section>

      {/* Funil */}
      <section
        className="rounded-xl p-4"
        style={{ background: '#18181b', border: '1px solid #27272a' }}
      >
        <SectionTitle>Funil de Vendas</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
        {descartando && (
          <div className="mt-3">
            <label className="label" style={{ color: '#ef4444' }}>Motivo do descarte *</label>
            <select
              className="input"
              value={form.motivo_descarte}
              onChange={set('motivo_descarte')}
              style={{ borderColor: !form.motivo_descarte ? 'rgba(239,68,68,0.50)' : undefined }}
            >
              <option value="">Selecione o motivo...</option>
              {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        )}
      </section>

      {/* Próxima ação */}
      <section>
        <SectionTitle>Próxima Ação</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Data</label>
            <div className="flex gap-2">
              <input type="date" className="input flex-1" value={form.data_proxima_acao} onChange={set('data_proxima_acao')} />
              <input
                type="time"
                className="input"
                style={{ width: '110px', flexShrink: 0 }}
                value={form.hora_proxima_acao}
                onChange={set('hora_proxima_acao')}
              />
            </div>
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

      {erro && <p className="text-sm" style={{ color: '#f87171' }}>{erro}</p>}

      <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid #27272a' }}>
        <button type="button" className="btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : lead?.id ? 'Salvar alterações' : 'Criar lead'}
        </button>
      </div>
    </form>
  );
}
