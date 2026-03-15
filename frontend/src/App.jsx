import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Leads from './pages/Leads';
import NovoLead from './pages/NovoLead';
import LandingPage from './pages/LandingPage';
import { useNotificacoes } from './hooks/useNotificacoes';

function AppLayout() {
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

export default function App() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}
