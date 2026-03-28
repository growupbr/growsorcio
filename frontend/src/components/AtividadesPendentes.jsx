/**
 * AtividadesPendentes — Dropdown inline para o LeadCard do Kanban
 *
 * Exibido ao clicar no badge "N pendentes" do card.
 * Cada item tem checkbox; ao marcar: line-through + opacity-50 → fade-out após 800ms.
 * Mobile: swipe-right ≥ 60px equivale a marcar como concluído.
 */
import { useRef, useEffect } from 'react';
import { useAtividades } from '../hooks/useAtividades';

function formatarDataRelativa(str) {
  if (!str) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  if (str.slice(0, 10) === hoje) return 'Hoje';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function AtividadeItem({ item }) {
  const { concluindo, concluir } = useAtividades();
  const isConcluindo = concluindo.has(item.id);

  // Touch swipe-right para mobile
  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (delta >= 60 && !isConcluindo) concluir(item.id);
  };

  const data = formatarDataRelativa(item.data_prevista);
  const vencido = item.data_prevista && item.data_prevista.slice(0, 10) < new Date().toISOString().slice(0, 10);

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 select-none"
      style={{
        opacity: isConcluindo ? 0.4 : 1,
        transform: isConcluindo ? 'translateX(8px)' : 'none',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        background: 'transparent',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Checkbox */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); if (!isConcluindo) concluir(item.id); }}
        className="w-4 h-4 flex-shrink-0 rounded border transition-colors duration-150 flex items-center justify-center cursor-pointer"
        style={{
          border: isConcluindo ? '1.5px solid #22c55e' : '1.5px solid #52525b',
          background: isConcluindo ? 'rgba(34,197,94,0.15)' : 'transparent',
        }}
        aria-label="Marcar como concluído"
      >
        {isConcluindo && (
          <svg viewBox="0 0 12 12" fill="none" stroke="#22c55e" strokeWidth={2} className="w-2.5 h-2.5">
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        )}
      </button>

      {/* Descrição */}
      <span
        className="flex-1 text-xs leading-snug"
        style={{
          color: isConcluindo ? '#52525b' : '#d4d4d8',
          textDecoration: isConcluindo ? 'line-through' : 'none',
        }}
      >
        {item.descricao}
      </span>

      {/* Data */}
      {data && (
        <span
          className="text-[10px] font-medium flex-shrink-0 px-1.5 py-0.5 rounded-full"
          style={{
            color: vencido ? '#f87171' : '#71717a',
            background: vencido ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
          }}
        >
          {data}
        </span>
      )}
    </div>
  );
}

/**
 * Props:
 *   leadId   — number
 *   onClose  — () => void
 */
export default function AtividadesPendentes({ leadId, onClose }) {
  const { getByLead } = useAtividades();
  const items = getByLead(leadId);
  const ref = useRef(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    // Usar capture para pegar antes do dnd-kit consumir o evento
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 z-30 rounded-xl overflow-hidden"
      style={{
        top: 'calc(100% + 6px)',
        background: '#111113',
        border: '1px solid #27272a',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ borderBottom: '1px solid #27272a' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#71717a' }}>
          Atividades pendentes
        </span>
        <button
          onClick={onClose}
          className="rounded p-0.5 transition-colors cursor-pointer"
          style={{ color: '#52525b' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/>
          </svg>
        </button>
      </div>

      <div className="divide-y" style={{ divideColor: '#18181b', maxHeight: 240, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <p className="px-3 py-3 text-xs text-center" style={{ color: '#52525b' }}>
            Nenhuma atividade pendente
          </p>
        ) : (
          items.map((item) => <AtividadeItem key={item.id} item={item} />)
        )}
      </div>

      {items.length > 0 && (
        <p
          className="px-3 py-1.5 text-[10px] text-center hidden sm:block"
          style={{ color: '#3f3f46', borderTop: '1px solid #18181b' }}
        >
          Swipe → para concluir no mobile
        </p>
      )}
    </div>
  );
}
