import { Lock } from 'lucide-react';

/**
 * Componente reutilizável para páginas bloqueadas por plano.
 * Props:
 *   title — título do recurso bloqueado
 *   plan  — nome do plano necessário (ex: "Pro", "Elite")
 */
export default function LockedFeature({ title, plan }) {
  const planSlug = plan?.toLowerCase(); // 'pro' | 'elite'

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-6">

      {/* Ícone de cadeado */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 border border-dark-600">
        <Lock size={32} className="text-muted" />
      </div>

      {/* Texto */}
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-semibold text-text">{title}</h2>
        <p className="text-muted text-sm leading-relaxed">
          Este recurso está disponível a partir do plano{' '}
          <span className="text-text font-semibold">{plan}</span>.
          Faça upgrade para desbloquear acesso completo.
        </p>
      </div>

      {/* Botão de upgrade */}
      <a
        href={`/checkout${planSlug ? `?plan=${planSlug}` : ''}`}
        className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors duration-150 shadow-glow-sm"
      >
        <Lock size={14} />
        Fazer Upgrade para o {plan}
      </a>
    </div>
  );
}

