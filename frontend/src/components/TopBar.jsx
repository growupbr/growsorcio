import GamificationBadge from './GamificationBadge';

/**
 * TopBar — barra superior fixa do app (badge de gamificação sempre visível no canto direito).
 * Props:
 *   volume {number} — faturamento total do usuário para o badge (opcional)
 */
export default function TopBar({ volume }) {
  return (
    <header
      className="flex items-center justify-end px-5 h-14 flex-shrink-0 border-b border-white/5"
      style={{ background: '#09090b' }}
    >
      {/* Badge de gamificação — sempre visível no canto superior direito */}
      <GamificationBadge volume={volume} />
    </header>
  );
}
