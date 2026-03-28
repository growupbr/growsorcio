import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban as KanbanIcon,
  Users,
  FileText,
  Calculator,
  MessageCircle,
  Settings,
} from 'lucide-react';

/**
 * BottomNavBar — Navegação inferior para mobile (< md / 768px).
 * Visível apenas em telas pequenas. Em md+ a Sidebar lateral assume.
 * GrowIA é desktop-only — disponível apenas na Sidebar lateral.
 */

const BOTTOM_NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/kanban',      label: 'Kanban',     icon: KanbanIcon },
  { to: '/leads',       label: 'Leads',      icon: Users },
  { to: '/propostas',   label: 'Propostas',  icon: FileText },
  { to: '/calculadora', label: 'Calculadora',icon: Calculator },
  { to: '/conversas',   label: 'WhatsApp',   icon: MessageCircle },
  { to: '/config',      label: 'Config',     icon: Settings },
];

export default function BottomNavBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex md:hidden bg-zinc-950 border-t border-white/5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação principal"
    >
      {BOTTOM_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 gap-1 py-2.5 min-h-[56px] transition-colors duration-150 ${
              isActive ? 'text-orange-500' : 'text-zinc-500'
            }`
          }
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="flex-shrink-0"
              />
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-orange-500' : 'text-zinc-600'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
