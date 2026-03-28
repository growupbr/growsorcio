import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import BottomNavBar from './components/BottomNavBar';
import { useNotificacoes } from './hooks/useNotificacoes';
import { useAuth } from './hooks/useAuth';
import { getActiveBreakpoint } from './constants/breakpoints';
import { AtividadesProvider } from './hooks/useAtividades';
import CookieBanner from './components/CookieBanner';
import CookieModal from './components/CookieModal';
import { useCookieConsent } from './hooks/useCookieConsent';

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

const LandingPageTEC = lazy(() => import('./pages/LandingPageTEC'));
const Login        = lazy(() => import('./pages/Login'));
const EsqueciSenha = lazy(() => import('./pages/EsqueciSenha'));
const Checkout     = lazy(() => import('./pages/Checkout'));
const Privacidade      = lazy(() => import('./pages/Privacidade'));
const PoliticaCookies  = lazy(() => import('./pages/PoliticaCookies'));

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

/** Badge de breakpoint ativo — visível apenas em desenvolvimento */
function BreakpointBadge() {
  const [bp, setBp] = useState(() => getActiveBreakpoint());
  useEffect(() => {
    const handler = () => setBp(getActiveBreakpoint());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return (
    <div className="fixed top-2 right-2 z-[9999] px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500 text-white select-none pointer-events-none">
      {bp}
    </div>
  );
}

function AppLayout() {
  useNotificacoes();
  return (
    <AtividadesProvider>
      <div className="flex h-screen bg-zinc-950 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          {/* pb-16 reserva espaço para a BottomNavBar em mobile; md:pb-0 remove em desktop */}
          <main className="flex-1 overflow-y-auto bg-zinc-950 pb-16 md:pb-0">
            <Outlet />
          </main>
        </div>
        <BottomNavBar />
        {import.meta.env.DEV && <BreakpointBadge />}
      </div>
    </AtividadesProvider>
  );
}

function CookieController() {
  const { hasConsented, showModal, acceptAll, acceptEssential, savePreferences, openModal, closeModal, consent } = useCookieConsent();
  return (
    <>
      {!hasConsented && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onEssentialOnly={acceptEssential}
          onConfigure={openModal}
        />
      )}
      {showModal && (
        <CookieModal
          initialConsent={consent}
          onSave={savePreferences}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default function App() {
  if (isAppDomain) {
    return (
      <Suspense fallback={<PageLoader />}>
        <CookieController />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/tec" element={<LandingPageTEC />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/cookies" element={<PoliticaCookies />} />
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
      <CookieController />
      <Routes>
        <Route path="/v1-preview" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/cookies" element={<PoliticaCookies />} />
        <Route path="/*" element={<Navigate to="/v1-preview" replace />} />
      </Routes>
    </Suspense>
  );
}
