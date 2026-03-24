import { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { api } from '../api/client';

const RelatoriosCharts = lazy(() => import('../components/RelatoriosCharts'));

// ─── Períodos ─────────────────────────────────────────────────────────────────

const PERIODOS = [
  { id: 'hoje',   label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mês' },
  { id: 'total',  label: 'Total' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatarData(str) {
  if (!str) return '—';
  const [a, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

function formatarMoeda(val) {
  if (!val || isNaN(Number(val))) return '—';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const Icons = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  TrendUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
};

// ─── Temperatura badge ────────────────────────────────────────────────────────

const TEMP = {
  quente: { label: 'Quente', bg: 'rgba(239,68,68,0.15)',  color: '#f87171',  border: 'rgba(239,68,68,0.3)' },
  morno:  { label: 'Morno',  bg: 'rgba(245,158,11,0.15)', color: '#fbbf24',  border: 'rgba(245,158,11,0.3)' },
  frio:   { label: 'Frio',   bg: 'rgba(59,130,246,0.15)', color: '#60a5fa',  border: 'rgba(59,130,246,0.3)' },
};

function TempBadge({ valor }) {
  const t = TEMP[valor];
  if (!t) return <span style={{ color: '#71717a' }}>—</span>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}
    >
      {t.label}
    </span>
  );
}

// ─── Etapa tag ────────────────────────────────────────────────────────────────

const ETAPA_COLORS = {
  'Lead Anúncio': '#a78bfa', 'Analisar Perfil': '#f97316', 'Seguiu Perfil': '#f97316',
  'Abordagem Enviada': '#f97316', 'Respondeu': '#38bdf8', 'Em Desenvolvimento': '#38bdf8',
  'Follow-up Ativo': '#38bdf8', 'Lead Capturado': '#38bdf8', 'Reunião Agendada': '#f59e0b',
  'Reunião Realizada': '#f59e0b', 'Proposta Enviada': '#f59e0b', 'Follow-up Proposta': '#f59e0b',
  'Fechado': '#22c55e', 'Perdido': '#52525b',
};

function EtapaTag({ etapa }) {
  const color = ETAPA_COLORS[etapa] || '#71717a';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium truncate max-w-[130px]"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
      title={etapa}
    >
      {etapa || '—'}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = '#FF4500' }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, color }}
      >
        <Icon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium mb-1" style={{ color: '#71717a' }}>{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: '#f4f4f5' }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: '#71717a' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    </div>
  );
}

// ─── Tabela de Leads ──────────────────────────────────────────────────────────

const COLUNAS = [
  { key: 'nome',              label: 'Nome' },
  { key: 'whatsapp',         label: 'WhatsApp' },
  { key: 'email',            label: 'E-mail' },
  { key: 'etapa_funil',      label: 'Etapa' },
  { key: 'temperatura',      label: 'Temperatura' },
  { key: 'origem',           label: 'Origem' },
  { key: 'tipo_de_bem',      label: 'Tipo de bem' },
  { key: 'valor_da_carta',   label: 'Valor da carta' },
  { key: 'data_proxima_acao',label: 'Próx. ação' },
  { key: 'criado_em',        label: 'Cadastrado em' },
];

function TabelaLeads({ leads }) {
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 15;

  const filtrados = leads.filter((l) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      l.nome?.toLowerCase().includes(b) ||
      l.email?.toLowerCase().includes(b) ||
      l.whatsapp?.toLowerCase().includes(b) ||
      l.etapa_funil?.toLowerCase().includes(b)
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const slice = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="card overflow-hidden">
      {/* Cabeçalho tabela */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5">
        <h3 className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>
          Todos os leads
          <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,69,0,0.12)', color: '#FF4500' }}>
            {filtrados.length}
          </span>
        </h3>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }}>
            <Icons.Search />
          </span>
          <input
            type="text"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar lead..."
            className="pl-8 pr-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.07)', color: '#f4f4f5', width: 200 }}
          />
          {busca && (
            <button
              onClick={() => { setBusca(''); setPagina(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <Icons.X />
            </button>
          )}
        </div>
      </div>

      {/* Scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {COLUNAS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: '#71717a' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={COLUNAS.length} className="px-4 py-10 text-center text-sm" style={{ color: '#52525b' }}>
                  Nenhum lead encontrado
                </td>
              </tr>
            ) : (
              slice.map((lead) => (
                <tr
                  key={lead.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: '#f4f4f5' }}>
                    {lead.nome || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>
                    {lead.whatsapp || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#a1a1aa', maxWidth: 180 }}>
                    <span className="block truncate" title={lead.email}>{lead.email || '—'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EtapaTag etapa={lead.etapa_funil} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TempBadge valor={lead.temperatura} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize" style={{ color: '#a1a1aa' }}>
                    {lead.origem === 'anuncio' ? 'Anúncio' : lead.origem === 'prospeccao' ? 'Prospecção' : lead.origem || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#a1a1aa' }}>
                    {lead.tipo_de_bem || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>
                    {formatarMoeda(lead.valor_da_carta)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>
                    {formatarData(lead.data_proxima_acao)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>
                    {formatarData(lead.criado_em)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-xs" style={{ color: '#71717a' }}>
            {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30 transition-colors hover:bg-zinc-800"
              style={{ color: '#a1a1aa' }}
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              let p;
              if (totalPaginas <= 5) p = i + 1;
              else if (pagina <= 3) p = i + 1;
              else if (pagina >= totalPaginas - 2) p = totalPaginas - 4 + i;
              else p = pagina - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: pagina === p ? 'rgba(255,69,0,0.15)' : 'transparent',
                    color: pagina === p ? '#FF4500' : '#a1a1aa',
                    border: pagina === p ? '1px solid rgba(255,69,0,0.3)' : '1px solid transparent',
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30 transition-colors hover:bg-zinc-800"
              style={{ color: '#a1a1aa' }}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Relatorios() {
  const [periodo, setPeriodo] = useState('total');
  const [stats, setStats] = useState(null);
  const [evolucao, setEvolucao] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState('');

  // Carrega stats e evolução
  useEffect(() => {
    setLoadingStats(true);
    Promise.all([api.resumoStats(periodo), api.evolucaoLeads()])
      .then(([s, ev]) => {
        setStats(s);
        setEvolucao(ev);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [periodo]);

  // Carrega lista completa de leads
  useEffect(() => {
    setLoadingLeads(true);
    api.listarLeads({})
      .then((data) => setLeads(Array.isArray(data) ? data : (data?.leads || [])))
      .catch(() => {})
      .finally(() => setLoadingLeads(false));
  }, []);

  const handleExportar = useCallback(async () => {
    setExportando(true);
    setErroExport('');
    try {
      await api.exportarCSV();
    } catch (e) {
      setErroExport(e.message || 'Erro ao exportar');
    } finally {
      setExportando(false);
    }
  }, []);

  // ─── Métricas derivadas ────────────────────────────────────────────────────

  const totalLeads = leads.length;
  const fechados = leads.filter((l) => l.etapa_funil === 'Fechado').length;
  const perdidos = leads.filter((l) => l.etapa_funil === 'Perdido').length;
  const taxaConversao = totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0;

  // Porcentagem de cada temperatura
  const qtTemp = { quente: 0, morno: 0, frio: 0 };
  leads.forEach((l) => { if (l.temperatura in qtTemp) qtTemp[l.temperatura]++; });

  // ─── Dados para charts ─────────────────────────────────────────────────────

  const dadosEtapa = (stats?.por_etapa || []).sort((a, b) => b.total - a.total);
  const dadosOrigem = (stats?.por_origem || []).map((r) => ({
    name: r.origem === 'anuncio' ? 'Anúncio' : r.origem === 'prospeccao' ? 'Prospecção' : r.origem,
    value: r.total,
  }));
  const dadosTipoBem = (stats?.por_tipo_bem || []).sort((a, b) => b.total - a.total).slice(0, 8);
  const dadosMotivos = leads
    .filter((l) => l.motivo_descarte)
    .reduce((acc, l) => {
      const m = l.motivo_descarte;
      const found = acc.find((x) => x.motivo === m);
      if (found) found.total++;
      else acc.push({ motivo: m, total: 1 });
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#f4f4f5' }}>Relatórios</h1>
          <p className="text-sm mt-1" style={{ color: '#71717a' }}>
            Análise completa dos seus leads e resultados
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtro de período */}
          <div
            className="flex items-center gap-1 rounded-xl p-1"
            style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  periodo === p.id
                    ? { background: 'rgba(255,69,0,0.15)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.3)' }
                    : { color: '#71717a' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botão exportar CSV */}
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 cursor-pointer"
            style={{ background: 'rgba(255,69,0,0.12)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.25)' }}
          >
            <Icons.Download />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {erroExport && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          {erroExport}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total de leads"
          value={loadingLeads ? '—' : totalLeads}
          sub="todos os cadastros"
          icon={Icons.Users}
          color="#FF4500"
        />
        <StatCard
          label="Fechados"
          value={loadingLeads ? '—' : fechados}
          sub={`${taxaConversao}% de conversão`}
          icon={Icons.Check}
          color="#22c55e"
        />
        <StatCard
          label="Perdidos"
          value={loadingLeads ? '—' : perdidos}
          sub={totalLeads > 0 ? `${Math.round((perdidos / totalLeads) * 100)}% do total` : ''}
          icon={Icons.X}
          color="#f87171"
        />
        <StatCard
          label="Leads quentes"
          value={loadingLeads ? '—' : qtTemp.quente}
          sub={`${qtTemp.morno} mornos · ${qtTemp.frio} frios`}
          icon={Icons.TrendUp}
          color="#f59e0b"
        />
      </div>

      {/* Charts */}
      {loadingStats ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-64 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            </div>
          ))}
        </div>
      ) : (
        <Suspense fallback={<Spinner />}>
          <RelatoriosCharts
            dadosEtapa={dadosEtapa}
            dadosOrigem={dadosOrigem}
            dadosTipoBem={dadosTipoBem}
            dadosMotivos={dadosMotivos}
            evolucao={evolucao}
          />
        </Suspense>
      )}

      {/* Tabela de leads */}
      {loadingLeads ? (
        <div className="card p-5"><Spinner /></div>
      ) : (
        <TabelaLeads leads={leads} />
      )}
    </div>
  );
}
