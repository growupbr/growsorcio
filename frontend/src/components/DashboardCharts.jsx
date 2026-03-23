/**
 * DashboardCharts — lazy-loaded sub-component.
 * Importado via React.lazy() em Dashboard.jsx para que o bundle do Recharts
 * só seja baixado quando o Dashboard renderizar, e cacheado separadamente
 * pelo chunk vendor-recharts do Vite.
 *
 * Props:
 *   dadosBarras    — array de { etapa, total }
 *   dadosPizza     — array de { name, value, color }
 *   evolucao       — array de { semana, total }
 *   totalPorEtapa  — { [etapaNome]: number }
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, Area, AreaChart,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ETAPAS_FUNIL } from '../constants/etapas';

// ─── Paleta ───────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#FF4500', '#ff5722', '#ff6a33', '#ff7d4d', '#e03d00',
  '#cc3700', '#ff8c5a', '#ffa270', '#ffad80', '#f97316',
  '#fb923c', '#fdba74', '#ff9966',
];

// ─── Tooltip compartilhado ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="text-xs mb-1.5" style={{ color: '#a1a1aa' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-sm" style={{ color: p.color || p.fill || '#FF4500' }}>
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Funil de conversão (sem recharts, mas co-localizado aqui) ────────────────

function FunilConversao({ totalPorEtapa }) {
  const dados = ETAPAS_FUNIL.map((etapa) => ({
    etapa,
    total: totalPorEtapa[etapa] || 0,
  }));
  const max = Math.max(...dados.map((d) => d.total), 1);

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>
          Funil de conversão
        </h3>
        <span className="text-[11px]" style={{ color: '#71717a' }}>% do estágio anterior</span>
      </div>
      <div className="space-y-2">
        {dados.map((item, idx) => {
          const anterior = idx > 0 ? dados[idx - 1].total : null;
          const pctBarra = max > 0 ? (item.total / max) * 100 : 0;
          const pctConversao = anterior != null && anterior > 0
            ? Math.round((item.total / anterior) * 100) : null;

          const cor = pctConversao == null ? '' :
            pctConversao >= 70 ? '#22c55e' :
            pctConversao >= 40 ? '#f59e0b' : '#ef4444';

          return (
            <div key={item.etapa} className="flex items-center gap-3">
              <span
                className="text-xs w-36 flex-shrink-0 text-right truncate"
                style={{ color: '#a1a1aa' }}
                title={item.etapa}
              >
                {item.etapa}
              </span>
              <div
                className="flex-1 rounded-full h-1.5 overflow-hidden"
                style={{ background: '#3f3f46' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pctBarra}%`,
                    background: item.etapa === 'Fechado'
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #FF4500, #ff6a33)',
                  }}
                />
              </div>
              <span
                className="text-sm font-bold w-6 text-right tabular-nums"
                style={{ color: '#f4f4f5' }}
              >
                {item.total}
              </span>
              <div className="w-12 text-right">
                {pctConversao != null ? (
                  <span className="text-xs font-semibold" style={{ color: cor }}>
                    {pctConversao}%
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: '#52525b' }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end mt-4 gap-4">
        {[['#22c55e', '≥70%'], ['#f59e0b', '40–69%'], ['#ef4444', '<40%']].map(([color, label]) => (
          <span key={label} className="flex items-center gap-1 text-xs" style={{ color: '#71717a' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Componente exportado ─────────────────────────────────────────────────────

export default function DashboardCharts({ dadosBarras, dadosPizza, evolucao, totalPorEtapa }) {
  return (
    <>
      {/* ── Barras (leads por etapa) + Pizza (temperatura) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-5" style={{ color: '#f4f4f5' }}>
            Leads por etapa do funil
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosBarras} margin={{ top: 16, right: 4, left: -20, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis
                dataKey="etapa"
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }}
                angle={-35}
                textAnchor="end"
                interval={0}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40} barSize={32}>
                <LabelList
                  dataKey="total"
                  position="top"
                  style={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Plus Jakarta Sans', fontWeight: 600 }}
                />
                {dadosBarras.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#f4f4f5' }}>
            Temperatura dos leads
          </h3>
          {dadosPizza.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%" cy="44%"
                  innerRadius={52} outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {dadosPizza.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  formatter={(value) => (
                    <span style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}>
                      {value}
                    </span>
                  )}
                  wrapperStyle={{ paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#71717a' }}>Sem dados</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Funil de conversão + Evolução semanal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunilConversao totalPorEtapa={totalPorEtapa} />

        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-5" style={{ color: '#f4f4f5' }}>
            Novos leads por semana
          </h3>
          {evolucao.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={evolucao} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradLead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF4500" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF4500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                <XAxis
                  dataKey="semana"
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={{ stroke: '#3f3f46' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Leads"
                  stroke="#FF4500"
                  strokeWidth={2}
                  fill="url(#gradLead)"
                  dot={{ fill: '#FF4500', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#ff6a33', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#71717a' }}>Sem dados nas últimas 8 semanas</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
