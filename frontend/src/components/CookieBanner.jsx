/**
 * CookieBanner
 * Banner fixo no rodapé que aparece enquanto o usuário não der preferência.
 * Design: dark mode, #FF4500, mobile-first, fixed bottom.
 * Acessibilidade: aria-live, foco inicial no botão principal.
 */
import { useEffect, useRef } from 'react';
import { Cookie, X } from 'lucide-react';

export default function CookieBanner({ onAcceptAll, onEssentialOnly, onConfigure }) {
  const btnRef = useRef(null);

  // Foca o botão principal ao montar (acessibilidade)
  useEffect(() => {
    btnRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 pointer-events-none"
    >
      <div
        className="pointer-events-auto max-w-2xl mx-auto rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-md shadow-2xl shadow-black/60 p-5"
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#FF4500]/10 flex items-center justify-center">
            <Cookie size={18} className="text-[#FF4500]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">
              Usamos cookies e armazenamento local
            </p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              O GrowSorcio usa armazenamento essencial para autenticação e dados de sessão.
              Não usamos cookies de rastreamento, analytics ou marketing.{' '}
              <a
                href="/cookies"
                className="text-[#FF4500] underline underline-offset-2 hover:text-orange-400 transition-colors"
              >
                Saiba mais
              </a>
              .
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            ref={btnRef}
            onClick={onAcceptAll}
            className="flex-1 sm:flex-none sm:ml-auto order-1 sm:order-3 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FF4500] hover:bg-[#e03e00] transition-colors min-h-[44px] cursor-pointer"
          >
            Aceitar todos
          </button>
          <button
            onClick={onEssentialOnly}
            className="flex-1 sm:flex-none order-2 sm:order-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/8 transition-colors min-h-[44px] cursor-pointer"
          >
            Somente essenciais
          </button>
          <button
            onClick={onConfigure}
            className="flex-1 sm:flex-none order-3 sm:order-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors min-h-[44px] cursor-pointer"
          >
            Configurar
          </button>
        </div>
      </div>
    </div>
  );
}
