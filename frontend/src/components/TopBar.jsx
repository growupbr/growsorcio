import GamificationBadge from './GamificationBadge';
import GrowsorcioLogo from './GrowsorcioLogo';

/**
 * TopBar — barra superior fixa do app.
 * Mobile: exibe logo à esquerda (Sidebar está hidden em mobile).
 * Desktop: logo fica na Sidebar; TopBar só mostra o badge de gamificação.
 */
export default function TopBar({ volume }) {
  return (
    <header
      className="flex items-center justify-between px-4 md:px-5 h-14 flex-shrink-0 border-b border-white/5"
      style={{ background: '#09090b' }}
    >
      {/* Logo — visível apenas no mobile, onde a Sidebar fica oculta */}
      <div className="flex md:hidden items-center">
        <GrowsorcioLogo height={36} />
      </div>

      {/* Espaço vazio no desktop (logo já está na Sidebar) */}
      <div className="hidden md:block" />

      {/* Badge de gamificação — sempre visível no canto superior direito */}
      <GamificationBadge volume={volume} />
    </header>
  );
}
