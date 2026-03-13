import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import QuickAddModal from './QuickAddModal';
import { abrirWhatsApp, isWaOpen } from '../utils/waWindow';
import logoGrowUp from '../assets/logo-growup.png';

const NavIcons = {
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Kanban: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <rect x="3" y="3" width="5" height="18" rx="1.5"/>
      <rect x="10" y="3" width="5" height="13" rx="1.5"/>
      <rect x="17" y="3" width="5" height="9" rx="1.5"/>
    </svg>
  ),
  Leads: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

const links = [
  { to: '/',       label: 'Dashboard', Icon: NavIcons.Dashboard },
  { to: '/kanban', label: 'Kanban',    Icon: NavIcons.Kanban },
  { to: '/leads',  label: 'Leads',     Icon: NavIcons.Leads },
];

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.849L.057 23.428a.75.75 0 00.916.916l5.579-1.471A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.5-5.241-1.377l-.375-.214-3.882 1.023 1.023-3.742-.228-.386A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [waAberto, setWaAberto] = useState(false);

  // Polling para detectar quando a janela WA é fechada pelo usuário.
  // Pausa quando a aba está em background para não queimar CPU/bateria em campo.
  const waIntervalRef = useRef(null);

  const syncWaEstado = useCallback(() => {
    setWaAberto(isWaOpen());
  }, []);

  useEffect(() => {
    function iniciarPolling() {
      if (waIntervalRef.current) return;
      waIntervalRef.current = setInterval(syncWaEstado, 800);
    }
    function pararPolling() {
      clearInterval(waIntervalRef.current);
      waIntervalRef.current = null;
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') iniciarPolling();
      else pararPolling();
    }

    iniciarPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      pararPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncWaEstado]);

  function handleWhatsApp() {
    abrirWhatsApp();
    setWaAberto(true);
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-stretch"
        style={{ background: '#080B14', borderBottom: '1px solid #1C2333' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-stretch justify-between w-full">

          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center cursor-pointer flex-shrink-0 mr-8"
          >
            <img src={logoGrowUp} alt="Grow Up" style={{ height: 44, width: 'auto', mixBlendMode: 'screen' }} />
          </button>

          {/* Nav links — underline indicator estilo Vercel */}
          <div className="flex items-stretch">
            {links.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 text-sm font-medium
                   transition-colors duration-150 cursor-pointer relative border-b-2 -mb-px ${
                     isActive
                       ? 'border-[#FF4500] text-[#F0F6FC]'
                       : 'border-transparent text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#30363D]'
                   }`
                }
              >
                <Icon />
                <span className="hidden sm:block">{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 ml-8">
            {/* Botão WhatsApp */}
            <button
              onClick={handleWhatsApp}
              title="Abrir WhatsApp Web"
              className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold cursor-pointer transition-all duration-200"
              style={{
                background: waAberto ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.10)',
                border: `1px solid ${waAberto ? 'rgba(34,197,94,0.45)' : 'rgba(34,197,94,0.22)'}`,
                color: '#22c55e',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(34,197,94,0.20)';
                e.currentTarget.style.borderColor = 'rgba(34,197,94,0.50)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = waAberto ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.10)';
                e.currentTarget.style.borderColor = waAberto ? 'rgba(34,197,94,0.45)' : 'rgba(34,197,94,0.22)';
              }}
            >
              {/* Indicador pulsando quando aberto */}
              {waAberto && (
                <span className="absolute -top-1 -right-1">
                  <span className="relative flex w-2.5 h-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22c55e' }} />
                    <span className="relative inline-flex rounded-full w-2.5 h-2.5" style={{ background: '#22c55e' }} />
                  </span>
                </span>
              )}
              <WhatsAppIcon />
              <span className="hidden sm:block">WhatsApp</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <NavIcons.Plus />
              <span className="hidden sm:block">Novo Lead</span>
            </button>
          </div>

        </div>
      </nav>

      {showModal && (
        <QuickAddModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
