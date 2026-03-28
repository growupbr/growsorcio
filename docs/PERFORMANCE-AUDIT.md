# Auditoria de Performance — GrowSorcio
**Data:** 2026-03-28  
**Stack:** React 18 + Vite 5 · Node.js 20 + Express 4 · Supabase PostgreSQL  

---

## O que foi encontrado

### Backend — Crítico

| ID | Endpoint | Problema | Impacto |
|----|----------|----------|---------|
| B1 | `GET /api/leads/stats/resumo` | `SELECT *` em todos os leads + query de cadência sequencial | Payload desnecessário, latência dobrada |
| B2 | `GET /api/leads/` | Sem paginação — retornava todos os leads de uma vez | Memória irrestrita, latência cresce linear com base |
| B3 | `GET /api/interacoes/` | Sem `LIMIT`, retornava todas as interações sem restrição | Risco de timeout em contas com histórico longo |

### Frontend — Alto

| ID | Local | Problema | Impacto |
|----|-------|----------|---------|
| F1 | `useFunilStages.js` | Fetch à API em todo mount do Kanban (etapas são dados estáticos) | RTT desnecessário a cada navegação |
| F2 | `Kanban.jsx › Coluna` | Componente sem `React.memo` — re-renderizava todas as colunas em qualquer mudança de estado (drag, hover, modal) | Jank perceptível em mobile com muitos leads |

### Supabase — Médio

| ID | Tabela | Index faltando |
|----|--------|----------------|
| DB1 | `leads` | `(organization_id, criado_em)` — filtros de período em stats e relatórios |
| DB2 | `leads` | `(organization_id, owner_user_id)` — consultas com `userScopeEnabled` |
| DB3 | `cadencia_itens` | `(organization_id, concluido, data_prevista)` — pendências do dia no Dashboard |
| DB4 | `interacoes` | `(lead_id, criado_em DESC)` — ordenação do histórico por lead |

### O que já estava ótimo (sem ação necessária)

- React.lazy() + Suspense em **todas** as páginas ✅  
- `React.memo` em `LeadCard` e `BlessedBadge` ✅  
- `Promise.all` em `GET /leads/:id` (interações + cadência paralelas) ✅  
- `useMemo` em `leadsPorEtapa` e `totalPorEtapa` no Kanban ✅  
- `DashboardCharts` e `RelatoriosCharts` com lazy load ✅  
- Índices principais em `leads`, `interacoes`, `cadencia_itens` no init ✅  

---

## O que foi implementado

### Etapa A — `GET /api/leads/stats/resumo`
**Arquivo:** `backend/routes/leads.js`

- `SELECT *` substituído por lista explícita de 11 campos (`id, nome, etapa_funil, temperatura, origem, tipo_de_bem, restricao_cpf, snooze_ate, data_proxima_acao, tipo_proxima_acao, criado_em`)
- Query de cadência também teve campos minimizados
- As duas queries passaram a rodar em **paralelo** via `Promise.all`
- **Ganho estimado:** ~40–60% de redução no payload + latência da cadência eliminada

### Etapa B — `GET /api/leads/` (paginação opt-in)
**Arquivo:** `backend/routes/leads.js`

- Sem `?page`: retorna array com hard-cap de 500 registros (retrocompatível — todos os callers existentes continuam funcionando)
- Com `?page=N&limit=L`: retorna envelope `{ data, total, page, totalPages }`, máximo 100/página
- Count usa `SELECT id` com `{ count: 'exact', head: true }` (sem varredura de colunas)

### Etapa C — `GET /api/interacoes/` (paginação opt-in)
**Arquivo:** `backend/routes/interacoes.js`

- Sem `?page`: retorna até 50 registros (`.limit(50)`)
- Com `?page=N`: envelope paginado `{ data, total, page, totalPages }`, máximo 100/página

### Etapa D — `useFunilStages` com cache sessionStorage
**Arquivo:** `frontend/src/hooks/useFunilStages.js`

- Cache key: `growsorcio:etapas` (scoped à aba, não persiste entre sessões)
- `useState` inicializado **sincronamente** a partir do cache → `carregando` começa `false` quando há cache → render instantâneo sem spinner
- `recarregar(true)` força refresh da API (usado por Config e onboarding)
- Fallback para `ETAPAS_PADRAO` (14 etapas fixas) em caso de erro, somente se não há estado vigente

### Etapa E — `React.memo` em `Coluna` + `useCallback` nos handlers
**Arquivo:** `frontend/src/pages/Kanban.jsx`

- `Coluna` envolta em `React.memo` → re-render ocorre apenas quando suas props mudam
- `handleToggleSelect`, `handleAdicionarLead`, `handleIniciarAdd`, `handleCancelarAdd` envolvidos em `useCallback` no componente pai
- `onIniciarAdd` refatorado para receber `etapaNome` como parâmetro — elimina closure inline no `.map()` que invalidava o memo
- **Efeito:** durante drag/hover, apenas a coluna cujo `isOver` muda re-renderiza; as demais ficam estáveis

### Etapa F — Migration de índices (`20260328_performance_indices.sql`)
**Arquivo:** `supabase/migrations/20260328_performance_indices.sql`

Todos criados com `CONCURRENTLY IF NOT EXISTS` para zero downtime:

| Index | Tabela | Colunas |
|-------|--------|---------|
| `leads_org_criado_em_idx` | `leads` | `(organization_id, criado_em)` |
| `leads_org_owner_idx` | `leads` | `(organization_id, owner_user_id)` |
| `cadencia_concluido_data_idx` | `cadencia_itens` | `(organization_id, concluido, data_prevista)` |
| `interacoes_created_at_idx` | `interacoes` | `(lead_id, criado_em DESC)` |

---

## O que foi deixado para depois e por quê

| Otimização | Motivo do adiamento |
|------------|---------------------|
| **Virtualização de listas** (`@tanstack/react-virtual`) | Risco de quebrar funcionalidade de drag-and-drop (`@dnd-kit`) em mobile; requer testes de regressão extensivos |
| **React Query / SWR** | Mudança arquitetural significativa; adoção gradual recomendada começando por endpoints de alta frequência |
| **Agregações no Postgres** para stats | Adiciona complexidade de manutenção (funções SQL); ganho marginal dado que SELECT já foi reduzido a 11 campos |
| **Fila assíncrona para webhooks** (Bull/BullMQ) | INSERT unitário já roda <100ms; volume atual não justifica infraestrutura de queue |

---

## Índices criados no Supabase

Ver detalhes completos em [`supabase/migrations/20260328_performance_indices.sql`](../supabase/migrations/20260328_performance_indices.sql).

### Índices pré-existentes (20260313_init_crm.sql)
- `leads_org_idx` — `leads(organization_id)`  
- `leads_org_etapa_idx` — `leads(organization_id, etapa_funil)`  
- `leads_org_temp_idx` — `leads(organization_id, temperatura)`  
- `leads_org_origem_idx` — `leads(organization_id, origem)`  
- `leads_org_proxima_acao_idx` — `leads(organization_id, data_proxima_acao)`  
- `interacoes_org_lead_idx` — `interacoes(organization_id, lead_id)`  
- `cadencia_org_lead_idx` — `cadencia_itens(organization_id, lead_id)`  

### Índices adicionados nesta auditoria
- `leads_org_criado_em_idx` — filtros de período em relatórios  
- `leads_org_owner_idx` — consultas com escopo de usuário (Pro+)  
- `cadencia_concluido_data_idx` — pendências do dia no Dashboard  
- `interacoes_created_at_idx` — ordenação do histórico por lead  

---

## Recomendações futuras

1. **Paginação no frontend** — Implementar cursor-based pagination nas páginas de Leads e Relatórios, consumindo o envelope `{ data, total, page, totalPages }` já disponível na API
2. **Migração para React Query** — Começar por `useLeads()` e `useInteracoes()`: cache automático, deduplicação de requests, stale-while-revalidate
3. **Virtualização do Kanban** — Após cobertura de testes E2E de DnD mobile, considerar `@tanstack/react-virtual` para colunas com >50 cards
4. **Monitoramento de queries lentas** — Ativar `pg_stat_statements` no Supabase e alertar queries >200ms
5. **Compressão de payload** — Habilitar `compression` middleware no Express para respostas JSON >1KB
