/**
 * CookieModal
 * Modal de configuração granular de cookies.
 * Lista cada categoria com toggle individual e descrição clara.
 */
import { useState, useEffect, useRef } from 'react';
import { X, Shield, Settings2, ChevronDown } from 'lucide-react';

const CATEGORIAS = [
  {
    id: 'essential',
    label: 'Essenciais',
    icon: <Shield size={15} className="text-emerald-400" />,
    required: true,
    descricao:
      'Necessários para que o sistema funcione. Incluem autenticação (token Supabase no localStorage), controle de sessão e preferência de cookies. Não podem ser desativados.',
    itens: [
      { nome: 'sb-{ref}-auth-token', local: 'localStorage', duracao: 'Sessão da conta', finalidade: 'Token JWT de autenticação (Supabase Auth)' },
      { nome: 'growsorcio_cookie_consent', local: 'localStorage', duracao: '1 ano', finalidade: 'Salva sua escolha de cookies para não perguntar novamente' },
    ],
  },
  {
    id: 'functional',
    label: 'Funcionais',
    icon: <Settings2 size={15} className="text-blue-400" />,
    required: false,
    descricao:
      'Melhoram a experiência de uso salvando suas preferências de tela, como filtros ativos, estado de modais e controle de animações. Não identificam você nem enviam dados a terceiros.',
    itens: [
      { nome: 'seen_welcome_v*', local: 'localStorage', duracao: '90 dias', finalidade: 'Evita exibir o modal de boas-vindas repetidamente' },
      { nome: 'tec_confetti_fired', local: 'sessionStorage', duracao: 'Sessão do navegador', finalidade: 'Evita repetir animação de confete da landing TEC' },
      { nome: 'filtro_leads_periodo_*', local: 'sessionStorage', duracao: 'Sessão do navegador', finalidade: 'Lembra o filtro de período ativo na tela de leads' },
      { nome: 'notif_session_ts', local: 'sessionStorage', duracao: 'Sessão do navegador', finalidade: 'Controla quando as notificações foram verificadas pela última vez' },
      { nome: 'propostas_v*', local: 'sessionStorage', duracao: 'Sessão do navegador', finalidade: 'Dados da proposta em edição (evita perda ao navegar)' },
    ],
  },
];

export default function CookieModal({ initialConsent, onSave, onClose }) {
  const [prefs, setPrefs] = useState({
    essential: true,
    functional: initialConsent?.functional ?? true,
  });
  const [expandido, setExpandido] = useState({});
  const overlayRef = useRef(null);

  // Fecha ao pressionar Escape
  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function toggleCategoria(id) {
    if (id === 'essential') return; // imutável
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  }

  function toggleExpandido(id) {
    setExpandido((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSave() {
    onSave({ functional: prefs.functional });
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações de cookies"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <p className="text-sm font-bold text-white">Configurações de cookies</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Escolha o que deseja permitir</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/8 transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categorias */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {CATEGORIAS.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
              {/* Linha principal */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-shrink-0">{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">{cat.label}</span>
                    {cat.required && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                        Sempre ativo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug line-clamp-2">
                    {cat.descricao}
                  </p>
                </div>
                {/* Toggle */}
                <button
                  role="switch"
                  aria-checked={prefs[cat.id]}
                  disabled={cat.required}
                  onClick={() => toggleCategoria(cat.id)}
                  className={[
                    'flex-shrink-0 relative w-10 h-5.5 rounded-full transition-all duration-200',
                    cat.required ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                    prefs[cat.id] ? 'bg-[#FF4500]' : 'bg-zinc-700',
                  ].join(' ')}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span
                    className={[
                      'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200',
                      prefs[cat.id] ? 'translate-x-[19px]' : 'translate-x-[2px]',
                    ].join(' ')}
                    style={{ width: '17px', height: '17px', top: '2.5px' }}
                  />
                </button>
              </div>

              {/* Expandir detalhes */}
              <button
                onClick={() => toggleExpandido(cat.id)}
                className="w-full flex items-center gap-1.5 px-4 pb-2 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-150 ${expandido[cat.id] ? 'rotate-180' : ''}`}
                />
                {expandido[cat.id] ? 'Ocultar detalhes' : `Ver ${cat.itens.length} item${cat.itens.length > 1 ? 's' : ''}`}
              </button>

              {expandido[cat.id] && (
                <div className="border-t border-white/6 px-4 py-3 space-y-2">
                  {cat.itens.map((item) => (
                    <div key={item.nome} className="text-[11px] leading-snug">
                      <span className="font-mono text-zinc-300">{item.nome}</span>
                      <span className="text-zinc-600"> · {item.local} · {item.duracao}</span>
                      <p className="text-zinc-500 mt-0.5">{item.finalidade}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/8">
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-zinc-600 hover:text-zinc-400 underline underline-offset-2 transition-colors"
          >
            Política de Privacidade
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/8 transition-all min-h-[40px] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#FF4500] hover:bg-[#e03e00] transition-colors min-h-[40px] cursor-pointer"
            >
              Salvar preferências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
