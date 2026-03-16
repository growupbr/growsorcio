import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Leads from './pages/Leads';
import NovoLead from './pages/NovoLead';
import LandingPage from './pages/LandingPage';
import { useNotificacoes } from './hooks/useNotificacoes';

// Em produção: app.growsorcio.com.br → app, growsorcio.com.br → landing
// Em dev: localhost → app (acesse /landing para ver a landing)
const isAppDomain =
  window.location.hostname.startsWith('app.') ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

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
  if (isAppDomain) {
    return (
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    );
  }

  // Domínio principal (growsorcio.com.br) → landing em URL oculta
  // Acesse: growsorcio.com.br/v1-preview para ver a landing
  // Qualquer outra rota redireciona para a URL oculta
  return (
    <Routes>
      <Route path="/v1-preview" element={<LandingPage />} />
      <Route path="/*" element={<Navigate to="/v1-preview" replace />} />
    </Routes>
  );
}
