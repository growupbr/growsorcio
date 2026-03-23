import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import QuickAddModal from '../components/QuickAddModal';
import WelcomeModal, { shouldShowWelcome } from '../components/WelcomeModal';
import { api } from '../api/client';
import { ETAPAS_SEM_ANUNCIO as ETAPAS_ORDEM } from '../constants/etapas';

// Recharts isolado — baixado só quando o Dashboard renderizar
const DashboardCharts = lazy(() => import('../components/DashboardCharts'));

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODOS = [
  { id: 'hoje',   label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'total',  label: 'Total' },
];

const TEMP_COLORS = { quente: '#ef4444', morno: '#f59e0b', frio: '#3b82f6' };
const TEMP_LABELS  = { quente: 'Quente', morno: 'Morno', frio: 'Frio' };

// Orange-spectrum — mantido aqui apenas para ETAPAS_ORDEM (sem recharts)

function formatarData(str) {
  if (!str) return '—';
  const [a, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const Icons = {
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  TrendUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Sk({ className }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: '#27272a' }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-8 w-44" />
          <Sk className="h-4 w-64" />
        </div>
        <Sk className="h-9 w-32" />
      </div>
      <Sk className="h-11 w-72" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <Sk key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Sk key={i} className="h-40" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Sk className="h-72 lg:col-span-2" />
        <Sk className="h-72" />
      </div>
      <Sk className="h-64" />
    </div>
  );
}

// ─── Tooltip dos gráficos ─────────────────────────────────────────────────────
// (movido para DashboardCharts.jsx)

// ─── Card de Métrica KPI ──────────────────────────────────────────────────────

function MetricaCard({ label, valor, sub, destaque, icon: Icon }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-150 cursor-default"
      style={{
        background: destaque
          ? 'linear-gradient(135deg, rgba(255,69,0,0.12) 0%, #18181b 70%)'
          : '#18181b',
        border: `1px solid ${destaque ? 'rgba(255,69,0,0.32)' : '#3f3f46'}`,
      }}
    >
      {/* Label */}
      <p style={{ fontSize: 11, letterSpacing: '0.1em', color: '#a1a1aa', fontWeight: 600 }}
         className="uppercase mb-4">
        {label}
      </p>

      {/* Valor */}
      <p
        className="tabular-nums leading-none"
        style={{ fontSize: 36, fontWeight: 800, color: destaque ? '#FF4500' : '#f4f4f5' }}
      >
        {valor}
      </p>

      {/* Sub */}
      {sub && (
        <p className="mt-2 text-xs font-medium" style={{ color: '#a1a1aa' }}>{sub}</p>
      )}

      {/* Ícone */}
      {Icon && (
        <div
          className="absolute top-5 right-5 p-2.5 rounded-lg"
          style={{
            background: destaque ? 'rgba(255,69,0,0.15)' : 'rgba(255,69,0,0.08)',
            color: '#FF4500',
          }}
        >
          <Icon />
        </div>
      )}

      {/* Glow sutil no destaque */}
      {destaque && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 40px rgba(255,69,0,0.04)' }}
        />
      )}
    </div>
  );
}

// ─── Alertas do dia ───────────────────────────────────────────────────────────

function AlertaSection({ followUps, cadencias, reunioes }) {
  const total = followUps.length + cadencias.length + reunioes.length;

  if (total === 0) {
    return (
      <div
        className="rounded-xl px-5 py-4 flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, #09090b 0%, #09090b 100%)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
        >
          <Icons.Check />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>Tudo em dia</p>
          <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>Nenhum alerta para hoje.</p>
        </div>
      </div>
    );
  }

  const AlertCard = ({ title, icon: Icon, items, colorKey }) => {
    const colors = {
      red:    { text: '#f87171', bg: 'rgba(255,69,0,0.08)',    border: 'rgba(255,69,0,0.28)',   badge: 'rgba(255,69,0,0.15)',   left: '#FF4500' },
      yellow: { text: '#fbbf24', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.28)', badge: 'rgba(245,158,11,0.15)', left: '#f59e0b' },
      blue:   { text: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.28)', badge: 'rgba(59,130,246,0.15)', left: '#3b82f6' },
    };
    const c = colors[colorKey];
    return (
      <div
        className="rounded-xl p-4"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: c.text }}><Icon /></span>
          <p className="text-sm font-semibold" style={{ color: c.text }}>{title}</p>
          <span
            className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: c.badge, color: c.text }}
          >
            {items.length}
          </span>
        </div>
        <div className="space-y-1">
          {items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
              style={{ borderLeft: `2px solid ${c.left}` }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#f4f4f5' }}>
                  {item.nome || item.lead_nome}
                </p>
                {item.etapa_funil && (
                  <p className="text-xs truncate" style={{ color: '#a1a1aa' }}>{item.etapa_funil}</p>
                )}
                {item.descricao && (
                  <p className="text-xs truncate" style={{ color: '#a1a1aa' }}>{item.descricao}</p>
                )}
              </div>
              {item.data_proxima_acao && (
                <span className="text-xs font-medium ml-3 flex-shrink-0" style={{ color: c.text }}>
                  {formatarData(item.data_proxima_acao)}
                </span>
              )}
            </div>
          ))}
          {items.length > 4 && (
            <p className="text-xs pt-1 pl-2" style={{ color: '#71717a' }}>+{items.length - 4} mais</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {followUps.length > 0 && (
        <AlertCard title="Follow-ups vencidos" icon={Icons.Alert} items={followUps} colorKey="red" />
      )}
      {cadencias.length > 0 && (
        <AlertCard title="Cadência hoje" icon={Icons.Clock} items={cadencias} colorKey="yellow" />
      )}
      {reunioes.length > 0 && (
        <AlertCard title="Reuniões hoje" icon={Icons.Calendar} items={reunioes} colorKey="blue" />
      )}
    </div>
  );
}

// ─── Funil de conversão ───────────────────────────────────────────────────────
// (movido para DashboardCharts.jsx)

// ─── Dashboard Principal ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome);
  const [stats, setStats] = useState(null);
  const [evolucao, setEvolucao] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [periodo, setPeriodo] = useState('total');

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [s, e] = await Promise.all([api.resumoStats(periodo), api.evolucaoLeads()]);
      setStats(s);
      setEvolucao(e);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, [periodo]);

  useEffect(() => { carregar(); }, [carregar]);

  if (erro) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
        >
          <Icons.Alert />
        </div>
        <p className="font-semibold mb-2" style={{ color: '#f87171' }}>Erro ao carregar o dashboard</p>
        <p className="text-sm mb-6" style={{ color: '#a1a1aa' }}>{erro}</p>
        <pre
          className="text-xs text-left rounded-xl p-4"
          style={{ background: '#09090b', border: '1px solid #27272a', color: '#a1a1aa' }}
        >
{`cd backend
cp .env.example .env  # se ainda não existir
# preencher SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
npm run dev`}
        </pre>
      </div>
    );
  }

  if (carregando) return <DashboardSkeleton />;
  if (!stats) return null;

  // ── Dados processados ──
  const totalPorEtapa = Object.fromEntries(
    (stats.por_etapa_total || stats.por_etapa).map((e) => [e.etapa_funil, e.total])
  );
  const totalPorEtapaPeriodo = Object.fromEntries(
    stats.por_etapa.map((e) => [e.etapa_funil, e.total])
  );
  const totalPorTemp = Object.fromEntries(
    (stats.por_temperatura_total || stats.por_temperatura).map((t) => [t.temperatura, t.total])
  );

  const totalGeral = Object.values(totalPorEtapa).reduce((s, v) => s + v, 0);
  const totalAtivos = totalGeral - (totalPorEtapa['Fechado'] || 0) - (totalPorEtapa['Perdido'] || 0);
  const totalPeriodo = Object.values(totalPorEtapaPeriodo).reduce((s, v) => s + v, 0);

  const seguiu  = totalPorEtapa['Seguiu Perfil'] || 0;
  const fechado = totalPorEtapa['Fechado'] || 0;
  const taxaGlobal = seguiu > 0 ? ((fechado / seguiu) * 100).toFixed(1) : null;

  // Métricas de origem
  const totalAnuncio = stats.total_anuncio || 0;
  const totalProspeccao = (stats.por_origem || []).find(o => o.origem === 'prospeccao')?.total || 0;
  const taxaResposta = stats.taxa_resposta_anuncio || 0;
  const reunioesAnuncio = (stats.reunioes_por_origem || []).find(o => o.origem === 'anuncio')?.total || 0;
  const reunioesProspeccao = (stats.reunioes_por_origem || []).find(o => o.origem === 'prospeccao')?.total || 0;

  const metricasPeriodo = [
    { label: 'Leads no período', valor: totalPeriodo, icon: Icons.Users, destaque: true },
    { label: 'Reuniões agendadas', valor: totalPorEtapa['Reunião Agendada'] || 0, icon: Icons.Calendar },
    { label: 'Reuniões realizadas', valor: totalPorEtapa['Reunião Realizada'] || 0, icon: Icons.Calendar },
    { label: 'Propostas enviadas', valor: totalPorEtapa['Proposta Enviada'] || 0, icon: Icons.TrendUp },
    { label: 'Fechamentos', valor: fechado, icon: Icons.Check },
    { label: 'Total de leads', valor: totalGeral, sub: `${totalAtivos} ativos`, icon: Icons.Target },
  ];

  const dadosBarras = ETAPAS_ORDEM
    .filter((e) => e !== 'Fechado' && e !== 'Perdido')
    .map((e) => ({
      etapa: e.length > 13 ? e.slice(0, 12) + '…' : e,
      total: totalPorEtapa[e] || 0,
    }));

  const dadosPizza = ['quente', 'morno', 'frio']
    .map((t) => ({ name: TEMP_LABELS[t], value: totalPorTemp[t] || 0, color: TEMP_COLORS[t] }))
    .filter((d) => d.value > 0);

  const totalAlertas = stats.follow_ups_vencidos.length + stats.cadencia_hoje.length + stats.reunioes_hoje.length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-extrabold leading-tight" style={{ fontSize: 28, color: '#f4f4f5' }}>
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#a1a1aa' }}>
            {taxaGlobal
              ? <>Taxa de conversão global: <span style={{ color: '#FF4500', fontWeight: 600 }}>{taxaGlobal}%</span> · Seguiu → Fechado</>
              : 'Visão geral do funil de vendas'
            }
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Icons.Plus /> Novo lead
        </button>
      </div>

      {/* ── Seletor de período ── */}
      <div className="period-selector">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={`period-btn ${periodo === p.id ? 'period-btn-active' : 'period-btn-inactive'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── KPI Cards — grid 3×2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metricasPeriodo.map((m) => (
          <MetricaCard key={m.label} {...m} />
        ))}
      </div>

      {/* ── Origem dos Leads ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="uppercase text-xs font-semibold tracking-widest mb-3" style={{color:'#a1a1aa'}}>Leads Anúncio</p>
          <p className="text-3xl font-extrabold tabular-nums" style={{color:'#8B5CF6'}}>{totalAnuncio}</p>
          <p className="text-xs mt-1" style={{color:'#a1a1aa'}}>{totalAnuncio > 0 ? `${taxaResposta}% responderam` : '—'}</p>
        </div>
        <div className="card p-5">
          <p className="uppercase text-xs font-semibold tracking-widest mb-3" style={{color:'#a1a1aa'}}>Prospecção</p>
          <p className="text-3xl font-extrabold tabular-nums" style={{color:'#FF4500'}}>{totalProspeccao}</p>
          <p className="text-xs mt-1" style={{color:'#a1a1aa'}}>orgânico + indicação</p>
        </div>
        <div className="card p-5">
          <p className="uppercase text-xs font-semibold tracking-widest mb-3" style={{color:'#a1a1aa'}}>Reuniões Anúncio</p>
          <p className="text-3xl font-extrabold tabular-nums" style={{color:'#8B5CF6'}}>{reunioesAnuncio}</p>
          <p className="text-xs mt-1" style={{color:'#a1a1aa'}}>{totalAnuncio > 0 ? `${Math.round((reunioesAnuncio/totalAnuncio)*100)}% de conv.` : '—'}</p>
        </div>
        <div className="card p-5">
          <p className="uppercase text-xs font-semibold tracking-widest mb-3" style={{color:'#a1a1aa'}}>Reuniões Prospecção</p>
          <p className="text-3xl font-extrabold tabular-nums" style={{color:'#FF4500'}}>{reunioesProspeccao}</p>
          <p className="text-xs mt-1" style={{color:'#a1a1aa'}}>{totalProspeccao > 0 ? `${Math.round((reunioesProspeccao/totalProspeccao)*100)}% de conv.` : '—'}</p>
        </div>
      </div>

      {/* ── Alertas do dia ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="section-label">Alertas do dia</span>
          {totalAlertas > 0 && (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
            >
              {totalAlertas}
            </span>
          )}
        </div>
        <AlertaSection
          followUps={stats.follow_ups_vencidos}
          cadencias={stats.cadencia_hoje}
          reunioes={stats.reunioes_hoje}
        />
      </div>

      {/* ── Gráficos: Barras + Pizza + Funil + Evolução (lazy) ── */}

      {showModal && (
        <QuickAddModal onClose={() => setShowModal(false)} onCriado={() => carregar()} />
      )}

      {showWelcome && (
        <WelcomeModal onClose={() => setShowWelcome(false)} />
      )}

      {/* Recharts: barras + pizza + funil + área — só carrega com este chunk */}
      <Suspense fallback={<div className="h-32" />}>
        <DashboardCharts
          dadosBarras={dadosBarras}
          dadosPizza={dadosPizza}
          evolucao={evolucao}
          totalPorEtapa={totalPorEtapa}
        />
      </Suspense>

    </div>
  );
}
