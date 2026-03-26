import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useFunilStages } from '../hooks/useFunilStages';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../api/supabaseClient';
import { useSubscription } from '../hooks/useSubscription';

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

// ─── Seção de Perfil ─────────────────────────────────────────────────────────

function ProfileSection() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState({ full_name: '', email: '', phone_number: '', avatar_url: null, meta_mensal: 0 });
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erroMsg, setErroMsg] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [salvandoEmail, setSalvandoEmail] = useState(false);
  const [erroEmail, setErroEmail] = useState('');
  const [sucessoEmail, setSucessoEmail] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    api.getProfile()
      .then(setPerfil)
      .catch((e) => setErroMsg(e.message))
      .finally(() => setCarregandoPerfil(false));
  }, []);

  function comprimirImagem(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Erro ao carregar imagem')); };
      img.src = url;
    });
  }

  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErroMsg('Selecione um arquivo de imagem válido.');
      return;
    }
    try {
      const dataUrl = await comprimirImagem(file);
      setPerfil((p) => ({ ...p, avatar_url: dataUrl }));
    } catch {
      setErroMsg('Erro ao processar a imagem.');
    }
    e.target.value = '';
  }

  async function handleSalvar() {
    if (salvando) return;
    setSalvando(true);
    setSucesso('');
    setErroMsg('');
    try {
      await api.updateProfile({
        full_name:    perfil.full_name,
        phone_number: perfil.phone_number,
        avatar_url:   perfil.avatar_url,
        meta_mensal:  perfil.meta_mensal,
      });
      setSucesso('Perfil salvo!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (e) {
      setErroMsg(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarEmail() {
    if (!novoEmail.trim() || salvandoEmail) return;
    setSalvandoEmail(true);
    setErroEmail('');
    setSucessoEmail('');
    try {
      const { error } = await supabase.auth.updateUser({ email: novoEmail.trim() });
      if (error) throw error;
      setSucessoEmail('Confirmação enviada! Verifique seu e-mail.');
      setNovoEmail('');
    } catch (e) {
      setErroEmail(e.message);
    } finally {
      setSalvandoEmail(false);
    }
  }

  const iniciais = (perfil.full_name || perfil.email || '?')
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  if (carregandoPerfil) {
    return (
      <div className="rounded-2xl bg-zinc-900 border border-white/5 p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 bg-zinc-800 rounded w-36" />
            <div className="h-3 bg-zinc-800 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-white/5 p-6">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Meu Perfil</h2>

      {/* Avatar + nome */}
      <div className="flex items-center gap-5 mb-7">
        <div className="relative group flex-shrink-0">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold cursor-pointer ring-2 ring-white/8 group-hover:ring-orange-500/40 transition-all"
            style={{ background: perfil.avatar_url ? 'transparent' : 'linear-gradient(135deg, #FF4500 0%, #f59e0b 100%)' }}
            onClick={() => fileRef.current?.click()}
          >
            {perfil.avatar_url
              ? <img src={perfil.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              : <span className="text-white select-none">{iniciais}</span>
            }
          </div>
          {/* Camera overlay */}
          <div
            className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} aria-label="Selecionar foto de perfil" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-200 truncate">{perfil.full_name || 'Sem nome'}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{perfil.email}</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 text-[11px] text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
          >
            Alterar foto
          </button>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-4 mb-5">
        <div>
          <label htmlFor="perfil-nome" className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">
            Nome completo
          </label>
          <input
            id="perfil-nome"
            type="text"
            value={perfil.full_name}
            onChange={(e) => setPerfil((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="Seu nome"
            maxLength={100}
            className="w-full bg-zinc-950 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-zinc-700 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="perfil-telefone" className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">
            Telefone / WhatsApp
          </label>
          <input
            id="perfil-telefone"
            type="tel"
            value={perfil.phone_number}
            onChange={(e) => setPerfil((p) => ({ ...p, phone_number: e.target.value }))}
            placeholder="(11) 9 8765-4321"
            maxLength={30}
            className="w-full bg-zinc-950 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-zinc-700 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
          />
        </div>
        <div>
          <label htmlFor="perfil-meta" className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1.5">
            Meta mensal de vendas
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500 select-none">R$</span>
            <input
              id="perfil-meta"
              type="number"
              min="0"
              step="100"
              value={perfil.meta_mensal || ''}
              onChange={(e) => setPerfil((p) => ({ ...p, meta_mensal: Math.max(0, parseInt(e.target.value) || 0) }))}
              placeholder="0"
              className="w-full bg-zinc-950 border border-white/8 text-white text-sm rounded-xl pl-9 pr-3.5 py-2.5 placeholder-zinc-700 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <p className="text-[10px] text-zinc-700 mt-1">Valor em reais que você quer faturar por mês</p>
        </div>
      </div>

      {/* Feedback */}
      {erroMsg && <p className="text-xs text-red-400 mb-3">{erroMsg}</p>}
      {sucesso  && <p className="text-xs text-emerald-400 mb-3">{sucesso}</p>}

      <button
        onClick={handleSalvar}
        disabled={salvando}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
      >
        {salvando ? 'Salvando...' : 'Salvar perfil'}
      </button>

      {/* Alterar e-mail */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Alterar E-mail</p>
        <p className="text-[11px] text-zinc-600 mb-3">
          Atual: <span className="text-zinc-400">{perfil.email}</span>
        </p>
        <div className="flex gap-2">
          <input
            id="novo-email"
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAlterarEmail()}
            placeholder="Novo e-mail"
            className="flex-1 bg-zinc-950 border border-white/8 text-white text-sm rounded-xl px-3.5 py-2.5 placeholder-zinc-700 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
          />
          <button
            onClick={handleAlterarEmail}
            disabled={salvandoEmail || !novoEmail.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border border-white/8 transition-all cursor-pointer whitespace-nowrap"
          >
            {salvandoEmail ? '...' : 'Confirmar'}
          </button>
        </div>
        {erroEmail    && <p className="text-xs text-red-400 mt-2">{erroEmail}</p>}
        {sucessoEmail && <p className="text-xs text-emerald-400 mt-2">{sucessoEmail}</p>}
      </div>
    </div>
  );
}

// ─── Página Config ────────────────────────────────────────────────────────────

export default function Config() {
  const { etapas, setEtapas, carregando, recarregar } = useFunilStages();
  const { plan, loading: loadingPlan } = useSubscription();
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

        {/* ── Card de Plano ── PRIMEIRO elemento ── */}
        {!loadingPlan && (() => {
          const PLAN_CONFIG = {
            start: {
              emoji: '🚀', label: 'Start',
              gradient: 'linear-gradient(135deg, rgba(255,69,0,0.14) 0%, rgba(24,24,27,0) 65%)',
              borderColor: 'rgba(255,69,0,0.22)', glowColor: 'rgba(255,69,0,0.07)',
              badgeCls: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
              desc: 'Faça upgrade para Pro e desbloqueie WhatsApp CRM, GrowIA, logo personalizada e muito mais.',
              cta: { label: 'Fazer upgrade para Pro', href: '/planos', cls: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-orange-500/30' },
            },
            pro: {
              emoji: '⚡', label: 'Pro',
              gradient: 'linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(124,58,237,0.07) 100%)',
              borderColor: 'rgba(249,115,22,0.22)', glowColor: 'rgba(249,115,22,0.06)',
              badgeCls: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
              desc: 'Você está no plano Pro. Faça upgrade para Elite e desbloqueie todos os recursos ilimitados.',
              cta: { label: 'Fazer upgrade para Elite', href: '/planos', cls: 'bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 shadow-violet-500/25' },
            },
            elite: {
              emoji: '👑', label: 'Elite',
              gradient: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(24,24,27,0) 65%)',
              borderColor: 'rgba(124,58,237,0.22)', glowColor: 'rgba(124,58,237,0.07)',
              badgeCls: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
              desc: null, cta: null,
            },
          };
          const cfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG['start'];
          return (
            <div
              className="relative rounded-2xl border overflow-hidden"
              style={{ background: cfg.gradient, borderColor: cfg.borderColor, boxShadow: `0 12px 40px ${cfg.glowColor}` }}
            >
              {/* Glow blob */}
              <div
                className="absolute -top-14 -right-14 w-52 h-52 rounded-full blur-3xl pointer-events-none"
                style={{ background: cfg.borderColor, opacity: 0.6 }}
              />
              <div className="relative px-6 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl select-none">{cfg.emoji}</span>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Meu Plano</p>
                    <span className={`inline-flex items-center text-xs font-extrabold px-3 py-0.5 rounded-full ${cfg.badgeCls}`}>{cfg.label}</span>
                  </div>
                </div>
                {cfg.desc && <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{cfg.desc}</p>}
                {cfg.cta && (
                  <a
                    href={cfg.cta.href}
                    className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${cfg.cta.cls} cursor-pointer`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                    </svg>
                    {cfg.cta.label} →
                  </a>
                )}
                {!cfg.cta && (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-500/15 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-400">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-violet-300">Você está no topo!</p>
                      <p className="text-xs text-zinc-500">Todos os recursos estão desbloqueados.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <ProfileSection />

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

