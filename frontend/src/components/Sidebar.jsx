import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban as KanbanIcon,
  Users,
  Calculator,
  FileText,
  MessageSquare,
  Bot,
  GraduationCap,
  Settings,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import GrowsorcioLogo from './GrowsorcioLogo';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { api } from '../api/client';

function getStoredSidebarState() {
  try {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  } catch {
    return false;
  }
}

function setStoredSidebarState(value) {
  try {
    localStorage.setItem('sidebar-collapsed', String(value));
  } catch {
    // Ignore storage errors (private mode / blocked storage)
  }
}

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/kanban',      label: 'Kanban',              icon: KanbanIcon },
  { to: '/leads',       label: 'Leads',               icon: Users },
  { to: '/calculadora', label: 'Calculadora',         icon: Calculator },
  { to: '/propostas',   label: 'Propostas',           icon: FileText },
  { to: '/conversas',   label: 'Conversas WhatsApp',  icon: MessageSquare,  feature: 'whatsapp' },
  { to: '/grow-ia',     label: 'GrowIA',              icon: Bot,            feature: 'growia' },
  { to: '/treinamento', label: 'Treinamento TEC 2.0', icon: GraduationCap },
];

const BOTTOM_ITEMS = [
  { to: '/config', label: 'Configurações', icon: Settings },
];

function SidebarLink({ to, label, icon: Icon, locked = false, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-orange-500/10 text-orange-500'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={`flex-shrink-0 transition-colors duration-150 ${
              isActive ? 'text-orange-500' : 'text-zinc-500 group-hover:text-zinc-200'
            }`}
          />
          {!collapsed && <span className="flex-1 truncate">{label}</span>}
          {!collapsed && locked && (
            <Lock size={12} className="flex-shrink-0 text-zinc-700" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  const { hasFeature, plan } = useSubscription();
  const [collapsed, setCollapsed] = useState(getStoredSidebarState);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    api.getProfile().then(setPerfil).catch(() => {});
  }, []);

  const iniciais = perfil
    ? (perfil.full_name || perfil.email || '?')
        .split(' ').map((w) => w[0]?.toUpperCase()).slice(0, 2).join('')
    : '...';

  const PLAN_BADGE = {
    start: { label: 'Start',  cls: 'bg-zinc-700/80 text-zinc-300' },
    pro:   { label: 'Pro',    cls: 'bg-orange-500/20 text-orange-400' },
    elite: { label: 'Elite',  cls: 'bg-violet-500/20 text-violet-400' },
  };
  const badge = PLAN_BADGE[plan] ?? { label: '...', cls: 'bg-zinc-800 text-zinc-600' };

  const toggle = () => {
    setCollapsed((prev) => {
      setStoredSidebarState(!prev);
      return !prev;
    });
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-zinc-950 border-r border-white/5 flex-shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo + toggle */}
      <div
        className={`flex items-center h-20 border-b border-white/5 flex-shrink-0 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {!collapsed && <GrowsorcioLogo height={36} />}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.to}
            {...item}
            locked={item.feature ? !hasFeature(item.feature) : false}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="p-2 border-t border-white/5 space-y-0.5">

        {/* Avatar card */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/10"
              style={{ background: perfil?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #FF4500 0%, #f59e0b 100%)' }}
            >
              {perfil?.avatar_url
                ? <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span>{iniciais}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate leading-none mb-1">
                {perfil?.full_name || perfil?.email || '...'}
              </p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-1">
            <div
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white ring-1 ring-white/10"
              style={{ background: perfil?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #FF4500 0%, #f59e0b 100%)' }}
              title={perfil?.full_name || perfil?.email}
            >
              {perfil?.avatar_url
                ? <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                : <span>{iniciais}</span>
              }
            </div>
          </div>
        )}

        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={collapsed} />
        ))}
        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          className={`group flex items-center ${
            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
          } py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 w-full cursor-pointer`}
        >
          <LogOut size={18} className="flex-shrink-0 text-zinc-500 group-hover:text-red-400 transition-colors duration-150" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
