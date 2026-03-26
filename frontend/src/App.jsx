import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import { useNotificacoes } from './hooks/useNotificacoes';
import { useAuth } from './hooks/useAuth';

// Lazy-loaded para reduzir bundle inicial (páginas pesadas)
const LandingPage  = lazy(() => import('./pages/LandingPage'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Kanban      = lazy(() => import('./pages/Kanban'));
const Leads       = lazy(() => import('./pages/Leads'));
const NovoLead    = lazy(() => import('./pages/NovoLead'));
const Calculadora  = lazy(() => import('./pages/Calculadora'));
const Propostas    = lazy(() => import('./pages/Propostas'));
const Conversas    = lazy(() => import('./pages/Conversas'));
const GrowIA       = lazy(() => import('./pages/GrowIA'));
const Treinamento      = lazy(() => import('./pages/Treinamento'));
const TreinamentoAula  = lazy(() => import('./pages/TreinamentoAula'));
const Config           = lazy(() => import('./pages/Config'));

const Login        = lazy(() => import('./pages/Login'));
const EsqueciSenha = lazy(() => import('./pages/EsqueciSenha'));
const Checkout     = lazy(() => import('./pages/Checkout'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );
}

// Em produção: app.growsorcio.com.br → app, growsorcio.com.br → landing
// Em dev: localhost → app (acesse /landing para ver a landing)
const isAppDomain =
  window.location.hostname.startsWith('app.') ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
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
            <Route path="treinamento/aula" element={<TreinamentoAula />} />
            <Route path="config" element={<Config />} />
            <Route path="relatorios" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  // Domínio principal (growsorcio.com.br) → landing em URL oculta
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/v1-preview" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/*" element={<Navigate to="/v1-preview" replace />} />
      </Routes>
    </Suspense>
  );
}
