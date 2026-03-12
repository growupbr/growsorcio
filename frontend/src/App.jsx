import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Leads from './pages/Leads';
import NovoLead from './pages/NovoLead';
import { useNotificacoes } from './hooks/useNotificacoes';

export default function App() {
  useNotificacoes();

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="pt-14">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/novo" element={<NovoLead />} />
        </Routes>
      </main>
    </div>
  );
}
