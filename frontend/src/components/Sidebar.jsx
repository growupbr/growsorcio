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
} from 'lucide-react';
import GrowsorcioLogo from './GrowsorcioLogo';

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
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-muted hover:bg-dark-800 hover:text-text'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={`flex-shrink-0 transition-colors duration-150 ${
              isActive ? 'text-accent' : 'text-dark-400 group-hover:text-text'
            }`}
          />
          <span className="flex-1 truncate">{label}</span>
          {locked && (
            <Lock size={12} className="flex-shrink-0 text-dark-600 opacity-50" />
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-60 h-screen bg-dark-900 border-r border-dark-800 flex-shrink-0">

      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-dark-800">
        <GrowsorcioLogo height={32} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t border-dark-800 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
