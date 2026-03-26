import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import QuickAddModal from '../components/QuickAddModal';
import WelcomeModal, { shouldShowWelcome } from '../components/WelcomeModal';
import { api } from '../api/client';
import { ETAPAS_SEM_ANUNCIO as ETAPAS_ORDEM } from '../constants/etapas';
import Icons from '../components/Icons';
import MetricaCard from '../components/MetricaCard';
import OrigemCard from '../components/OrigemCard';

// Recharts isolado — baixado só quando o Dashboard renderizar
const DashboardCharts = lazy(() => import('../components/DashboardCharts'));
const RelatoriosCharts = lazy(() => import('../components/RelatoriosCharts'));

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODOS = [
  { id: 'hoje',   label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'total',  label: 'Total' },
];

const TEMP_COLORS = { quente: '#ef4444', morno: '#f59e0b', frio: '#3b82f6' };
const TEMP_LABELS  = { quente: 'Quente', morno: 'Morno', frio: 'Frio' };

const LABEL_PERIODO = {
  hoje:   'ontem',
  semana: 'semana passada',
  mes:    'mês passado',
};

// Orange-spectrum — mantido aqui apenas para ETAPAS_ORDEM (sem recharts)

function formatarData(str) {
  if (!str) return '—';
  const [a, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <Sk key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Sk key={i} className="h-24" />)}
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
  const [tab, setTab] = useState('visao'); // 'visao' | 'relatorios'
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState('');
  const [relTab, setRelTab] = useState('charts'); // 'charts' | 'tabela'

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

  // Carrega leads apenas quando tab relatórios é ativada
  useEffect(() => {
    if (tab !== 'relatorios' || leads.length > 0) return;
    setLoadingLeads(true);
    api.listarLeads({})
      .then((data) => setLeads(Array.isArray(data) ? data : (data?.leads || [])))
      .catch(() => {})
      .finally(() => setLoadingLeads(false));
  }, [tab]);

  const handleExportar = useCallback(async () => {
    setExportando(true);
    setErroExport('');
    try { await api.exportarCSV(); }
    catch (e) { setErroExport(e.message || 'Erro ao exportar'); }
    finally { setExportando(false); }
  }, []);

  // ── Dados processados (todos os hooks ANTES de qualquer early return) ──
  const totalPorEtapa = useMemo(() => {
    if (!stats) return {};
    return Object.fromEntries(
      (stats.por_etapa_total || stats.por_etapa).map((e) => [e.etapa_funil, e.total])
    );
  }, [stats]);
  const totalPorEtapaPeriodo = useMemo(() => {
    if (!stats) return {};
    return Object.fromEntries(stats.por_etapa.map((e) => [e.etapa_funil, e.total]));
  }, [stats]);
  const totalPorTemp = useMemo(() => {
    if (!stats) return {};
    return Object.fromEntries(
      (stats.por_temperatura_total || stats.por_temperatura).map((t) => [t.temperatura, t.total])
    );
  }, [stats]);

  const totalGeral = useMemo(() => Object.values(totalPorEtapa).reduce((s, v) => s + v, 0), [totalPorEtapa]);
  const totalPeriodo = useMemo(() => Object.values(totalPorEtapaPeriodo).reduce((s, v) => s + v, 0), [totalPorEtapaPeriodo]);

  const totalAtivos = totalGeral - (totalPorEtapa['Fechado'] || 0) - (totalPorEtapa['Perdido'] || 0);
  const seguiu  = totalPorEtapa['Seguiu Perfil'] || 0;
  const fechado = totalPorEtapa['Fechado'] || 0;
  const taxaGlobal = seguiu > 0 ? ((fechado / seguiu) * 100).toFixed(1) : null;

  // Métricas de origem
  const totalAnuncio = stats?.total_anuncio || 0;
  const totalProspeccao = (stats?.por_origem || []).find(o => o.origem === 'prospeccao')?.total || 0;
  const taxaResposta = stats?.taxa_resposta_anuncio || 0;
  const reunioesAnuncio = (stats?.reunioes_por_origem || []).find(o => o.origem === 'anuncio')?.total || 0;
  const reunioesProspeccao = (stats?.reunioes_por_origem || []).find(o => o.origem === 'prospeccao')?.total || 0;

  const metricasPeriodo = useMemo(() => {
    const etapaAnterior = Object.fromEntries(
      (stats?.por_etapa_anterior || []).map((e) => [e.etapa_funil, e.total])
    );
    const totalPeriodoAnterior = Object.values(etapaAnterior).reduce((s, v) => s + v, 0);
    const fechadoAnterior = etapaAnterior['Fechado'] || 0;

    function calcDelta(atual, anterior) {
      if (!stats?.por_etapa_anterior || anterior === 0) return null;
      return Math.round(((atual - anterior) / anterior) * 100);
    }

    return [
      { label: 'Leads no período', valor: totalPeriodo, icon: Icons.Users, destaque: true, delta: calcDelta(totalPeriodo, totalPeriodoAnterior) },
      { label: 'Reuniões agendadas', valor: totalPorEtapa['Reunião Agendada'] || 0, icon: Icons.Calendar, delta: calcDelta(totalPorEtapa['Reunião Agendada'] || 0, etapaAnterior['Reunião Agendada'] || 0) },
      { label: 'Reuniões realizadas', valor: totalPorEtapa['Reunião Realizada'] || 0, icon: Icons.Calendar, delta: calcDelta(totalPorEtapa['Reunião Realizada'] || 0, etapaAnterior['Reunião Realizada'] || 0) },
      { label: 'Propostas enviadas', valor: totalPorEtapa['Proposta Enviada'] || 0, icon: Icons.TrendUp, delta: calcDelta(totalPorEtapa['Proposta Enviada'] || 0, etapaAnterior['Proposta Enviada'] || 0) },
      { label: 'Fechamentos', valor: fechado, icon: Icons.Check, delta: calcDelta(fechado, fechadoAnterior) },
      { label: 'Total de leads', valor: totalGeral, sub: `${totalAtivos} ativos`, icon: Icons.Target },
    ];
  }, [totalPeriodo, totalPorEtapa, fechado, totalGeral, totalAtivos, stats]);

  const dadosBarras = useMemo(() => ETAPAS_ORDEM
    .filter((e) => e !== 'Fechado' && e !== 'Perdido')
    .map((e) => ({
      etapa: e,
      total: totalPorEtapa[e] || 0,
    })), [totalPorEtapa]);

  const dadosPizza = useMemo(() => ['quente', 'morno', 'frio']
    .map((t) => ({ name: TEMP_LABELS[t], value: totalPorTemp[t] || 0, color: TEMP_COLORS[t] }))
    .filter((d) => d.value > 0), [totalPorTemp]);

  const totalAlertas = (stats?.follow_ups_vencidos?.length || 0) + (stats?.cadencia_hoje?.length || 0) + (stats?.reunioes_hoje?.length || 0);

  // ── Dados relatórios ──
  const dadosEtapa = useMemo(() => (stats?.por_etapa || []).sort((a, b) => b.total - a.total), [stats]);
  const dadosOrigem = useMemo(() => (stats?.por_origem || []).map((r) => ({
    name: r.origem === 'anuncio' ? 'Anúncio' : r.origem === 'prospeccao' ? 'Prospecção' : r.origem,
    value: r.total,
  })), [stats]);
  const dadosTipoBem = useMemo(() => (stats?.por_tipo_bem || []).sort((a, b) => b.total - a.total).slice(0, 8), [stats]);
  const dadosMotivos = useMemo(() => leads
    .filter((l) => l.motivo_descarte)
    .reduce((acc, l) => {
      const m = l.motivo_descarte;
      const f = acc.find((x) => x.motivo === m);
      if (f) f.total++; else acc.push({ motivo: m, total: 1 });
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total), [leads]);

  const { totalLeadsRel, fechadosRel, perdidosRel, taxaConversaoRel, qtTemp } = useMemo(() => {
    const total = leads.length;
    const fechados = leads.filter((l) => l.etapa_funil === 'Fechado').length;
    const perdidos = leads.filter((l) => l.etapa_funil === 'Perdido').length;
    const qt = { quente: 0, morno: 0, frio: 0 };
    leads.forEach((l) => { if (l.temperatura in qt) qt[l.temperatura]++; });
    return {
      totalLeadsRel: total,
      fechadosRel: fechados,
      perdidosRel: perdidos,
      taxaConversaoRel: total > 0 ? Math.round((fechados / total) * 100) : 0,
      qtTemp: qt,
    };
  }, [leads]);

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

      {/* ══════════ HEADER ══════════ */}
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
        <div className="flex items-center gap-3">
          {tab === 'relatorios' && (
            <button
              onClick={handleExportar}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,69,0,0.08))',
                border: '1px solid rgba(255,69,0,0.25)',
                color: '#FF4500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FF4500, #e03d00)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,69,0,0.08))';
                e.currentTarget.style.color = '#FF4500';
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              {exportando ? 'Exportando...' : 'Exportar CSV'}
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Icons.Plus /> Novo lead
          </button>
        </div>
      </div>

      {/* ══════════ TABS + PERÍODO ══════════ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Tabs elegantes */}
        <div
          className="flex items-center rounded-2xl p-1 gap-0.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { id: 'visao', label: 'Visão Geral', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            )},
            { id: 'relatorios', label: 'Relatórios', icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
              </svg>
            )},
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer"
              style={tab === t.id ? {
                background: 'linear-gradient(135deg, #FF4500, #e03d00)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(255,69,0,0.25)',
              } : { color: '#71717a' }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Período */}
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
      </div>

      {erroExport && (
        <div className="px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          {erroExport}
        </div>
      )}

      {/* ══════════ TAB: VISÃO GERAL ══════════ */}
      {tab === 'visao' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          {/* Nota comparativa do período */}
          {periodo !== 'total' && stats?.por_etapa_anterior && (
            <p className="-mb-4 text-xs flex items-center gap-1.5" style={{ color: '#52525b' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                <polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" />
              </svg>
              Badges % comparados com {LABEL_PERIODO[periodo]}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {metricasPeriodo.map((m) => (
              <MetricaCard key={m.label} {...m} />
            ))}
          </div>

          {/* Origem dos Leads */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <OrigemCard label="Leads Anúncio" valor={totalAnuncio} sub={totalAnuncio > 0 ? `${taxaResposta}% responderam` : '—'} cor="#8B5CF6" icon={Icons.Megaphone} />
            <OrigemCard label="Prospecção" valor={totalProspeccao} sub="orgânico + indicação" cor="#FF4500" icon={Icons.UserPlus} />
            <OrigemCard label="Reuniões Anúncio" valor={reunioesAnuncio} sub={totalAnuncio > 0 ? `${Math.round((reunioesAnuncio/totalAnuncio)*100)}% de conv.` : '—'} cor="#8B5CF6" icon={Icons.Calendar} />
            <OrigemCard label="Reuniões Prospecção" valor={reunioesProspeccao} sub={totalProspeccao > 0 ? `${Math.round((reunioesProspeccao/totalProspeccao)*100)}% de conv.` : '—'} cor="#FF4500" icon={Icons.Calendar} />
          </div>

          {/* Alertas do dia */}
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

          {/* Gráficos */}
          <Suspense fallback={<div className="h-32" />}>
            <DashboardCharts
              dadosBarras={dadosBarras}
              dadosPizza={dadosPizza}
              evolucao={evolucao}
              totalPorEtapa={totalPorEtapa}
            />
          </Suspense>
        </div>
      )}

      {/* ══════════ TAB: RELATÓRIOS ══════════ */}
      {tab === 'relatorios' && (
        <div className="space-y-6">
          {/* Stat cards relatórios */}
          {loadingLeads ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[0,1,2,3].map((i) => <Sk key={i} className="h-28" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <RelStatCard label="Total de leads" value={totalLeadsRel} color="#FF4500" />
                <RelStatCard label="Fechados" value={fechadosRel} sub={`${taxaConversaoRel}% conversão`} color="#22c55e" />
                <RelStatCard label="Perdidos" value={perdidosRel} sub={totalLeadsRel > 0 ? `${Math.round((perdidosRel/totalLeadsRel)*100)}% do total` : '—'} color="#ef4444" />
                <RelStatCard label="Quentes" value={qtTemp.quente} sub={`${qtTemp.morno} mornos · ${qtTemp.frio} frios`} color="#f59e0b" />
              </div>

              {/* Mini temperatura breakdown */}
              {totalLeadsRel > 0 && (
                <div className="card p-5">
                  <div className="flex items-center gap-6 flex-wrap">
                    {[
                      { label: 'Quentes', value: qtTemp.quente, color: '#ef4444' },
                      { label: 'Mornos',  value: qtTemp.morno,  color: '#f59e0b' },
                      { label: 'Frios',   value: qtTemp.frio,   color: '#3b82f6' },
                    ].map(({ label, value, color }) => {
                      const pct = totalLeadsRel > 0 ? Math.round((value / totalLeadsRel) * 100) : 0;
                      return (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
                          <span className="text-xs" style={{ color: '#52525b' }}>{label}</span>
                          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                          </div>
                          <span className="text-xs tabular-nums font-medium" style={{ color: '#52525b' }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Sub-tabs: gráficos / tabela */}
          <div className="flex items-center gap-2">
            {[
              { id: 'charts', label: 'Gráficos', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                </svg>
              )},
              { id: 'tabela', label: 'Tabela completa', icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625"/>
                </svg>
              )},
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setRelTab(id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={relTab === id ? {
                  background: 'rgba(255,69,0,0.12)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.25)',
                } : {
                  color: '#52525b', border: '1px solid transparent',
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Gráficos relatórios */}
          {relTab === 'charts' && (
            <Suspense fallback={<div className="h-32" />}>
              <RelatoriosCharts
                dadosEtapa={dadosEtapa}
                dadosOrigem={dadosOrigem}
                dadosTipoBem={dadosTipoBem}
                dadosMotivos={dadosMotivos}
                evolucao={evolucao}
                stats={stats}
              />
            </Suspense>
          )}

          {/* Tabela */}
          {relTab === 'tabela' && (
            loadingLeads ? (
              <Sk className="h-64" />
            ) : (
              <TabelaLeads leads={leads} />
            )
          )}
        </div>
      )}

      {showModal && (
        <QuickAddModal onClose={() => setShowModal(false)} onCriado={() => carregar()} />
      )}

      {showWelcome && (
        <WelcomeModal onClose={() => setShowWelcome(false)} />
      )}
    </div>
  );
}

// ─── Relatórios: mini stat card ───────────────────────────────────────────────

function RelStatCard({ label, value, sub, color = '#FF4500' }) {
  return (
    <div className="card p-5 relative overflow-hidden group">
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-[0.06] blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500"
        style={{ background: color }}
      />
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#52525b' }}>{label}</p>
      <p className="text-3xl font-extrabold tabular-nums leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-2 font-medium" style={{ color: '#71717a' }}>{sub}</p>}
    </div>
  );
}

// ─── Relatórios: Tabela de Leads ──────────────────────────────────────────────

const REL_COLUNAS = [
  { key: 'nome',              label: 'Nome' },
  { key: 'whatsapp',         label: 'WhatsApp' },
  { key: 'email',            label: 'E-mail' },
  { key: 'etapa_funil',      label: 'Etapa' },
  { key: 'temperatura',      label: 'Temperatura' },
  { key: 'origem',           label: 'Origem' },
  { key: 'data_proxima_acao',label: 'Próx. ação' },
  { key: 'criado_em',        label: 'Cadastrado em' },
];

const TEMP_BADGE = {
  quente: { label: 'Quente', bg: 'rgba(239,68,68,0.12)', color: '#f87171', dot: '#ef4444' },
  morno:  { label: 'Morno',  bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', dot: '#f59e0b' },
  frio:   { label: 'Frio',   bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', dot: '#3b82f6' },
};

function TabelaLeads({ leads }) {
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 15;

  const filtrados = leads.filter((l) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return l.nome?.toLowerCase().includes(b) || l.email?.toLowerCase().includes(b) || l.whatsapp?.toLowerCase().includes(b);
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const slice = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <p className="text-sm font-bold" style={{ color: '#fafafa' }}>
          Todos os leads <span className="text-xs font-normal ml-2" style={{ color: '#52525b' }}>{filtrados.length} registros</span>
        </p>
        <div className="relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar..."
            className="w-[220px] pl-3 pr-3 py-2 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#f4f4f5' }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(255,69,0,0.3)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {REL_COLUNAS.map((col) => (
                <th key={col.key} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#52525b', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={REL_COLUNAS.length} className="px-5 py-12 text-center text-sm" style={{ color: '#3f3f46' }}>Nenhum lead encontrado</td></tr>
            ) : (
              slice.map((lead) => {
                const tb = TEMP_BADGE[lead.temperatura];
                return (
                  <tr key={lead.id} className="group transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,69,0,0.03)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                  >
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase" style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500' }}>
                          {lead.nome?.charAt(0) || '?'}
                        </div>
                        <span className="font-semibold" style={{ color: '#fafafa' }}>{lead.nome || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>{lead.whatsapp || '—'}</td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: '#a1a1aa', maxWidth: 160 }}><span className="block truncate">{lead.email || '—'}</span></td>
                    <td className="px-5 py-3 whitespace-nowrap"><span className="text-xs font-semibold" style={{ color: '#fb923c' }}>{lead.etapa_funil || '—'}</span></td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {tb ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: tb.bg, color: tb.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tb.dot }} />
                          {tb.label}
                        </span>
                      ) : <span style={{ color: '#3f3f46' }}>—</span>}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs font-semibold" style={{ color: lead.origem === 'anuncio' ? '#a78bfa' : '#fb923c' }}>
                      {lead.origem === 'anuncio' ? 'Anúncio' : lead.origem === 'prospeccao' ? 'Prospecção' : lead.origem || '—'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>{formatarData(lead.data_proxima_acao)}</td>
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums" style={{ color: '#71717a' }}>{formatarData(lead.criado_em)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs" style={{ color: '#52525b' }}>
            {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-20" style={{ color: '#a1a1aa', background: 'rgba(255,255,255,0.03)' }}>
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              let p;
              if (totalPaginas <= 5) p = i + 1;
              else if (pagina <= 3) p = i + 1;
              else if (pagina >= totalPaginas - 2) p = totalPaginas - 4 + i;
              else p = pagina - 2 + i;
              return (
                <button key={p} onClick={() => setPagina(p)}
                  className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                  style={pagina === p ? { background: 'linear-gradient(135deg, #FF4500, #e03d00)', color: '#fff', boxShadow: '0 4px 12px rgba(255,69,0,0.3)' } : { color: '#71717a' }}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-20" style={{ color: '#a1a1aa', background: 'rgba(255,255,255,0.03)' }}>
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
