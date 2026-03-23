import { useState, useRef } from 'react';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';

// ─── Ícones inline ───────────────────────────────────────────────────────────

const GripIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 012.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L18 8.625"/>
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// ─── Linha de etapa (editável) ────────────────────────────────────────────────

function EtapaRow({ etapa, dragHandlers, isDragging, isDropTarget, onUpdate, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(etapa.name);
  const [cor, setCor] = useState(etapa.color);
  const [isLost, setIsLost] = useState(etapa.is_lost);
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  function iniciarEdicao() {
    setNome(etapa.name);
    setCor(etapa.color);
    setIsLost(etapa.is_lost);
    setEditando(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function cancelar() {
    setNome(etapa.name);
    setCor(etapa.color);
    setIsLost(etapa.is_lost);
    setEditando(false);
  }

  async function salvar() {
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    try {
      await onUpdate(etapa.id, { name: nome.trim(), color: cor, is_lost: isLost });
      setEditando(false);
    } catch {
      cancelar();
    } finally {
      setSalvando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') salvar();
    if (e.key === 'Escape') cancelar();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await onDelete(etapa.id);
    } catch (err) {
      setConfirmDelete(false);
      alert(err.message);
    }
  }

  return (
    <div
      {...dragHandlers}
      className={[
        'group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150',
        isDragging
          ? 'opacity-40 border-orange-500/30 bg-zinc-900'
          : isDropTarget
          ? 'border-orange-500/50 bg-zinc-800/60 scale-[1.01]'
          : 'bg-zinc-900 border-white/5 hover:border-zinc-700/60',
      ].join(' ')}
    >
      {/* Drag handle */}
      <span
        className="text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
        title="Arrastar para reordenar"
      >
        <GripIcon />
      </span>

      {/* Color dot / picker */}
      <label className="flex-shrink-0 cursor-pointer" title="Cor da etapa">
        <span
          className={[
            'block rounded-full transition-transform',
            editando ? 'w-5 h-5 border-2 border-white/30 hover:scale-110' : 'w-3 h-3',
          ].join(' ')}
          style={{ background: editando ? cor : etapa.color }}
        />
        {editando && (
          <input
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            className="sr-only"
          />
        )}
      </label>

      {/* Name */}
      {editando ? (
        <input
          ref={inputRef}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-zinc-800 text-zinc-100 text-sm rounded-lg px-3 py-1.5
                     border border-orange-500/30 outline-none focus:ring-1 focus:ring-orange-500/40"
        />
      ) : (
        <span className="flex-1 text-sm font-medium text-zinc-200">{etapa.name}</span>
      )}

      {/* is_lost toggle */}
      {editando ? (
        <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0">
          <input
            type="checkbox"
            checked={isLost}
            onChange={(e) => setIsLost(e.target.checked)}
            className="accent-red-500 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-zinc-400">Perdido</span>
        </label>
      ) : etapa.is_lost ? (
        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold
                         bg-red-500/10 text-red-400 border border-red-500/20">
          Perdido
        </span>
      ) : null}

      {/* Ações */}
      {editando ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={salvar}
            disabled={salvando || !nome.trim()}
            className="flex items-center gap-1 text-xs font-semibold text-orange-400
                       hover:text-orange-300 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <CheckIcon />
            {salvando ? '...' : 'Salvar'}
          </button>
          <button
            onClick={cancelar}
            className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          >
            <XIcon />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={iniciarEdicao}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800
                       transition-all cursor-pointer"
            title="Editar"
          >
            <PencilIcon />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-red-500/10
                           text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-zinc-600 hover:text-zinc-400 cursor-pointer"
              >
                <XIcon />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10
                         transition-all cursor-pointer"
              title="Excluir"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Formulário "Nova Etapa" ──────────────────────────────────────────────────

function NovaEtapaForm({ onCriar, onCancelar }) {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#f97316');
  const [isLost, setIsLost] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!nome.trim() || salvando) return;
    setSalvando(true);
    try {
      await onCriar({ name: nome.trim(), color: cor, is_lost: isLost });
      setNome('');
      setCor('#f97316');
      setIsLost(false);
    } finally {
      setSalvando(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSalvar();
    if (e.key === 'Escape') onCancelar();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/60 border border-orange-500/30">
      {/* Color picker */}
      <label className="flex-shrink-0 cursor-pointer" title="Cor da etapa">
        <span
          className="block w-5 h-5 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
          style={{ background: cor }}
        />
        <input
          type="color"
          value={cor}
          onChange={(e) => setCor(e.target.value)}
          className="sr-only"
        />
      </label>

      <input
        autoFocus
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nome da etapa..."
        className="flex-1 bg-transparent text-zinc-100 text-sm outline-none placeholder-zinc-600"
      />

      <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0">
        <input
          type="checkbox"
          checked={isLost}
          onChange={(e) => setIsLost(e.target.checked)}
          className="accent-red-500 w-3.5 h-3.5"
        />
        <span className="text-[11px] text-zinc-400">Perdido</span>
      </label>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleSalvar}
          disabled={!nome.trim() || salvando}
          className="flex items-center gap-1 text-xs font-semibold text-orange-400
                     hover:text-orange-300 disabled:opacity-40 transition-colors cursor-pointer"
        >
          <CheckIcon />
          {salvando ? '...' : 'Criar'}
        </button>
        <button onClick={onCancelar} className="text-zinc-600 hover:text-zinc-400 cursor-pointer">
          <XIcon />
        </button>
      </div>
    </div>
  );
}

// ─── Página Config ────────────────────────────────────────────────────────────

export default function Config() {
  const { etapas, setEtapas, carregando, recarregar } = useFunilStages();
  const [adicionando, setAdicionando] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [erro, setErro] = useState('');

  // ── Drag & drop nativo HTML5 ──────────────────────────────────────────────

  function createDragHandlers(index) {
    return {
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.effectAllowed = 'move';
        setDragIndex(index);
      },
      onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dropIndex !== index) setDropIndex(index);
      },
      onDragLeave: () => setDropIndex(null),
      onDragEnd: () => {
        setDragIndex(null);
        setDropIndex(null);
      },
      onDrop: async (e) => {
        e.preventDefault();
        const from = dragIndex;
        const to = index;
        setDragIndex(null);
        setDropIndex(null);
        if (from === null || from === to) return;
        await handleReorder(from, to);
      },
    };
  }

  async function handleReorder(fromIndex, toIndex) {
    const novas = [...etapas];
    const [movido] = novas.splice(fromIndex, 1);
    novas.splice(toIndex, 0, movido);
    const reordenadas = novas.map((e, i) => ({ ...e, display_order: i }));
    setEtapas(reordenadas); // optimistic update
    try {
      await api.reordenarEtapas(reordenadas.map(({ id, display_order }) => ({ id, display_order })));
    } catch {
      recarregar(); // rollback
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async function handleCriar(dados) {
    setErro('');
    try {
      const nova = await api.criarEtapa(dados);
      setEtapas((prev) => [...prev, nova]);
      setAdicionando(false);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleAtualizar(id, dados) {
    setErro('');
    const atualizada = await api.atualizarEtapa(id, dados);
    setEtapas((prev) => prev.map((e) => (e.id === id ? atualizada : e)));
  }

  async function handleExcluir(id) {
    setErro('');
    try {
      await api.excluirEtapa(id);
      setEtapas((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setErro(err.message);
      throw err; // re-throw so EtapaRow can handle UI reset
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 px-6 py-8">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight text-zinc-100">Etapas do Funil</h1>
            <p className="text-[13px] text-zinc-500 mt-0.5">
              Arraste para reordenar · clique no lápis para editar
            </p>
          </div>
          <button
            onClick={() => setAdicionando(true)}
            disabled={adicionando}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400
                       disabled:opacity-50 text-white text-xs font-semibold py-2 px-3
                       rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon />
            Nova etapa
          </button>
        </div>

        {/* Erro global */}
        {erro && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-start gap-2">
            <span className="text-red-400 text-sm flex-1">{erro}</span>
            <button onClick={() => setErro('')} className="text-red-600 hover:text-red-400 cursor-pointer">
              <XIcon />
            </button>
          </div>
        )}

        {/* Formulário nova etapa */}
        {adicionando && (
          <NovaEtapaForm
            onCriar={handleCriar}
            onCancelar={() => setAdicionando(false)}
          />
        )}

        {/* Lista de etapas */}
        {carregando ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-zinc-900 border border-white/5 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        ) : etapas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
              <span className="text-2xl">🗂️</span>
            </div>
            <p className="text-sm text-zinc-400 font-medium">Nenhuma etapa configurada</p>
            <p className="text-xs text-zinc-600">Crie a primeira etapa para organizar seu funil</p>
          </div>
        ) : (
          <div className="space-y-2" onDragOver={(e) => e.preventDefault()}>
            {etapas.map((etapa, index) => (
              <EtapaRow
                key={etapa.id}
                etapa={etapa}
                dragHandlers={createDragHandlers(index)}
                isDragging={dragIndex === index}
                isDropTarget={dropIndex === index && dragIndex !== index}
                onUpdate={handleAtualizar}
                onDelete={handleExcluir}
              />
            ))}
          </div>
        )}

        {/* Footer info */}
        {!carregando && etapas.length > 0 && (
          <p className="text-[11px] text-zinc-700 text-center">
            {etapas.length} etapa{etapas.length !== 1 ? 's' : ''} · apenas admins podem editar
          </p>
        )}
      </div>
    </div>
  );
}

