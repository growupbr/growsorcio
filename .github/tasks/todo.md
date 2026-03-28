# GrowSorcio — Backlog Ativo

## [SEC] C1 — Remover credencial Supabase hardcoded do código-fonte

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** CRÍTICA — executar antes do go-live  
**Referência:** SECURITY-AUDIT.md — Finding C1

- [ ] Etapa 1: `git rm frontend/src/api/supabaseClient.js`
- [ ] Etapa 2: Verificar que todos os imports usam `supabaseClient.ts` (`grep -r "supabaseClient.js" frontend/src/`)
- [ ] Etapa 3: Limpar git history: `npx git-filter-repo --path frontend/src/api/supabaseClient.js --invert-paths`
- [ ] Etapa 4: Revogar e regenerar `anon key` no Supabase Dashboard → Settings → API Keys
- [ ] Etapa 5: Atualizar `VITE_SUPABASE_ANON_KEY` em `.env.production` e redesdobrar frontend

---

## [SEC] C2 — Webhook de leads sem autenticação quando env var ausente

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** CRÍTICA — executar antes do go-live  
**Referência:** SECURITY-AUDIT.md — Finding C2

- [ ] Etapa 1: Tornar `LEAD_WEBHOOK_SECRET` obrigatório — falhar no startup se não configurado
- [ ] Etapa 2: Migrar validação para HMAC-SHA256 (`X-Webhook-Signature: sha256=<hmac>`)
- [ ] Etapa 3: Adicionar `LEAD_WEBHOOK_SECRET` ao checklist de variáveis de ambiente do deploy

---

## [SEC] C3 — Isolar multi-tenancy no banco (RLS ativo via createUserClient)

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** CRÍTICA — necessário para go-live seguro  
**Referência:** SECURITY-AUDIT.md — Finding C3

- [ ] Etapa 1: Em `authMiddleware`, trocar `req.supabase = supabase` (service_role) por `req.supabase = createUserClient(token)`
- [ ] Etapa 2: Testar todas as rotas protegidas — garantir que RLS não bloqueia queries válidas
- [ ] Etapa 3: Manter `supabase` (service_role) apenas em webhooks e operações administrativas explícitas
- [ ] Etapa 4: Validação local — verificar que tenant A não consegue acessar dados do tenant B

---

## [SEC] C4 — Corrigir injeção de filtro PostgREST no duplicate check de leads

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** CRÍTICA  
**Referência:** SECURITY-AUDIT.md — Finding C4

- [ ] Etapa 1: Substituir `.or()` com string interpolation por queries separadas com `.eq()` parametrizado
- [ ] Etapa 2: Testar criação de lead com whatsapp/email que contenham caracteres especiais PostgREST (`,`, `.`, `(`, `)`)
- [ ] Etapa 3: Garantir que deduplicação continua funcionando corretamente após refatoração

---

## [SEC] A1 — Implementar rate limiting global na API

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** ALTA  
**Referência:** SECURITY-AUDIT.md — Finding A1

- [ ] Etapa 1: Instalar `express-rate-limit` no backend
- [ ] Etapa 2: Configurar limiter global (300 req/min por IP) em `server.js`
- [ ] Etapa 3: Configurar limiter restrito (30 req/15min) nos endpoints públicos de billing (`/checkout-public`, `/pix`)
- [ ] Etapa 4: Substituir rate limiting in-memory do webhook de lead pelo `express-rate-limit`

---

## [SEC] A2 — Configurar security headers com Helmet

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** ALTA  
**Referência:** SECURITY-AUDIT.md — Finding A2

- [ ] Etapa 1: Instalar `helmet` no backend (`npm install helmet`)
- [ ] Etapa 2: Adicionar `app.use(helmet())` em `server.js` antes das rotas

---

## [FEAT] Funil de Conversão — Lógica Cumulativa + Etapas Dinâmicas

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** MÉDIA

- [x] Etapa 1: Refatorar `FunilConversao` em `DashboardCharts.jsx` — aceitar `etapas` (do `useFunilStages`), calcular contagem cumulativa, exibir card de descartados separado, skeleton, estado vazio e tooltip corrigido
- [x] Etapa 2: Atualizar `Dashboard.jsx` — importar `useFunilStages`, passar `etapas` e `carregandoEtapas` para `<DashboardCharts>`
- [x] Etapa 3: Validar build sem erros (`npm run build`)

---

---

## [SEC] A3 — Rate limiting e idempotência no webhook AbacatePay

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** ALTA  
**Referência:** SECURITY-AUDIT.md — Finding A3

- [ ] Etapa 1: Adicionar `express-rate-limit` no endpoint `POST /api/billing/webhook`
- [ ] Etapa 2: Criar migration para tabela `webhook_events` (campos: `provider_id`, `provider`, `processed_at`)
- [ ] Etapa 3: No handler do webhook, verificar se `data.id` já foi processado antes de executar
- [ ] Etapa 4: Confirmar com AbacatePay se enviam `X-Webhook-Timestamp` para validação de janela de tempo

---

## [SEC] A4 — Remover legacy org fallback (risco cross-tenant)

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** ALTA  
**Referência:** SECURITY-AUDIT.md — Finding A4

- [ ] Etapa 1: Remover função `inferOrganizationIdFallbackLegacy()` de `backend/middleware/auth.js`
- [ ] Etapa 2: Simplificar `ensureUserProfile()` para sempre chamar `createOrganizationForUser()` quando não há perfil
- [ ] Etapa 3: Testar signup de novo usuário — garantir que org própria é criada corretamente

---

## [SEC] A5 — Migrar webhooks para HMAC-SHA256

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** ALTA  
**Referência:** SECURITY-AUDIT.md — Finding A5

- [ ] Etapa 1: Implementar verificação HMAC-SHA256 no webhook de lead (`backend/routes/webhook.js`)
- [ ] Etapa 2: Implementar verificação HMAC-SHA256 no webhook AbacatePay (`backend/routes/billing.js`)
- [ ] Etapa 3: Atualizar documentação de integração com o novo formato de assinatura esperado
- [ ] Etapa 4: Confirmar com Meta Ads e AbacatePay quais headers de assinatura eles enviam

---

## [FASE 6] QA Mobile Real Device — Pendente

- [ ] Testar Kanban drag touch (iPhone 14 Pro / Chrome DevTools)
- [ ] Testar scroll snap de colunas (Galaxy S22 / 360px)
- [ ] Verificar Dashboard sem scroll horizontal (iPhone SE / 375px)
- [ ] Verificar LeadPerfil modal com scroll interno
- [ ] Confirmar Bottom Nav com active state correto por rota
- [ ] Testar teclado numérico em campos de valor (LeadForm)
- [ ] Validar botão WhatsApp no mobile (real device — abrir app nativo)
- [ ] Testar auto-scroll do kanban em drag próximo às bordas (mobile e desktop)
- [ ] Validar long press 1s antes do drag não conflitar com tap para abrir lead
- [ ] Validar colunas recolhíveis: modo compacto renderiza droppable zone corretamente
- [ ] Validar logo no mobile na TopBar (375px, dark mode)
- [ ] Validar GamificationBadge redesenhado em diferentes volumes de teste

---

## [REFACTOR] Performance — Auditoria completa e otimizações de carregamento

**Responsável:** Matheus  
**Data de abertura:** 2026-03-28  
**Prioridade:** ALTA  
**Skills:** vercel-react-best-practices, supabase-postgres-best-practices

- [ ] Etapa A: Backend — `GET /api/leads/stats/resumo`: trocar `SELECT *` por campos mínimos + `Promise.all` para query de cadência
- [ ] Etapa B: Backend — `GET /api/leads/`: adicionar paginação com resposta `{data, total, page, totalPages}`
- [ ] Etapa C: Backend — `GET /api/interacoes/`: adicionar `limit(50)` por padrão + parâmetros `page/limit`
- [ ] Etapa D: Frontend — `useFunilStages.js`: cache de etapas em `sessionStorage` por `organization_id`
- [ ] Etapa E: Frontend — `Kanban.jsx`: `React.memo()` nos componentes de card + `useCallback` nos handlers
- [ ] Etapa F: Supabase — Migration `20260328_performance_indices.sql` com 4 índices faltantes
- [ ] Etapa G: Docs — Gerar `docs/PERFORMANCE-AUDIT.md`

