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
  LabelList, Area, AreaChart, Line, ComposedChart,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ETAPAS_FUNIL } from '../constants/etapas';
import React from 'react';

// ─── Regressão linear simples ─────────────────────────────────────────────────

function calcTrend(data) {
  const n = data.length;
  if (n < 2) return data.map(() => null);
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.total);
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  return xs.map((x) => Math.max(0, Math.round((slope * x + intercept) * 10) / 10));
}

// ─── Paleta ───────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#FF4500', '#ff5722', '#ff6a33', '#ff7d4d', '#e03d00',
  '#cc3700', '#ff8c5a', '#ffa270', '#ffad80', '#f97316',
  '#fb923c', '#fdba74', '#ff9966',
];

// ─── Tooltip compartilhado ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, total }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <p className="text-xs mb-1.5" style={{ color: '#a1a1aa' }}>{label}</p>}
      {payload.map((p, i) => {
        const pct = total && total > 0 ? ` (${Math.round((p.value / total) * 100)}%)` : '';
        return (
          <p key={i} className="font-semibold text-sm" style={{ color: p.color || p.fill || '#FF4500' }}>
            {p.name ? `${p.name}: ` : ''}{p.value}{pct}
          </p>
        );
      })}
    </div>
  );
}

// Tooltip que calcula totais do pie internamente
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const totalPie = payload.reduce ? undefined : undefined; // recharts não passa total direto
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-sm" style={{ color: entry.payload?.color || '#FF4500' }}>
        {entry.name}: {entry.value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>
        {Math.round(entry.payload?.percent * 100)}% do total
      </p>
    </div>
  );
}

// ─── Funil de conversão visual (pirâmide) + tooltip customizado ────────────────

function FunilConversao({ etapas, carregandoEtapas, totalPorEtapa }) {
  const [hoveredIdx, setHoveredIdx] = React.useState(null);

  // ── Skeleton enquanto etapas carregam ──
  if (carregandoEtapas) {
    return (
      <div className="card p-5 h-full">
        <div className="flex items-center justify-between mb-5">
          <div className="animate-pulse rounded" style={{ height: 16, width: 140, background: '#27272a' }} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          {[100, 88, 76, 64, 52, 40].map((w, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg"
              style={{ width: `${w}%`, height: 36, background: 'rgba(255,255,255,0.05)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Separar etapas de perda das etapas do funil ──
  const etapasFunil = (etapas || [])
    .filter((e) => !e.is_lost)
    .sort((a, b) => a.display_order - b.display_order);
  const etapasLoss = (etapas || []).filter((e) => e.is_lost);

  // ── Contagem bruta por etapa ──
  const dadosBrutos = etapasFunil.map((e) => ({
    nome: e.name,
    bruto: totalPorEtapa[e.name] || 0,
  }));

  // ── Contagem cumulativa: sufixo da soma (cada etapa = ela + todas as posteriores) ──
  const n = dadosBrutos.length;
  const cumulativo = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    cumulativo[i] = dadosBrutos[i].bruto + (i < n - 1 ? cumulativo[i + 1] : 0);
  }

  // ── Total descartados e total que entrou no funil ──
  const totalDescartados = etapasLoss.reduce((s, e) => s + (totalPorEtapa[e.name] || 0), 0);
  const totalEntrou = cumulativo[0] || 0;

  const max = Math.max(...cumulativo, 1);
  const minWidth = 28;
  const step = (100 - minWidth) / Math.max(n - 1, 1);
  const isEmpty = cumulativo.every((v) => v === 0);

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>
          Funil de conversão
        </h3>
        <div className="flex items-center gap-3">
          {[['#22c55e', '≥70%'], ['#f59e0b', '40–69%'], ['#ef4444', '<40%']].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1 text-[11px]" style={{ color: '#71717a' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" style={{ color: '#3f3f46' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
          </svg>
          <p className="text-sm" style={{ color: '#52525b' }}>Nenhum lead no funil ainda</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-0.5">
            {dadosBrutos.map((item, idx) => {
              const cum = cumulativo[idx];
              const cumAnterior = idx > 0 ? cumulativo[idx - 1] : null;
              const pctConversao = cumAnterior != null && cumAnterior > 0
                ? Math.round((cum / cumAnterior) * 100) : null;
              const cor = pctConversao == null ? '#FF4500' :
                pctConversao >= 70 ? '#22c55e' :
                pctConversao >= 40 ? '#f59e0b' : '#ef4444';

              const widthPct = 100 - idx * step;
              const fillOpacity = max > 0 ? 0.12 + (cum / max) * 0.28 : 0.12;
              const isUltimaAtiva = idx === n - 1;
              const accentColor = isUltimaAtiva ? '#22c55e' : '#FF4500';
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={item.nome}
                  className="relative flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-200 cursor-default"
                  style={{
                    width: `${widthPct}%`,
                    background: isHovered
                      ? `rgba(${isUltimaAtiva ? '34,197,94' : '255,69,0'}, ${fillOpacity + 0.1})`
                      : `rgba(${isUltimaAtiva ? '34,197,94' : '255,69,0'}, ${fillOpacity})`,
                    border: `1px solid rgba(${isUltimaAtiva ? '34,197,94' : '255,69,0'}, ${isHovered ? 0.35 : 0.18})`,
                    minHeight: 36,
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Label esquerda */}
                  <span
                    className="text-xs font-medium truncate flex-1 min-w-0"
                    style={{ color: isHovered ? '#f4f4f5' : '#a1a1aa' }}
                  >
                    {item.nome}
                  </span>

                  {/* Valor cumulativo + badge de conversão */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-sm font-bold tabular-nums" style={{ color: '#f4f4f5' }}>
                      {cum}
                    </span>
                    {pctConversao != null && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                        style={{ background: `rgba(${cor === '#22c55e' ? '34,197,94' : cor === '#f59e0b' ? '245,158,11' : '239,68,68'}, 0.15)`, color: cor }}
                      >
                        {pctConversao}%
                      </span>
                    )}
                  </div>

                  {/* Tooltip ao hover */}
                  {isHovered && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -top-9 z-20 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap pointer-events-none"
                      style={{ background: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
                    >
                      <span className="font-semibold" style={{ color: accentColor }}>{item.nome}</span>
                      <span className="ml-2" style={{ color: '#71717a' }}>{item.bruto} aqui agora</span>
                      <span className="ml-2" style={{ color: '#a1a1aa' }}>· {cum} já passaram</span>
                      {/* Seta */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
                        style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #3f3f46' }}
                      />
                    </div>
                  )}

                  {/* Barra de volume interna (baseada no cumulativo) */}
                  <div
                    className="absolute bottom-0 left-0 h-[2px] rounded-b-lg transition-all duration-700"
                    style={{
                      width: max > 0 ? `${(cum / max) * 100}%` : '0%',
                      background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                      opacity: 0.6,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Card de descartados — separado abaixo do funil */}
          {etapasLoss.length > 0 && (
            <div
              className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-lg"
              style={{ background: 'rgba(82,82,91,0.1)', border: '1px solid rgba(82,82,91,0.2)' }}
            >
              <span className="text-xs font-medium" style={{ color: '#71717a' }}>
                {etapasLoss.map((e) => e.name).join(' / ')}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="text-sm font-bold tabular-nums" style={{ color: '#71717a' }}>
                  {totalDescartados}
                </span>
                {totalEntrou > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: 'rgba(82,82,91,0.2)', color: '#71717a' }}
                  >
                    {Math.round((totalDescartados / totalEntrou) * 100)}%
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Componente exportado ─────────────────────────────────────────────────────

export default function DashboardCharts({ dadosBarras, dadosPizza, evolucao, totalPorEtapa, etapas, carregandoEtapas }) {
  return (
    <>
      {/* ── Barras (leads por etapa) + Pizza (temperatura) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-5" style={{ color: '#f4f4f5' }}>
            Leads por etapa do funil
          </h3>
          {dadosBarras.every((d) => d.total === 0) ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" style={{ color: '#3f3f46' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
              </svg>
              <p className="text-sm" style={{ color: '#52525b' }}>Sem leads no período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={dadosBarras.length * 34 + 24}>
              <BarChart layout="vertical" data={dadosBarras} margin={{ top: 4, right: 44, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="etapa"
                  tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                  axisLine={false}
                  tickLine={false}
                  width={150}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={18}>
                  <LabelList
                    dataKey="total"
                    position="right"
                    style={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Plus Jakarta Sans', fontWeight: 600 }}
                  />
                  {dadosBarras.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#f4f4f5' }}>
            Temperatura dos leads
          </h3>
          {dadosPizza.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend manual com valor absoluto + % */}
              {(() => {
                const total = dadosPizza.reduce((s, d) => s + d.value, 0);
                return (
                  <div className="flex flex-col gap-2 mt-2">
                    {dadosPizza.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs flex-1" style={{ color: '#a1a1aa' }}>{d.name}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: '#f4f4f5' }}>{d.value}</span>
                        <span className="text-[11px] tabular-nums w-10 text-right" style={{ color: '#52525b' }}>
                          {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#71717a' }}>Sem dados</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Funil de conversão + Evolução semanal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FunilConversao etapas={etapas} carregandoEtapas={carregandoEtapas} totalPorEtapa={totalPorEtapa} />

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>
              Novos leads por semana
            </h3>
            <div className="flex items-center gap-3 text-[11px]" style={{ color: '#71717a' }}>
              <span className="flex items-center gap-1">
                <span className="inline-block w-5 h-0.5 rounded" style={{ background: '#FF4500' }} />
                Leads
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-5 h-0.5 rounded" style={{ background: 'rgba(255,180,0,0.7)', borderTop: '2px dashed rgba(255,180,0,0.7)' }} />
                Tendência
              </span>
            </div>
          </div>
          {evolucao.length > 0 ? (() => {
            const trendValues = calcTrend(evolucao);
            const data = evolucao.map((d, i) => ({ ...d, trend: trendValues[i] }));
            return (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
                  <Line
                    type="monotone"
                    dataKey="trend"
                    name="Tendência"
                    stroke="rgba(255,180,0,0.7)"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            );
          })() : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm" style={{ color: '#71717a' }}>Sem dados nas últimas 8 semanas</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
