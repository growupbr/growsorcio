import { useState, useEffect, useRef, useCallback } from 'react';
import GrowsorcioLogo from '../components/GrowsorcioLogo';
import LockedFeature from '../components/LockedFeature';
import { useSubscription } from '../hooks/useSubscription';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONTATOS = [
  {
    id: 1,
    nome: 'Ana Paula Ferreira',
    iniciais: 'AP',
    corAvatar: '#f97316',
    status: 'online',
    naoLidas: 3,
    ultimaMensagem: 'Qual o prazo e valor da parcela aproximado?',
    ultimaHora: '14:32',
    mensagens: [
      { id: 1, texto: 'Oi! Vi o anúncio de vocês no Instagram e fiquei interessada.', hora: '14:25', enviada: false },
      { id: 2, texto: 'Olá Ana! Seja bem-vinda à GrowSorcio. Como posso te ajudar? 😊', hora: '14:27', enviada: true, lida: true },
      { id: 3, texto: 'Quero saber mais sobre o consórcio de R$ 180k', hora: '14:30', enviada: false },
      { id: 4, texto: 'Qual o prazo e valor da parcela aproximado?', hora: '14:32', enviada: false },
    ],
  },
  {
    id: 2,
    nome: 'Carlos Mendes',
    iniciais: 'CM',
    corAvatar: '#a78bfa',
    status: 'offline',
    ultimaVisto: 'Visto às 11:20',
    naoLidas: 0,
    ultimaMensagem: 'Vou pensar e te retorno ainda hoje.',
    ultimaHora: '11:22',
    mensagens: [
      { id: 1, texto: 'Bom dia! Tenho interesse no consórcio de imóvel.', hora: '10:45', enviada: false },
      { id: 2, texto: 'Bom dia, Carlos! Qual valor você tem em mente?', hora: '10:48', enviada: true, lida: true },
      { id: 3, texto: 'Em torno de R$ 350.000', hora: '10:52', enviada: false },
      { id: 4, texto: 'Temos opções excelentes! Deixa eu montar uma proposta agora mesmo 🚀', hora: '11:00', enviada: true, lida: true },
      { id: 5, texto: 'Vou pensar e te retorno ainda hoje.', hora: '11:22', enviada: false },
    ],
  },
  {
    id: 3,
    nome: 'Fernanda Costa',
    iniciais: 'FC',
    corAvatar: '#22c55e',
    status: 'online',
    naoLidas: 1,
    ultimaMensagem: 'Pode me mandar o link da proposta?',
    ultimaHora: 'Ontem',
    mensagens: [
      { id: 1, texto: 'Oi Fernanda! Passando para dar um follow-up na nossa conversa 😊', hora: 'Ontem', enviada: true, lida: true },
      { id: 2, texto: 'Oi! Tudo ótimo. Pode me mandar o link da proposta?', hora: 'Ontem', enviada: false },
    ],
  },
  {
    id: 4,
    nome: 'Roberto Alves',
    iniciais: 'RA',
    corAvatar: '#f59e0b',
    status: 'offline',
    ultimaVisto: 'Visto ontem',
    naoLidas: 0,
    ultimaMensagem: 'Certo, obrigado pelo atendimento!',
    ultimaHora: 'Seg',
    mensagens: [
      { id: 1, texto: 'Olá Roberto! Você demonstrou interesse em consórcio de veículo.', hora: 'Seg', enviada: true, lida: true },
      { id: 2, texto: 'Ah sim, mas decidi deixar pra próxima. Obrigado!', hora: 'Seg', enviada: false },
      { id: 3, texto: 'Entendido! Fico à disposição quando precisar 🙌', hora: 'Seg', enviada: true, lida: true },
    ],
  },
  {
    id: 5,
    nome: 'Juliana Martins',
    iniciais: 'JM',
    corAvatar: '#ec4899',
    status: 'offline',
    ultimaVisto: 'Visto às 09:15',
    naoLidas: 7,
    ultimaMensagem: 'Quando consigo assinar o contrato?',
    ultimaHora: '09:16',
    mensagens: [
      { id: 1, texto: 'Bom dia! Já tomei a decisão e quero fechar!', hora: '09:10', enviada: false },
      { id: 2, texto: 'Que notícia incrível! Vou listar os documentos necessários 📄', hora: '09:12', enviada: true, lida: true },
      { id: 3, texto: 'Me manda a lista então!', hora: '09:13', enviada: false },
      { id: 4, texto: 'RG ou CNH, CPF, comprovante de renda e comprovante de endereço.', hora: '09:14', enviada: true, lida: true },
      { id: 5, texto: 'Quando consigo assinar o contrato?', hora: '09:16', enviada: false },
    ],
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.1a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>
);
const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);
const MoreVertIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
);
const SmileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const PaperclipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
  </svg>
);
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const MessageSquareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const CheckDoubleIcon = () => (
  <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polyline points="1,9 5,13 11,5"/><polyline points="7,13 13,5"/>
  </svg>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ iniciais, cor, size = 40 }) {
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold select-none"
      style={{ width: size, height: size, background: cor, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {iniciais}
    </div>
  );
}

// ─── ConversaItem ─────────────────────────────────────────────────────────────

function ConversaItem({ contato, ativa, onClick }) {
  return (
    <button
      onClick={() => onClick(contato.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 border-r-2
        ${ativa
          ? 'bg-orange-500/10 border-orange-500'
          : 'hover:bg-zinc-900/60 border-transparent'
        }`}
      aria-label={`Abrir conversa com ${contato.nome}`}
      aria-current={ativa ? 'true' : undefined}
    >
      <div className="relative flex-shrink-0">
        <Avatar iniciais={contato.iniciais} cor={contato.corAvatar} size={44} />
        {contato.status === 'online' && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950"
            aria-label="Online"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-sm font-semibold truncate text-zinc-200">{contato.nome}</span>
          <span className={`text-[10px] flex-shrink-0 font-medium ${contato.naoLidas > 0 ? 'text-orange-400' : 'text-zinc-600'}`}>
            {contato.ultimaHora}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-zinc-500 truncate">{contato.ultimaMensagem}</p>
          {contato.naoLidas > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
              {contato.naoLidas > 9 ? '9+' : contato.naoLidas}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Balão de mensagem ────────────────────────────────────────────────────────

function MensagemBalao({ msg }) {
  return (
    <div className={`flex ${msg.enviada ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-sm shadow-md
          ${msg.enviada
            ? 'bg-orange-600 text-white rounded-tr-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
          }`}
      >
        <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.texto}</p>
        <div className={`flex items-center gap-1 mt-1 ${msg.enviada ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${msg.enviada ? 'text-orange-200' : 'text-zinc-500'}`}>
            {msg.hora}
          </span>
          {msg.enviada && (
            <span className={msg.lida ? 'text-sky-300' : 'text-orange-200'} aria-label={msg.lida ? 'Lida' : 'Entregue'}>
              <CheckDoubleIcon />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Estado Vazio ─────────────────────────────────────────────────────────────

function EstadoVazio() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-[#0b0b0d] select-none">
      <div className="text-zinc-800/60">
        <MessageSquareIcon />
      </div>
      <div className="flex flex-col items-center gap-3">
        <GrowsorcioLogo height={26} />
        <p className="text-sm text-zinc-600 text-center leading-relaxed">
          Selecione uma conversa para<br />iniciar o atendimento
        </p>
      </div>
    </div>
  );
}

// ─── Chat Header ──────────────────────────────────────────────────────────────

function ChatHeader({ contato }) {
  const acoes = [
    { icon: <PhoneIcon />, label: 'Ligar' },
    { icon: <VideoIcon />, label: 'Videochamada' },
    { icon: <SearchIcon />, label: 'Buscar na conversa' },
    { icon: <MoreVertIcon />, label: 'Mais opções' },
  ];
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950 border-b border-white/5 flex-shrink-0">
      <div className="relative">
        <Avatar iniciais={contato.iniciais} cor={contato.corAvatar} size={40} />
        {contato.status === 'online' && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">{contato.nome}</p>
        <p className={`text-[11px] font-medium ${contato.status === 'online' ? 'text-emerald-400' : 'text-zinc-600'}`}>
          {contato.status === 'online' ? 'Online agora' : (contato.ultimaVisto || 'Offline')}
        </p>
      </div>
      <div className="flex items-center gap-0.5">
        {acoes.map(({ icon, label }) => (
          <button
            key={label}
            aria-label={label}
            title={label}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500
                       hover:text-zinc-200 hover:bg-zinc-800 transition-colors duration-150 cursor-pointer"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Input Area ───────────────────────────────────────────────────────────────

function InputArea({ onEnviar }) {
  const [texto, setTexto] = useState('');
  const textareaRef = useRef(null);
  const temTexto = texto.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [texto]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }
  function handleEnviar() {
    if (!temTexto) return;
    onEnviar(texto.trim());
    setTexto('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-zinc-950 border-t border-white/5 flex-shrink-0">
      <button
        aria-label="Emojis"
        title="Emojis"
        className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-500
                   hover:text-zinc-300 hover:bg-zinc-800 transition-colors duration-150 flex-shrink-0 mb-0.5 cursor-pointer"
      >
        <SmileIcon />
      </button>
      <button
        aria-label="Anexar arquivo"
        title="Anexar arquivo"
        className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-500
                   hover:text-zinc-300 hover:bg-zinc-800 transition-colors duration-150 flex-shrink-0 mb-0.5 cursor-pointer"
      >
        <PaperclipIcon />
      </button>

      {/* Textarea wrapper */}
      <div className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl px-4 py-2.5 flex items-end
                      focus-within:border-orange-500/20 focus-within:ring-1 focus-within:ring-orange-500/10 transition-all duration-150">
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escrever mensagem..."
          rows={1}
          aria-label="Campo de mensagem"
          className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none
                     outline-none leading-relaxed overflow-y-auto"
          style={{ maxHeight: 120, scrollbarWidth: 'none' }}
        />
      </div>

      {/* Mic → Send morph */}
      <button
        onClick={handleEnviar}
        aria-label={temTexto ? 'Enviar mensagem' : 'Gravar áudio'}
        title={temTexto ? 'Enviar mensagem' : 'Gravar áudio'}
        className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 mb-0.5
                    transition-all duration-200 cursor-pointer
                    ${temTexto
                      ? 'bg-orange-500 text-white hover:bg-orange-400'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                    }`}
      >
        <span
          className="transition-all duration-200"
          style={{
            opacity: 1,
            transform: temTexto ? 'rotate(0deg) scale(1)' : 'rotate(0deg) scale(1)',
          }}
        >
          {temTexto ? <SendIcon /> : <MicIcon />}
        </span>
      </button>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function Conversas() {
  const { hasFeature, loading: subLoading } = useSubscription();
  const [contatos, setContatos] = useState(MOCK_CONTATOS);
  const [ativoId, setAtivoId] = useState(null);
  const [busca, setBusca] = useState('');
  const mensagensRef = useRef(null);

  const contatoAtivo = contatos.find((c) => c.id === ativoId) || null;

  // Gate por plano
  if (!subLoading && !hasFeature('whatsapp')) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text">Conversas WhatsApp</h1>
          <p className="text-muted text-sm">Central de mensagens integrada ao seu WhatsApp</p>
        </div>
        <LockedFeature
          title="Conversas WhatsApp"
          plan="Pro"
        />
      </div>
    );
  }

  // Auto-scroll to latest message
  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [ativoId, contatoAtivo?.mensagens?.length]);

  const handleSelecionarConversa = useCallback((id) => {
    setAtivoId(id);
    setContatos((prev) =>
      prev.map((c) => c.id === id ? { ...c, naoLidas: 0 } : c)
    );
  }, []);

  const handleSendMessage = useCallback((texto) => {
    if (!ativoId) return;
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const novaMensagem = { id: Date.now(), texto, hora: agora, enviada: true, lida: false };
    setContatos((prev) =>
      prev.map((c) =>
        c.id === ativoId
          ? { ...c, mensagens: [...c.mensagens, novaMensagem], ultimaMensagem: texto, ultimaHora: agora }
          : c
      )
    );
  }, [ativoId]);

  const contatosFiltrados = contatos.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.ultimaMensagem.toLowerCase().includes(busca.toLowerCase())
  );

  const totalNaoLidas = contatos.reduce((sum, c) => sum + (c.naoLidas || 0), 0);

  return (
    <div className="h-full flex bg-zinc-950 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="w-[300px] min-w-[260px] flex-shrink-0 flex flex-col border-r border-white/5"
        aria-label="Lista de conversas"
      >
        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-sm font-bold text-zinc-100">Conversas</h1>
            {totalNaoLidas > 0 && (
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                {totalNaoLidas} nova{totalNaoLidas !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar conversa..."
              aria-label="Buscar conversa"
              className="w-full bg-zinc-900 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-200
                         placeholder-zinc-600 outline-none border border-transparent
                         focus:border-orange-500/20 focus:ring-1 focus:ring-orange-500/10
                         transition-all duration-150"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
          role="list"
          aria-label="Conversas"
        >
          {contatosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-zinc-700">
              <SearchIcon />
              <p className="text-xs">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            contatosFiltrados.map((c) => (
              <div key={c.id} role="listitem">
                <ConversaItem contato={c} ativa={c.id === ativoId} onClick={handleSelecionarConversa} />
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Chat Area ────────────────────────────────────────────── */}
      {contatoAtivo ? (
        <main className="flex-1 flex flex-col min-w-0" aria-label={`Conversa com ${contatoAtivo.nome}`}>
          <ChatHeader contato={contatoAtivo} />

          {/* Messages */}
          <div
            ref={mensagensRef}
            className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2 bg-[#0b0b0d]"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
            aria-live="polite"
            aria-label="Mensagens"
          >
            {contatoAtivo.mensagens.map((msg) => (
              <MensagemBalao key={msg.id} msg={msg} />
            ))}
          </div>

          <InputArea onEnviar={handleSendMessage} />
        </main>
      ) : (
        <EstadoVazio />
      )}
    </div>
  );
}
