import { useEffect } from 'react';

export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,6,12,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[90vh] flex flex-col rounded-xl`}
        style={{
          background: '#0D1117',
          border: '1px solid #1C2333',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #1C2333' }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#F0F6FC' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 transition-colors duration-150 cursor-pointer"
            style={{ color: '#484F58' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#F0F6FC';
              e.currentTarget.style.background = '#161B22';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#484F58';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
