import { useState } from 'react';
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

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
  { to: '/kanban',      label: 'Kanban',              icon: KanbanIcon },
  { to: '/leads',       label: 'Leads',               icon: Users },
  { to: '/calculadora', label: 'Calculadora',         icon: Calculator },
  { to: '/propostas',   label: 'Propostas',           icon: FileText,       locked: true },
  { to: '/conversas',   label: 'Conversas WhatsApp',  icon: MessageSquare,  locked: true },
  { to: '/grow-ia',     label: 'GrowIA',              icon: Bot,            locked: true },
  { to: '/treinamento', label: 'Treinamento TEC 2.0', icon: GraduationCap },
];

const BOTTOM_ITEMS = [
  { to: '/config', label: 'Configurações', icon: Settings },
];

function SidebarLink({ to, label, icon: Icon, locked, collapsed }) {
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
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
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
          <SidebarLink key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="p-2 border-t border-white/5 space-y-0.5">
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
