import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Leads from './pages/Leads';
import NovoLead from './pages/NovoLead';
import LandingPage from './pages/LandingPage';
import Calculadora from './pages/Calculadora';
import Propostas from './pages/Propostas';
import Conversas from './pages/Conversas';
import GrowIA from './pages/GrowIA';
import Treinamento from './pages/Treinamento';
import Config from './pages/Config';
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
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  if (isAppDomain) {
    return (
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/novo" element={<NovoLead />} />
          <Route path="calculadora" element={<Calculadora />} />
          <Route path="propostas" element={<Propostas />} />
          <Route path="conversas" element={<Conversas />} />
          <Route path="grow-ia" element={<GrowIA />} />
          <Route path="treinamento" element={<Treinamento />} />
          <Route path="config" element={<Config />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
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
