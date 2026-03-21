import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'growsorcio_onboarding_v1';

// ── Ícone de Play ──────────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-14 h-14 drop-shadow-[0_0_24px_rgba(255,69,0,0.7)]"
      fill="none"
    >
      <circle cx="12" cy="12" r="11" fill="rgba(255,69,0,0.15)" stroke="rgba(255,69,0,0.4)" strokeWidth="1" />
      <polygon points="10,7.5 18,12 10,16.5" fill="#FF4500" />
    </svg>
  );
}

// ── Ícone de fechar ────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
    </svg>
  );
}

// ── Ícone de escudo / missão ───────────────────────────────────────────────────
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

/**
 * WelcomeModal — aparece automaticamente na primeira visita ao Dashboard.
 *
 * Persistência: localStorage com chave STORAGE_KEY.
 * Fecha ao clicar no botão, no overlay ou pressionar Escape.
 *
 * Props:
 *   onClose — callback chamado quando o modal fecha
 */
export default function WelcomeModal({ onClose }) {
  const dialogRef = useRef(null);

  // Foco no modal ao abrir (acessibilidade)
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Fechar com Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  }

  return (
    /* ── Overlay ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      {/* ── Card ── */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl outline-none"
        style={{
          animation: 'welcomeEntrance 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* Gradiente de borda laranja */}
        <div
          className="absolute -inset-[1px] rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,69,0,0.7) 0%, rgba(255,69,0,0.1) 50%, rgba(255,69,0,0.5) 100%)',
          }}
        />

        {/* Conteúdo do modal */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: '#0a0a0f' }}
        >
          {/* Radial glow de fundo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,69,0,0.08) 0%, transparent 70%)',
            }}
          />

          {/* Grid sutil */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* ── Botão de fechar ── */}
          <button
            onClick={dismiss}
            aria-label="Fechar modal"
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <CloseIcon />
          </button>

          <div className="relative z-10 p-8 md:p-10">

            {/* ── Badge topo ── */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25">
                <ShieldIcon />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: '#FF4500' }}
                >
                  Acesso Liberado — Central de Inteligência
                </span>
              </div>
            </div>

            {/* ── Título ── */}
            <div className="text-center mb-8">
              <h2
                id="welcome-title"
                className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-3"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
              >
                Bem-vindo à Central de Inteligência,{' '}
                <span
                  className="block md:inline"
                  style={{
                    background: 'linear-gradient(90deg, #FF4500, #ff7a45)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Comandante.
                </span>
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                Antes de começar sua missão, o Comandante gravou uma mensagem exclusiva para você.
                Assista agora.
              </p>
            </div>

            {/* ── Player de Vídeo ── */}
            <div
              className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 group cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #0f0f17 0%, #12121e 100%)',
                border: '1px solid rgba(255,69,0,0.2)',
                boxShadow: '0 0 60px rgba(255,69,0,0.08), inset 0 0 40px rgba(0,0,0,0.4)',
              }}
              role="img"
              aria-label="Player de vídeo de boas-vindas"
            >
              {/* Scan lines decorativas */}
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                }}
              />

              {/* Cantos decorativos — estilo HUD militar */}
              {[
                'top-3 left-3 border-t border-l',
                'top-3 right-3 border-t border-r',
                'bottom-3 left-3 border-b border-l',
                'bottom-3 right-3 border-b border-r',
              ].map((cls) => (
                <div
                  key={cls}
                  className={`absolute w-5 h-5 ${cls} pointer-events-none`}
                  style={{ borderColor: 'rgba(255,69,0,0.4)' }}
                />
              ))}

              {/* Label — placeholder */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500/60">
                  GrowSorcio · Missão 001
                </span>
              </div>

              {/* Play button central */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="transition-transform duration-200 group-hover:scale-110">
                  <PlayIcon />
                </div>
                <p className="text-zinc-500 text-xs font-medium tracking-wide">
                  Vídeo de boas-vindas · ~3 min
                </p>
              </div>

              {/* Glow no hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,69,0,0.05), transparent)' }}
              />
            </div>

            {/* ── Métricas de impacto (3 pillars) ── */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { valor: '2 min', label: 'Lead no funil' },
                { valor: '87%', label: 'Objeções eliminadas' },
                { valor: '21×', label: 'Mais fechamentos' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span
                    className="text-xl font-extrabold tabular-nums leading-none mb-1"
                    style={{ color: '#FF4500' }}
                  >
                    {item.valor}
                  </span>
                  <span className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* ── CTA ── */}
            <button
              onClick={dismiss}
              className="relative w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white font-bold text-base tracking-wide overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 group"
              style={{
                background: 'linear-gradient(135deg, #FF4500 0%, #cc3700 100%)',
                boxShadow: '0 8px 32px rgba(255,69,0,0.35), 0 0 0 1px rgba(255,69,0,0.2)',
              }}
            >
              {/* Shimmer */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 relative z-10 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="relative z-10 uppercase tracking-widest text-sm">
                Iniciar Minha Missão
              </span>
            </button>

            {/* Rodapé discreto */}
            <p className="text-center text-zinc-700 text-[11px] mt-4">
              Esta mensagem foi preparada exclusivamente para você · GrowSorcio TEC 2.0
            </p>
          </div>
        </div>
      </div>

      {/* ── Keyframe da animação de entrada ── */}
      <style>{`
        @keyframes welcomeEntrance {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/** Retorna true se o modal ainda não foi visto pelo utilizador */
export function shouldShowWelcome() {
  return !localStorage.getItem(STORAGE_KEY);
}
