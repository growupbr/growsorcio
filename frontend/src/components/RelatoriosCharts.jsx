/**
 * RelatoriosCharts — lazy-loaded premium charts for the Relatórios page.
 * Warm orange-compatible palette with gradients, glows, and polished tooltips.
 *
 * Props:
 *   dadosEtapa    — [{ etapa_funil, total }]
 *   dadosOrigem   — [{ name, value }]
 *   dadosTipoBem  — [{ tipo_de_bem, total }]
 *   dadosMotivos  — [{ motivo, total }]
 *   evolucao      — [{ semana, total }]
 *   stats         — full stats object from /stats/resumo
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, PieChart, Pie, Cell, Legend,
  AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';

// ─── Paleta laranja harmônica ─────────────────────────────────────────────────

const WARM = {
  orange:    '#FF4500',
  amber:     '#f59e0b',
  peach:     '#fb923c',
  coral:     '#f87171',
  gold:      '#fbbf24',
  tangerine: '#ff6a33',
  sunset:    '#e03d00',
  cream:     '#fdba74',
};

const PIE_PALETTE = ['#FF4500', '#fb923c', '#f59e0b', '#fbbf24', '#fdba74', '#ff6a33', '#e03d00'];
const BAR_GRADIENT_ID = 'barGradOrange';
const AREA_GRADIENT_ID = 'areaGradOrange';

// ─── Premium Tooltip ──────────────────────────────────────────────────────────

function PremiumTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md"
      style={{
        background: 'rgba(24,24,27,0.92)',
        border: '1px solid rgba(255,69,0,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
    >
      {label && <p className="text-[11px] font-medium mb-1.5 uppercase tracking-wide" style={{ color: '#52525b' }}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill || '#FF4500' }} />
          <span className="text-sm font-bold" style={{ color: '#fafafa' }}>
            {p.value}
          </span>
          {p.name && <span className="text-xs" style={{ color: '#71717a' }}>{p.name}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`card p-6 relative overflow-hidden group ${className}`}>
      {/* Subtle corner glow on hover */}
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-0 group-hover:opacity-[0.04] blur-3xl transition-opacity duration-500" style={{ background: '#FF4500' }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#fafafa' }}>{title}</h3>
            {subtitle && <p className="text-[11px] mt-0.5" style={{ color: '#52525b' }}>{subtitle}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center h-44 gap-2">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" style={{ color: '#3f3f46' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
        </svg>
      </div>
      <p className="text-xs font-medium" style={{ color: '#3f3f46' }}>Sem dados suficientes</p>
    </div>
  );
}

// ─── Conversion rate ring ─────────────────────────────────────────────────────

function ConversionRing({ rate, label }) {
  const data = [{ name: label, value: rate, fill: '#FF4500' }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <RadialBarChart
          width={112} height={112}
          cx={56} cy={56}
          innerRadius={38} outerRadius={52}
          barSize={10} data={data}
          startAngle={90} endAngle={-270}
        >
          <RadialBar
            background={{ fill: 'rgba(255,255,255,0.04)' }}
            dataKey="value"
            cornerRadius={5}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: '#FF4500' }}>{rate}%</span>
        </div>
      </div>
      <span className="text-xs font-medium mt-2" style={{ color: '#71717a' }}>{label}</span>
    </div>
  );
}

// ─── Custom bar with rounded gradient ─────────────────────────────────────────

function GradientDefs() {
  return (
    <defs>
      <linearGradient id={BAR_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF4500" stopOpacity={1} />
        <stop offset="100%" stopColor="#e03d00" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="barGradAmber" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
        <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="barGradGray" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#52525b" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#71717a" stopOpacity={0.5} />
      </linearGradient>
      <linearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF4500" stopOpacity={0.35} />
        <stop offset="50%" stopColor="#FF4500" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#FF4500" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="barGradHorizontal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#FF4500" stopOpacity={0.8} />
        <stop offset="100%" stopColor="#fb923c" stopOpacity={1} />
      </linearGradient>
    </defs>
  );
}

// ─── Custom legend for pie ────────────────────────────────────────────────────

function PieLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
      {(payload || []).map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-xs font-medium" style={{ color: '#a1a1aa' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Charts Component ────────────────────────────────────────────────────

export default function RelatoriosCharts({ dadosEtapa, dadosOrigem, dadosTipoBem, dadosMotivos, evolucao, stats }) {
  const taxaResposta = stats?.taxa_resposta_anuncio || 0;
  const totalLeads = (stats?.por_etapa || []).reduce((s, e) => s + e.total, 0);
  const fechados = (stats?.por_etapa || []).find((e) => e.etapa_funil === 'Fechado')?.total || 0;
  const taxaConversao = totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0;

  return (
    <div className="space-y-4">

      {/* ═══════ ROW 1: Evolução + Taxas ═══════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Evolução semanal — spans 2 cols */}
        <ChartCard
          title="Evolução semanal"
          subtitle="Últimas 8 semanas"
          className="xl:col-span-2"
        >
          {!evolucao?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={evolucao} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <GradientDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="semana"
                  tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<PremiumTooltip />} />
                <Area
                  type="monotone" dataKey="total" name="Leads"
                  stroke="#FF4500" strokeWidth={2.5}
                  fill={`url(#${AREA_GRADIENT_ID})`}
                  dot={{ fill: '#FF4500', stroke: '#18181b', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#FF4500', stroke: '#fff', strokeWidth: 2, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Conversion rings */}
        <ChartCard title="Taxas de conversão" subtitle="Performance geral">
          <div className="flex items-center justify-around h-[260px]">
            <ConversionRing rate={taxaConversao} label="Conversão" />
            <ConversionRing rate={taxaResposta} label="Resp. Anúncio" />
          </div>
        </ChartCard>
      </div>

      {/* ═══════ ROW 2: Origem (Pie) + Etapa (Bar) ═══════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Origem — donut */}
        <ChartCard title="Leads por origem" subtitle="Distribuição de canais">
          {!dadosOrigem?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dadosOrigem}
                  cx="50%" cy="48%"
                  innerRadius={60} outerRadius={90}
                  paddingAngle={4}
                  dataKey="value" nameKey="name"
                  stroke="none"
                >
                  {dadosOrigem.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PremiumTooltip />} />
                <Legend content={<PieLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Etapa — bar */}
        <ChartCard title="Leads por etapa" subtitle="Distribuição no funil">
          {!dadosEtapa?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={dadosEtapa.map((d) => ({ name: d.etapa_funil, total: d.total }))}
                margin={{ top: 12, right: 8, bottom: 0, left: -20 }}
              >
                <GradientDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#52525b', fontSize: 9, fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  interval={0} angle={-35} textAnchor="end" height={70}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<PremiumTooltip />} />
                <Bar dataKey="total" name="Leads" radius={[6, 6, 0, 0]} fill={`url(#${BAR_GRADIENT_ID})`}>
                  <LabelList dataKey="total" position="top" style={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ═══════ ROW 3: Tipo de bem + Motivos ═══════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Tipo de bem — horizontal bar */}
        <ChartCard title="Leads por tipo de bem" subtitle="Top 8 categorias">
          {!dadosTipoBem?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={dadosTipoBem.map((d) => ({ name: d.tipo_de_bem, total: d.total }))}
                margin={{ top: 4, right: 50, bottom: 0, left: 4 }}
              >
                <GradientDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category" dataKey="name"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }}
                  axisLine={false} tickLine={false} width={110}
                />
                <Tooltip content={<PremiumTooltip />} />
                <Bar dataKey="total" name="Leads" radius={[0, 6, 6, 0]} fill="url(#barGradHorizontal)">
                  <LabelList dataKey="total" position="right" style={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Motivos de descarte */}
        <ChartCard title="Motivos de descarte" subtitle="Por que leads são perdidos">
          {!dadosMotivos?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={dadosMotivos.map((d) => ({ name: d.motivo, total: d.total }))}
                margin={{ top: 4, right: 50, bottom: 0, left: 4 }}
              >
                <GradientDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category" dataKey="name"
                  tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 500 }}
                  axisLine={false} tickLine={false} width={150}
                />
                <Tooltip content={<PremiumTooltip />} />
                <Bar dataKey="total" name="Descartados" radius={[0, 6, 6, 0]} fill="url(#barGradGray)">
                  <LabelList dataKey="total" position="right" style={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
