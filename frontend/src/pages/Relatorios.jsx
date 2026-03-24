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

// ─── SVG Icons (heroicons style, 24px) ────────────────────────────────────────

const Icons = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
    </svg>
  ),
  Trophy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a9.011 9.011 0 01-5.02 1.529 9.011 9.011 0 01-5.021-1.529"/>
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  Fire: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  ChartBar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
    </svg>
  ),
  Sparkles: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
    </svg>
  ),
  Table: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12h-7.5c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5m0 0c.621 0 1.125.504 1.125 1.125"/>
    </svg>
  ),
};

// ─── Temperatura badge ────────────────────────────────────────────────────────

const TEMP = {
  quente: { label: 'Quente', bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)', dot: '#ef4444' },
  morno:  { label: 'Morno',  bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', dot: '#f59e0b' },
  frio:   { label: 'Frio',   bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)', dot: '#3b82f6' },
};

function TempBadge({ valor }) {
  const t = TEMP[valor];
  if (!t) return <span style={{ color: '#3f3f46' }}>—</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.dot }} />
      {t.label}
    </span>
  );
}

// ─── Etapa tag ────────────────────────────────────────────────────────────────

const ETAPA_COLORS = {
  'Lead Anúncio': '#a78bfa', 'Analisar Perfil': '#f97316', 'Seguiu Perfil': '#f97316',
  'Abordagem Enviada': '#fb923c', 'Respondeu': '#38bdf8', 'Em Desenvolvimento': '#38bdf8',
  'Follow-up Ativo': '#38bdf8', 'Lead Capturado': '#38bdf8', 'Reunião Agendada': '#f59e0b',
  'Reunião Realizada': '#f59e0b', 'Proposta Enviada': '#f59e0b', 'Follow-up Proposta': '#f59e0b',
  'Fechado': '#22c55e', 'Perdido': '#52525b',
};

function EtapaTag({ etapa }) {
  const color = ETAPA_COLORS[etapa] || '#71717a';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold truncate max-w-[140px]"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
      title={etapa}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {etapa || '—'}
    </span>
  );
}

// ─── Animated stat card ───────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = '#FF4500', gradient }) {
  return (
    <div className="card-metric group relative overflow-hidden">
      {/* Gradient glow top-right */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.15]"
        style={{ background: gradient || color }}
      />
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="relative flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${color}20, ${color}08)`,
            border: `1px solid ${color}25`,
            color,
          }}
        >
          <Icon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide uppercase mb-1.5" style={{ color: '#52525b' }}>{label}</p>
          <p className="text-3xl font-extrabold tabular-nums leading-none tracking-tight" style={{ color: '#fafafa' }}>{value}</p>
          {sub && <p className="text-xs mt-2 font-medium" style={{ color: '#71717a' }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="card-metric">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="w-20 h-3 rounded bg-zinc-800 animate-pulse" />
          <div className="w-16 h-7 rounded bg-zinc-800 animate-pulse" />
          <div className="w-28 h-3 rounded bg-zinc-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="card p-6 min-h-[300px] flex flex-col">
      <div className="w-40 h-4 rounded bg-zinc-800 animate-pulse mb-6" />
      <div className="flex-1 flex items-end gap-2 pb-4">
        {[40, 65, 50, 80, 35, 70, 55, 90, 45, 60].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t animate-pulse"
            style={{ height: `${h}%`, background: 'rgba(255,69,0,0.08)', animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" />
      </div>
    </div>
  );
}

// ─── Tabela com avatar, badges e paginação premium ────────────────────────────

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.2)', color: '#FF4500' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4.5 h-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#fafafa' }}>
              Todos os leads
            </h3>
            <p className="text-xs" style={{ color: '#52525b' }}>
              {filtrados.length} registros {busca ? `(filtrado de ${leads.length})` : ''}
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#52525b' }}>
            <Icons.Search />
          </span>
          <input
            type="text"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar por nome, e-mail, telefone..."
            className="w-full sm:w-[280px] pl-9 pr-9 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#f4f4f5',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(255,69,0,0.3)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,69,0,0.08)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.06)'; e.target.style.boxShadow = 'none'; }}
          />
          {busca && (
            <button
              onClick={() => { setBusca(''); setPagina(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-zinc-800 transition-colors"
              style={{ color: '#52525b' }}
            >
              <Icons.X />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {COLUNAS.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: '#52525b', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={COLUNAS.length} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', color: '#3f3f46' }}>
                      <Icons.Search />
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#3f3f46' }}>Nenhum lead encontrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              slice.map((lead) => (
                <tr
                  key={lead.id}
                  className="group transition-colors duration-150 cursor-default"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,69,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 uppercase"
                        style={{ background: 'rgba(255,69,0,0.1)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.15)' }}
                      >
                        {lead.nome?.charAt(0) || '?'}
                      </div>
                      <span className="font-semibold" style={{ color: '#fafafa' }}>{lead.nome || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>
                    {lead.whatsapp || '—'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: '#a1a1aa', maxWidth: 180 }}>
                    <span className="block truncate" title={lead.email}>{lead.email || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <EtapaTag etapa={lead.etapa_funil} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <TempBadge valor={lead.temperatura} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        background: lead.origem === 'anuncio' ? 'rgba(167,139,250,0.1)' : 'rgba(255,69,0,0.08)',
                        color: lead.origem === 'anuncio' ? '#a78bfa' : '#fb923c',
                        border: `1px solid ${lead.origem === 'anuncio' ? 'rgba(167,139,250,0.2)' : 'rgba(255,69,0,0.15)'}`,
                      }}
                    >
                      {lead.origem === 'anuncio' ? 'Anúncio' : lead.origem === 'prospeccao' ? 'Prospecção' : lead.origem || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: '#a1a1aa' }}>
                    {lead.tipo_de_bem || '—'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap tabular-nums font-medium" style={{ color: '#d4d4d8' }}>
                    {formatarMoeda(lead.valor_da_carta)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap tabular-nums" style={{ color: '#a1a1aa' }}>
                    {formatarData(lead.data_proxima_acao)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap tabular-nums" style={{ color: '#71717a' }}>
                    {formatarData(lead.criado_em)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação premium */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs font-medium" style={{ color: '#52525b' }}>
            Mostrando {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-20 transition-all duration-200"
              style={{ color: '#a1a1aa', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              let p;
              if (totalPaginas <= 5) p = i + 1;
              else if (pagina <= 3) p = i + 1;
              else if (pagina >= totalPaginas - 2) p = totalPaginas - 4 + i;
              else p = pagina - 2 + i;
              const isActive = pagina === p;
              return (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className="w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #FF4500, #e03d00)' : 'transparent',
                    color: isActive ? '#fff' : '#71717a',
                    boxShadow: isActive ? '0 4px 12px rgba(255,69,0,0.3)' : 'none',
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-20 transition-all duration-200"
              style={{ color: '#a1a1aa', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini ring chart (temperatura visual) ─────────────────────────────────────

function MiniRing({ quente, morno, frio }) {
  const total = quente + morno + frio;
  if (total === 0) return null;
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pQ = (quente / total) * circ;
  const pM = (morno / total) * circ;
  const pF = (frio / total) * circ;

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#27272a" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#ef4444" strokeWidth="5"
        strokeDasharray={`${pQ} ${circ - pQ}`} strokeDashoffset="0"
        strokeLinecap="round" transform="rotate(-90 24 24)" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#f59e0b" strokeWidth="5"
        strokeDasharray={`${pM} ${circ - pM}`} strokeDashoffset={`${-pQ}`}
        strokeLinecap="round" transform="rotate(-90 24 24)" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#3b82f6" strokeWidth="5"
        strokeDasharray={`${pF} ${circ - pF}`} strokeDashoffset={`${-(pQ + pM)}`}
        strokeLinecap="round" transform="rotate(-90 24 24)" />
    </svg>
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
  const [activeTab, setActiveTab] = useState('charts');

  useEffect(() => {
    setLoadingStats(true);
    Promise.all([api.resumoStats(periodo), api.evolucaoLeads()])
      .then(([s, ev]) => { setStats(s); setEvolucao(ev); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [periodo]);

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
    try { await api.exportarCSV(); }
    catch (e) { setErroExport(e.message || 'Erro ao exportar'); }
    finally { setExportando(false); }
  }, []);

  const totalLeads = leads.length;
  const fechados = leads.filter((l) => l.etapa_funil === 'Fechado').length;
  const perdidos = leads.filter((l) => l.etapa_funil === 'Perdido').length;
  const taxaConversao = totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0;
  const qtTemp = { quente: 0, morno: 0, frio: 0 };
  leads.forEach((l) => { if (l.temperatura in qtTemp) qtTemp[l.temperatura]++; });

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
      const f = acc.find((x) => x.motivo === m);
      if (f) f.total++; else acc.push({ motivo: m, total: 1 });
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1440px] mx-auto">

      {/* ═══════ HERO HEADER ═══════ */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8" style={{
        background: 'linear-gradient(135deg, rgba(255,69,0,0.08) 0%, rgba(255,69,0,0.02) 50%, rgba(249,115,22,0.06) 100%)',
        border: '1px solid rgba(255,69,0,0.12)',
      }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.04] blur-3xl" style={{ background: 'radial-gradient(circle, #FF4500, transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-[0.03] blur-3xl" style={{ background: '#f97316' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, #FF4500, #e03d00)',
                boxShadow: '0 8px 24px rgba(255,69,0,0.25)',
              }}
            >
              <Icons.ChartBar />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: '#fafafa' }}>
                Relatórios
              </h1>
              <p className="text-sm font-medium mt-0.5" style={{ color: '#71717a' }}>
                Análise completa dos seus leads e resultados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Período toggle */}
            <div
              className="flex items-center rounded-2xl p-1 gap-0.5"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
            >
              {PERIODOS.map((p) => {
                const isActive = periodo === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPeriodo(p.id)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer"
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #FF4500, #e03d00)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(255,69,0,0.3)',
                    } : { color: '#71717a' }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* CSV Export button */}
            <button
              onClick={handleExportar}
              disabled={exportando}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,69,0,0.08))',
                border: '1px solid rgba(255,69,0,0.25)',
                color: '#FF4500',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FF4500, #e03d00)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,69,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,69,0,0.15), rgba(255,69,0,0.08))';
                e.currentTarget.style.color = '#FF4500';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Icons.Download />
              {exportando ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>
      </div>

      {erroExport && (
        <div className="px-5 py-3.5 rounded-2xl text-sm font-medium flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          {erroExport}
        </div>
      )}

      {/* ═══════ STAT CARDS ═══════ */}
      {loadingLeads ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total de leads" value={totalLeads} sub="todos os cadastros" icon={Icons.Users} color="#FF4500" gradient="linear-gradient(135deg, #FF4500, #f97316)" />
          <StatCard label="Fechados" value={fechados} sub={`${taxaConversao}% taxa de conversão`} icon={Icons.Trophy} color="#22c55e" gradient="linear-gradient(135deg, #22c55e, #16a34a)" />
          <StatCard label="Perdidos" value={perdidos} sub={totalLeads > 0 ? `${Math.round((perdidos / totalLeads) * 100)}% do total` : '—'} icon={Icons.XCircle} color="#ef4444" gradient="linear-gradient(135deg, #ef4444, #dc2626)" />
          <StatCard label="Leads quentes" value={qtTemp.quente} sub={`${qtTemp.morno} mornos · ${qtTemp.frio} frios`} icon={Icons.Fire} color="#f59e0b" gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
        </div>
      )}

      {/* ═══════ TEMPERATURA BREAKDOWN ═══════ */}
      {!loadingLeads && totalLeads > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <MiniRing quente={qtTemp.quente} morno={qtTemp.morno} frio={qtTemp.frio} />
            <div className="flex-1 flex items-center gap-6 flex-wrap">
              {[
                { label: 'Quentes', value: qtTemp.quente, color: '#ef4444' },
                { label: 'Mornos',  value: qtTemp.morno,  color: '#f59e0b' },
                { label: 'Frios',   value: qtTemp.frio,   color: '#3b82f6' },
              ].map(({ label, value, color }) => {
                const pct = totalLeads > 0 ? Math.round((value / totalLeads) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}</span>
                    <span className="text-xs" style={{ color: '#52525b' }}>{label}</span>
                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs tabular-nums font-medium" style={{ color: '#52525b' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB SWITCHER ═══════ */}
      <div className="flex items-center gap-2">
        {[
          { id: 'charts', label: 'Gráficos', icon: Icons.Sparkles },
          { id: 'tabela', label: 'Tabela completa', icon: Icons.Table },
        ].map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            style={activeTab === id ? {
              background: 'rgba(255,69,0,0.12)', color: '#FF4500', border: '1px solid rgba(255,69,0,0.25)',
            } : {
              color: '#52525b', border: '1px solid transparent',
            }}
          >
            <TabIcon />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════ CONTENT ═══════ */}
      {activeTab === 'charts' && (
        loadingStats ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[0,1,2,3].map((i) => <SkeletonChart key={i} />)}
          </div>
        ) : (
          <Suspense fallback={<Spinner />}>
            <RelatoriosCharts
              dadosEtapa={dadosEtapa}
              dadosOrigem={dadosOrigem}
              dadosTipoBem={dadosTipoBem}
              dadosMotivos={dadosMotivos}
              evolucao={evolucao}
              stats={stats}
            />
          </Suspense>
        )
      )}

      {activeTab === 'tabela' && (
        loadingLeads ? (
          <div className="card p-5"><Spinner /></div>
        ) : (
          <TabelaLeads leads={leads} />
        )
      )}
    </div>
  );
}
