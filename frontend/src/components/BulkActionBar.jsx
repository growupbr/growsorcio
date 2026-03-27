import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

const MOTIVOS_DESCARTE = [
  'Sem margem', 'Restrição CPF', 'Apenas curioso',
  'Parou de responder', 'Optou por financiamento',
  'Sem recurso para lance', 'Urgência incompatível', 'Outro',
];

// ─── Ícones ───────────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronIcon = ({ up }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
    className={`w-3.5 h-3.5 transition-transform ${up ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Popover de Mudar Etapa ───────────────────────────────────────────────────

function MudarEtapaPopover({ etapas, onConfirm, onClose }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState('');
  const [motivo, setMotivo] = useState('');
  const ref = useRef(null);

  const stageObj = etapas.find((e) => e.name === etapaSelecionada);
  const precisaMotivo = stageObj?.is_lost;

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  function handleConfirm() {
    if (!etapaSelecionada) return;
    if (precisaMotivo && !motivo) return;
    onConfirm({ action: 'mudar_etapa', etapa_funil: etapaSelecionada, motivo_descarte: motivo || undefined });
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-zinc-700 overflow-hidden"
      style={{ background: '#18181b', boxShadow: '0 -8px 32px rgba(0,0,0,0.6)' }}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-300">Mover para etapa</p>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {etapas.map((etapa) => (
          <button
            key={etapa.id}
            onClick={() => { setEtapaSelecionada(etapa.name); setMotivo(''); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm
                       hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
            <span className="flex-1 text-zinc-200 truncate">{etapa.name}</span>
            {etapaSelecionada === etapa.name && (
              <span className="text-orange-400 flex-shrink-0"><CheckIcon /></span>
            )}
          </button>
        ))}
      </div>

      {precisaMotivo && (
        <div className="px-3 pt-2 pb-1 border-t border-zinc-800">
          <p className="text-[11px] text-zinc-500 mb-1.5">Motivo do descarte</p>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full bg-zinc-900 text-zinc-200 text-xs rounded-lg px-2.5 py-2
                       border border-zinc-700 outline-none focus:border-orange-500/50"
          >
            <option value="">Selecione...</option>
            {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div className="px-3 py-2.5 border-t border-zinc-800 flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={!etapaSelecionada || (precisaMotivo && !motivo)}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ─── Popover de Arquivar ──────────────────────────────────────────────────────

function ArquivarPopover({ count, onConfirm, onClose }) {
  const [motivo, setMotivo] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 w-60 rounded-xl border border-zinc-700"
      style={{ background: '#18181b', boxShadow: '0 -8px 32px rgba(0,0,0,0.6)' }}
    >
      <div className="px-3 py-2.5 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-300">
          Arquivar {count} lead{count !== 1 ? 's' : ''}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Serão movidos para a etapa de descarte</p>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[11px] text-zinc-500 mb-1.5">Motivo (opcional)</p>
        <select
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full bg-zinc-900 text-zinc-200 text-xs rounded-lg px-2.5 py-2
                     border border-zinc-700 outline-none focus:border-orange-500/50"
        >
          <option value="">Selecione ou deixe em branco...</option>
          {MOTIVOS_DESCARTE.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="px-3 pb-2.5 flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm({ action: 'arquivar', motivo_descarte: motivo || undefined })}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold
                     px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
        >
          Arquivar
        </button>
      </div>
    </div>
  );
}

// ─── BulkActionBar ────────────────────────────────────────────────────────────

/**
 * Floating action bar que aparece quando há IDs selecionados.
 *
 * @param {Set<number>} selectedIds
 * @param {() => void} onDeselect
 * @param {(diffs: object[]) => void} onSuccess  — recebe diffs retornados pelo backend
 */
export default function BulkActionBar({ selectedIds, onDeselect, onSuccess }) {
  const count = selectedIds.size;
  const { etapas } = useFunilStages();
  const [openPopover, setOpenPopover] = useState(null); // 'etapa' | 'arquivar' | null
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState('');

  // Fecha popover e erro ao desselecionar
  useEffect(() => {
    if (count === 0) { setOpenPopover(null); setErro(''); }
  }, [count]);

  async function executar(params) {
    setExecutando(true);
    setErro('');
    setOpenPopover(null);
    try {
      const result = await api.bulkUpdate({
        ids: Array.from(selectedIds),
        ...params,
      });
      onSuccess(result.diffs);
      onDeselect();
    } catch (err) {
      setErro(err.message);
    } finally {
      setExecutando(false);
    }
  }

  // Não renderiza quando não há seleção
  if (count === 0) return null;

  return (
    <div
      className="fixed bottom-16 md:bottom-0 inset-x-0 z-50 flex justify-center px-4 pb-4 pointer-events-none"
      style={{ animation: 'slideUp 0.2s ease' }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <div
        className="pointer-events-auto w-full max-w-xl rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap"
        style={{
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Badge contagem */}
        <span
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full
                     text-xs font-bold text-white"
          style={{ background: '#FF4500' }}
        >
          {count}
        </span>
        <span className="text-sm text-zinc-300 font-medium flex-shrink-0">
          selecionado{count !== 1 ? 's' : ''}
        </span>

        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">

          {/* Erro inline */}
          {erro && (
            <span className="text-xs text-red-400 flex-1 text-right pr-2">{erro}</span>
          )}

          {/* Mudar Etapa */}
          <div className="relative">
            <button
              disabled={executando}
              onClick={() => setOpenPopover(openPopover === 'etapa' ? null : 'etapa')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl
                         bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer
                         disabled:opacity-40"
            >
              Mudar Etapa
              <ChevronIcon up={openPopover === 'etapa'} />
            </button>
            {openPopover === 'etapa' && (
              <MudarEtapaPopover
                etapas={etapas}
                onConfirm={executar}
                onClose={() => setOpenPopover(null)}
              />
            )}
          </div>

          {/* Atribuir Tag — em breve */}
          <button
            disabled
            title="Em breve"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl
                       bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
          >
            Atribuir Tag
            <span className="text-[9px] font-bold bg-zinc-700 text-zinc-500 px-1.5 py-0.5 rounded-full">em breve</span>
          </button>

          {/* Arquivar */}
          <div className="relative">
            <button
              disabled={executando}
              onClick={() => setOpenPopover(openPopover === 'arquivar' ? null : 'arquivar')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl
                         bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20
                         transition-colors cursor-pointer disabled:opacity-40"
            >
              {executando ? 'Aplicando...' : 'Arquivar'}
              <ChevronIcon up={openPopover === 'arquivar'} />
            </button>
            {openPopover === 'arquivar' && (
              <ArquivarPopover
                count={count}
                onConfirm={executar}
                onClose={() => setOpenPopover(null)}
              />
            )}
          </div>

          {/* Desselecionar */}
          <button
            onClick={onDeselect}
            className="p-2 rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800
                       transition-all cursor-pointer"
            title="Limpar seleção"
          >
            <XIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
