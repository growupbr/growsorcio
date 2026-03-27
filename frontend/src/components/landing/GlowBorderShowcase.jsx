/**
 * GlowBorderShowcase
 *
 * Container com borda de luz neon animada (conic-gradient giratório).
 * O rastro alterna entre #FF4500 (laranja) e #0070f3 (azul), com glow
 * externo em blur que acompanha a rotação.
 *
 * Técnica:
 *  • Div pai: position relative, padding 3px, overflow hidden → define a "borda"
 *  • Div giratória (200×200% do pai, centralizada): conic-gradient + animação spin
 *  • Div giratória duplicada com filter:blur → glow externo suave
 *  • Div interna z-10: fundo zinc-950, rounded menores → isola o conteúdo
 */

const KEYFRAMES = `
@keyframes gs-spin-conic {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
`;

const GRADIENT =
  'conic-gradient(from 0deg, transparent 0deg, #FF4500 60deg, #0070f3 180deg, #FF4500 300deg, transparent 355deg)';

const spinnerStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '200%',
  height: '200%',
  background: GRADIENT,
  animation: 'gs-spin-conic 4s linear infinite',
  willChange: 'transform',
};

export default function GlowBorderShowcase({ src, alt, className = '' }) {
  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Wrapper: define a área da "borda" via padding */}
      <div
        className={`relative rounded-2xl overflow-hidden ${className}`}
        style={{ padding: '3px', isolation: 'isolate' }}
      >
        {/* Camada 1 — gradiente cônico girando (borda nítida) */}
        <div style={spinnerStyle} aria-hidden="true" />

        {/* Camada 2 — cópia com blur → glow externo */}
        <div
          style={{ ...spinnerStyle, filter: 'blur(18px)', opacity: 0.75 }}
          aria-hidden="true"
        />

        {/* Conteúdo isolado sobre as camadas */}
        <div
          className="relative z-10 rounded-[14px] overflow-hidden bg-zinc-950"
          style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)' }}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-auto block"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </>
  );
}
