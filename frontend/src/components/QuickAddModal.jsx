import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../api/client';

const ETAPAS = [
  'Analisar Perfil', 'Seguiu Perfil', 'Abordagem Enviada', 'Respondeu',
  'Em Desenvolvimento', 'Follow-up Ativo', 'Lead Capturado',
  'Reunião Agendada', 'Reunião Realizada', 'Proposta Enviada',
  'Follow-up Proposta', 'Fechado', 'Perdido',
];

export default function QuickAddModal({ onClose, onCriado }) {
  const [form, setForm] = useState({
    nome: '',
    instagram: '',
    etapa_funil: 'Analisar Perfil',
    temperatura: 'frio',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const nome = form.nome.trim();
    if (!nome) { setErro('Nome é obrigatório'); return; }
    setSalvando(true);
    setErro('');
    try {
      const lead = await api.criarLead(form);
      onCriado?.(lead);
      onClose();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
  }

  return (
    <Modal title="Adicionar lead" onClose={onClose}>
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">

        <div>
          <label className="label">Nome *</label>
          <input
            ref={inputRef}
            className="input"
            value={form.nome}
            onChange={set('nome')}
            placeholder="Nome completo"
          />
        </div>

        <div>
          <label className="label">Instagram</label>
          <input
            className="input"
            value={form.instagram}
            onChange={set('instagram')}
            placeholder="@usuario"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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

        {erro && <p className="text-sm" style={{ color: '#f87171' }}>{erro}</p>}

        <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid #1C2333' }}>
          <span className="text-xs" style={{ color: '#484F58' }}>⌘ Enter para salvar</span>
          <div className="flex gap-3">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar lead'}
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
