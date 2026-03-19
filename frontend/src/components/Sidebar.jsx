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

function SidebarLink({ to, label, icon: Icon, locked }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
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
          <span className="flex-1 truncate">{label}</span>
          {locked && (
            <Lock size={12} className="flex-shrink-0 text-zinc-700" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="flex flex-col w-60 h-screen bg-zinc-950 border-r border-white/5 flex-shrink-0">

      {/* Logo */}
      <div className="flex items-center justify-center px-4 h-20 border-b border-white/5 flex-shrink-0">
        <GrowsorcioLogo height={44} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t border-white/5 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
        <button
          onClick={logout}
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 w-full cursor-pointer"
        >
          <LogOut size={18} className="flex-shrink-0 text-zinc-500 group-hover:text-red-400 transition-colors duration-150" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
