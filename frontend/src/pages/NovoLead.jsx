import { useNavigate } from 'react-router-dom';
import LeadForm from './LeadForm';

export default function NovoLead() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/leads')}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-3 flex items-center gap-1"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-100">Novo Lead</h1>
      </div>
      <div className="card p-6">
        <LeadForm
          onSalvo={(lead) => navigate(`/leads?abrir=${lead.id}`)}
          onCancelar={() => navigate('/leads')}
        />
      </div>
    </div>
  );
}
