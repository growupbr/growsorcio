/**
 * RelatoriosCharts — lazy-loaded charts for the Relatórios page.
 * Uses Recharts (already bundled via DashboardCharts).
 *
 * Props:
 *   dadosEtapa    — [{ etapa_funil, total }]
 *   dadosOrigem   — [{ name, value }]
 *   dadosTipoBem  — [{ tipo_de_bem, total }]
 *   dadosMotivos  — [{ motivo, total }]
 *   evolucao      — [{ semana, total }]
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';

// ─── Paleta ───────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#FF4500', '#f97316', '#f59e0b', '#22c55e', '#38bdf8', '#a78bfa', '#ec4899'];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-xl"
      style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {label && <p className="text-xs mb-1" style={{ color: '#71717a' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color || p.fill || '#FF4500' }}>
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Componente de card wrapper ───────────────────────────────────────────────

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: '#f4f4f5' }}>{title}</h3>
      {children}
    </div>
  );
}

// ─── Sem dados placeholder ────────────────────────────────────────────────────

function Empty() {
  return (
    <div className="flex items-center justify-center h-36 text-sm" style={{ color: '#52525b' }}>
      Sem dados suficientes
    </div>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────────

export default function RelatoriosCharts({ dadosEtapa, dadosOrigem, dadosTipoBem, dadosMotivos, evolucao }) {
  return (
    <div className="space-y-4">
      {/* Linha 1: Evolução semanal + Origens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Evolução semanal */}
        <ChartCard title="Evolução semanal de leads (8 semanas)">
          {!evolucao?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolucao} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradEvolucao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF4500" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF4500" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="semana" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Leads" stroke="#FF4500" strokeWidth={2} fill="url(#gradEvolucao)" dot={{ fill: '#FF4500', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Origem dos leads */}
        <ChartCard title="Leads por origem">
          {!dadosOrigem?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dadosOrigem}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {dadosOrigem.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: '#a1a1aa', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Linha 2: Leads por etapa */}
      <ChartCard title="Leads por etapa">
        {!dadosEtapa?.length ? <Empty /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={dadosEtapa.map((d) => ({ name: d.etapa_funil, total: d.total }))}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Leads" radius={[4, 4, 0, 0]} fill="#FF4500">
                <LabelList dataKey="total" position="top" style={{ fill: '#a1a1aa', fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Linha 3: Tipo de bem + Motivos de descarte */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Tipo de bem */}
        <ChartCard title="Leads por tipo de bem">
          {!dadosTipoBem?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={dadosTipoBem.map((d) => ({ name: d.tipo_de_bem, total: d.total }))}
                margin={{ top: 4, right: 40, bottom: 0, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Leads" radius={[0, 4, 4, 0]} fill="#f97316">
                  <LabelList dataKey="total" position="right" style={{ fill: '#a1a1aa', fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Motivos de descarte */}
        <ChartCard title="Motivos de descarte">
          {!dadosMotivos?.length ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={dadosMotivos.map((d) => ({ name: d.motivo, total: d.total }))}
                margin={{ top: 4, right: 40, bottom: 0, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Descartados" radius={[0, 4, 4, 0]} fill="#52525b">
                  <LabelList dataKey="total" position="right" style={{ fill: '#a1a1aa', fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
