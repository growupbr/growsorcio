import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Play,
  SkipBack,
  SkipForward,
  Download,
  FileText,
  BookOpen,
} from 'lucide-react';

// ─── Dados do Curso ───────────────────────────────────────────────────────────

const MODULOS = [
  {
    id: 1,
    titulo: 'Módulo 1: Briefing de Pré-Voo',
    aulas: [
      { id: '1-1', titulo: 'Protocolo de Entrada',       duracao: '08:32', concluida: true  },
      { id: '1-2', titulo: 'Como o Meta Ads funciona',   duracao: '14:20', concluida: false },
    ],
  },
  {
    id: 2,
    titulo: 'Módulo 2: Engenharia de Imagem',
    aulas: [
      { id: '2-1', titulo: 'Anatomia do Criativo',       duracao: '11:15', concluida: false },
      { id: '2-2', titulo: 'Criando com IA',             duracao: '09:48', concluida: false },
      { id: '2-3', titulo: 'Copy com IA',                duracao: '07:30', concluida: false },
    ],
  },
  {
    id: 3,
    titulo: 'Módulo 3: Base de Lançamento',
    aulas: [
      { id: '3-1', titulo: 'Setup da Base Meta',         duracao: '16:05', concluida: false },
      { id: '3-2', titulo: 'Instalando o Pixel',         duracao: '12:40', concluida: false },
      { id: '3-3', titulo: 'Checklist de Lançamento',    duracao: '06:18', concluida: false },
    ],
  },
  {
    id: 4,
    titulo: 'Módulo 4: Sistemas de Navegação',
    aulas: [
      { id: '4-1', titulo: 'Escudo Defletor',            duracao: '10:55', concluida: false },
      { id: '4-2', titulo: 'Formulário Condicional',     duracao: '13:22', concluida: false },
      { id: '4-3', titulo: 'Planilha de Controle',       duracao: '08:00', concluida: false },
      { id: '4-4', titulo: 'Growsorcio — Sistema CRM',  duracao: '15:10', concluida: false },
    ],
  },
  {
    id: 5,
    titulo: 'Módulo 5: Escala Global',
    aulas: [
      { id: '5-1', titulo: 'Subindo o Anúncio',          duracao: '11:48', concluida: false },
      { id: '5-2', titulo: 'Lendo os Resultados',        duracao: '09:33', concluida: false },
      { id: '5-3', titulo: 'Velocidade de Dobra',        duracao: '14:07', concluida: false },
    ],
  },
];

// Flat list de todas as aulas em ordem
const ALL_AULAS = MODULOS.flatMap((m) =>
  m.aulas.map((a) => ({ ...a, moduloId: m.id, moduloTitulo: m.titulo }))
);

// Inicialmente concluídas = as que têm concluida: true no mock
const INITIAL_CONCLUIDAS = new Set(
  ALL_AULAS.filter((a) => a.concluida).map((a) => a.id)
);

// Materiais por aula (mock)
const MATERIAIS = {
  '1-1': [{ nome: 'Script de Entrada.pdf', tamanho: '340 KB' }],
  '1-2': [{ nome: 'Como o Meta Ads Funciona.pdf', tamanho: '1.2 MB' }],
  '2-1': [{ nome: 'Anatomia do Criativo.pdf', tamanho: '890 KB' }],
  '2-2': [{ nome: 'Prompt Pack IA — Criativos.pdf', tamanho: '210 KB' }],
  '2-3': [{ nome: 'Prompt Pack IA — Copy.pdf', tamanho: '195 KB' }],
  '3-1': [{ nome: 'Checklist Setup Meta Ads.pdf', tamanho: '156 KB' }],
  '3-3': [{ nome: 'Checklist de Lançamento.pdf', tamanho: '128 KB' }],
  '4-2': [{ nome: 'Formulário Condicional — Template.pdf', tamanho: '450 KB' }],
  '4-3': [{ nome: 'Planilha de Controle TEC 2.0.xlsx', tamanho: '89 KB' }],
  '5-2': [{ nome: 'Guia de Leitura de Resultados.pdf', tamanho: '670 KB' }],
};

// ─── Descrições de Visão Geral (mock) ────────────────────────────────────────

const OVERVIEW = {
  '1-1': 'Nesta aula você aprenderá o protocolo de entrada utilizado pelos top corretores de consórcio de alta performance. Entenda como se posicionar, o que dizer desde o primeiro contato e como criar autoridade imediata antes mesmo de apresentar qualquer produto.',
  '1-2': 'Descubra como o Meta Ads funciona por baixo dos panos: leilão de anúncios, score de relevância, objetivo de campanha e como o algoritmo decide quem vê o seu anúncio. Com essa base sólida, cada decisão da sua campanha será estratégica, não por tentativa e erro.',
  'default': 'Nesta aula você aprenderá técnicas avançadas aplicadas por corretores de consórcio de alto desempenho no mercado digital. Assista ao vídeo completo e acesse os materiais de apoio para reforçar o aprendizado.',
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function ProgressBar({ value, className = '' }) {
  return (
    <div className={`h-1 bg-zinc-700/60 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-orange-500 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function TreinamentoAula() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Determina a aula inicial a partir do state de navegação ─────────────────
  // Quando o usuário clica em um módulo na página /treinamento, recebemos:
  //   location.state = { moduloId: number, aulaId: string | null }
  const initialLessonId = useMemo(() => {
    const { moduloId, aulaId } = location.state ?? {};
    if (aulaId && ALL_AULAS.some((a) => a.id === aulaId)) return aulaId;
    if (moduloId) {
      const firstAula = ALL_AULAS.find((a) => a.moduloId === moduloId);
      if (firstAula) return firstAula.id;
    }
    return '1-2'; // fallback: última aula assistida (mock)
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [activeLessonId, setActiveLessonId]   = useState(initialLessonId);
  const [expandedModules, setExpandedModules] = useState(() => {
    // Expande automaticamente o módulo da aula inicial
    const aula = ALL_AULAS.find((a) => a.id === initialLessonId);
    return new Set(aula ? [aula.moduloId] : [1, 2]);
  });
  const [completedLessons, setCompletedLessons] = useState(INITIAL_CONCLUIDAS);
  const [activeTab, setActiveTab]             = useState('overview');

  // ── Derivados ───────────────────────────────────────────────────────────────
  const activeLesson = useMemo(
    () => ALL_AULAS.find((a) => a.id === activeLessonId) ?? ALL_AULAS[0],
    [activeLessonId]
  );

  const activeIndex = ALL_AULAS.findIndex((a) => a.id === activeLessonId);
  const prevLesson  = activeIndex > 0 ? ALL_AULAS[activeIndex - 1] : null;
  const nextLesson  = activeIndex < ALL_AULAS.length - 1 ? ALL_AULAS[activeIndex + 1] : null;

  const totalAulas    = ALL_AULAS.length;
  const totalConcluidas = completedLessons.size;
  const progressoPct  = Math.round((totalConcluidas / totalAulas) * 100);
  const isConcluida   = completedLessons.has(activeLessonId);

  const materiais = MATERIAIS[activeLessonId] ?? [];
  const overview  = OVERVIEW[activeLessonId] ?? OVERVIEW['default'];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const goToLesson = useCallback((id) => {
    setActiveLessonId(id);
    setActiveTab('overview');
    // Auto-expande o módulo da aula selecionada
    const aula = ALL_AULAS.find((a) => a.id === id);
    if (aula) {
      setExpandedModules((prev) => {
        const next = new Set(prev);
        next.add(aula.moduloId);
        return next;
      });
    }
  }, []);

  const toggleModule = useCallback((id) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleConcluida = useCallback(() => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      next.has(activeLessonId) ? next.delete(activeLessonId) : next.add(activeLessonId);
      return next;
    });
  }, [activeLessonId]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] text-white">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 lg:px-8 py-4 border-b border-white/5">
        <button
          onClick={() => navigate('/treinamento')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium py-2 pr-3 rounded-lg hover:bg-zinc-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-label="Voltar para Módulos"
        >
          <ArrowLeft size={16} />
          Voltar para Módulos
        </button>
        <span className="text-zinc-700 hidden sm:block">•</span>
        <span className="text-zinc-500 text-sm truncate hidden sm:block">
          {activeLesson.moduloTitulo}
        </span>
      </div>

      {/* ── Conteúdo Principal ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 px-4 lg:px-8 py-6 pb-16">

        {/* ════════════════════════════════════════════════════════════════════
            COLUNA PRINCIPAL — Vídeo + Controles + Info (2 colunas no desktop)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Player */}
          <div className="aspect-video w-full bg-black rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl shadow-orange-500/5">
            {/* Gradiente de fundo decorativo */}
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
            {/* Glow central */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 bg-orange-500/5 rounded-full blur-3xl" />
            </div>
            {/* Botão Play placeholder */}
            <button
              className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/90 hover:bg-orange-400 active:bg-orange-600 transition-all duration-200 shadow-2xl shadow-orange-500/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/50 group"
              aria-label="Reproduzir aula"
            >
              <Play size={32} fill="white" className="text-white ml-1 group-hover:scale-110 transition-transform duration-200" />
            </button>
            {/* Duração no canto */}
            <span className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-zinc-300 text-xs font-mono px-2 py-1 rounded-md">
              {activeLesson.duracao}
            </span>
          </div>

          {/* Controles inferiores */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Navegação anterior / próxima */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => prevLesson && goToLesson(prevLesson.id)}
                disabled={!prevLesson}
                title={prevLesson ? `← ${prevLesson.titulo}` : 'Primeira aula'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <SkipBack size={15} />
                <span className="hidden sm:inline">Aula Anterior</span>
              </button>
              <button
                onClick={() => nextLesson && goToLesson(nextLesson.id)}
                disabled={!nextLesson}
                title={nextLesson ? `→ ${nextLesson.titulo}` : 'Última aula'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span className="hidden sm:inline">Próxima Aula</span>
                <SkipForward size={15} />
              </button>
            </div>

            {/* Marcar como concluída */}
            <button
              onClick={toggleConcluida}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isConcluida
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
              }`}
            >
              <CheckCircle size={16} className={isConcluida ? 'text-emerald-400' : 'text-orange-400'} />
              {isConcluida ? 'Concluída ✓' : 'Marcar como Concluída'}
            </button>
          </div>

          {/* Header da Aula */}
          <div className="border-b border-white/5 pb-5">
            <p className="text-orange-500 font-medium text-sm mb-1.5">
              {activeLesson.moduloTitulo}
            </p>
            <h1 className="text-2xl font-bold text-white leading-tight">
              {activeLesson.titulo}
            </h1>
          </div>

          {/* Tabs */}
          <div>
            {/* Tab headers */}
            <div className="flex items-center gap-1 border-b border-white/5 mb-5">
              {[
                { id: 'overview',   label: 'Visão Geral', icon: BookOpen  },
                { id: 'materials',  label: 'Materiais de Apoio', icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 -mb-px ${
                    activeTab === id
                      ? 'border-orange-500 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  {id === 'materials' && materiais.length > 0 && (
                    <span className="bg-orange-500/20 text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {materiais.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content — Visão Geral */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <p className="text-zinc-300 text-base leading-relaxed">
                  {overview}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Duração',   valor: activeLesson.duracao },
                    { label: 'Módulo',    valor: `Módulo ${activeLesson.moduloId}` },
                    { label: 'Status',    valor: isConcluida ? '✓ Concluída' : 'Em andamento' },
                  ].map(({ label, valor }) => (
                    <div key={label} className="bg-zinc-900/60 border border-white/5 rounded-xl px-4 py-3">
                      <p className="text-zinc-500 text-xs mb-1">{label}</p>
                      <p className="text-white text-sm font-semibold">{valor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab content — Materiais */}
            {activeTab === 'materials' && (
              <div className="space-y-3">
                {materiais.length === 0 ? (
                  <p className="text-zinc-500 text-sm py-4">
                    Nenhum material disponível para esta aula.
                  </p>
                ) : (
                  materiais.map((mat) => (
                    <div
                      key={mat.nome}
                      className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-9 h-9 bg-orange-500/10 rounded-lg flex-shrink-0">
                          <FileText size={16} className="text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{mat.nome}</p>
                          <p className="text-zinc-500 text-xs">{mat.tamanho}</p>
                        </div>
                      </div>
                      <button
                        className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 ml-4 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
                        aria-label={`Baixar ${mat.nome}`}
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Baixar</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            COLUNA LATERAL — Playlist / Accordion
            ══════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 bg-[#121215] border border-white/5 rounded-2xl p-4">

            {/* Header playlist */}
            <div className="mb-4">
              <h2 className="text-sm font-bold text-white mb-2">
                Conteúdo do Treinamento
              </h2>
              <div className="flex items-center gap-2 mb-1">
                <ProgressBar value={progressoPct} className="flex-1" />
                <span className="text-xs font-bold text-orange-400 tabular-nums w-8 text-right">
                  {progressoPct}%
                </span>
              </div>
              <p className="text-zinc-600 text-xs">
                {totalConcluidas} de {totalAulas} aulas concluídas
              </p>
            </div>

            {/* Accordion de módulos */}
            <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 -mr-1">
              {MODULOS.map((modulo) => {
                const isExpanded = expandedModules.has(modulo.id);
                const concluidasNoModulo = modulo.aulas.filter((a) =>
                  completedLessons.has(a.id)
                ).length;

                return (
                  <div key={modulo.id} className="rounded-xl overflow-hidden">
                    {/* Cabeçalho do módulo */}
                    <button
                      onClick={() => toggleModule(modulo.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800/50 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-bold text-white truncate">
                          {modulo.titulo}
                        </p>
                        <p className="text-zinc-600 text-[10px] mt-0.5">
                          {concluidasNoModulo}/{modulo.aulas.length} aulas
                        </p>
                      </div>
                      {isExpanded
                        ? <ChevronDown size={14} className="text-zinc-500 flex-shrink-0" />
                        : <ChevronRight size={14} className="text-zinc-500 flex-shrink-0" />
                      }
                    </button>

                    {/* Aulas do módulo */}
                    {isExpanded && (
                      <div className="mt-0.5 space-y-0.5">
                        {modulo.aulas.map((aula) => {
                          const isActive    = aula.id === activeLessonId;
                          const isConcl     = completedLessons.has(aula.id);

                          return (
                            <button
                              key={aula.id}
                              onClick={() => goToLesson(aula.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 border-l-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                                isActive
                                  ? 'bg-orange-500/10 border-orange-500'
                                  : 'border-transparent hover:bg-zinc-800/40'
                              }`}
                            >
                              {/* Ícone status */}
                              {isConcl ? (
                                <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                              ) : (
                                <PlayCircle
                                  size={15}
                                  className={`flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-zinc-600'}`}
                                />
                              )}

                              {/* Texto */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate leading-tight ${
                                  isActive ? 'text-orange-300' : 'text-zinc-300'
                                }`}>
                                  {aula.titulo}
                                </p>
                                <p className="text-zinc-600 text-[10px] mt-0.5 font-mono">
                                  {aula.duracao}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
