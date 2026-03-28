# GrowSorcio — Backlog Ativo

## [FEAT] Click-to-Zap mensagens dinâmicas por etapa

**Responsável:** Matheus  
**Data:** 2026-03-28  
**Prioridade:** ALTA

- [ ] Etapa 1: Migration SQL — message_template em funnel_stages + closing_message em organizations
- [ ] Etapa 2: Backend funil.js — aceitar message_template no PUT + GET/PATCH /api/funil/org-settings
- [ ] Etapa 3: frontend/src/utils/whatsapp.js — buildWhatsappMessage + buildWhatsappLink + mensagens padrão SDR
- [ ] Etapa 4: client.js — getOrgSettings() e updateOrgSettings()
- [ ] Etapa 5: Kanban.jsx — LeadCard com botão Zap dinâmico + botão encerramento + registro de interação
- [ ] Etapa 6: Config.jsx — editor de template por etapa + ClosingMessageSection global

---

## [SEC] C1 — Remover credencial Supabase hardcoded

**Data:** 2026-03-28 | **Prioridade:** CRÍTICA

- [ ] Etapa 1: git rm frontend/src/api/supabaseClient.js
- [ ] Etapa 2: Verificar que imports usam supabaseClient.ts
- [ ] Etapa 3: Limpar git history via git-filter-repo
- [ ] Etapa 4: Revogar e regenerar anon key no Supabase Dashboard
- [ ] Etapa 5: Atualizar VITE_SUPABASE_ANON_KEY e redesdobrar frontend

---

## [SEC] C2 — Webhook sem auth quando env var ausente

**Data:** 2026-03-28 | **Prioridade:** CRÍTICA

- [ ] Etapa 1: LEAD_WEBHOOK_SECRET obrigatório no startup
- [ ] Etapa 2: Migrar validação para HMAC-SHA256
- [ ] Etapa 3: Adicionar ao checklist de variáveis de deploy

---

## [SEC] C3 — RLS via createUserClient

**Data:** 2026-03-28 | **Prioridade:** CRÍTICA

- [ ] Etapa 1: Trocar req.supabase para createUserClient(token) no authMiddleware
- [ ] Etapa 2: Testar todas as rotas protegidas
- [ ] Etapa 3: Manter service_role apenas em webhooks e ops admin
- [ ] Etapa 4: Validar isolamento entre tenants A/B

---

## [SEC] C4 — Injeção PostgREST no duplicate check

**Data:** 2026-03-28 | **Prioridade:** CRÍTICA

- [ ] Etapa 1: Substituir .or() com string interpolation por .eq() parametrizado
- [ ] Etapa 2: Testar caracteres especiais PostgREST
- [ ] Etapa 3: Validar deduplicação após refatoração

---

## [SEC] A1 — Rate limiting global na API

**Data:** 2026-03-28 | **Prioridade:** ALTA

- [ ] Etapa 1: Instalar express-rate-limit
- [ ] Etapa 2: Limiter global 200 req/min por IP no server.js
- [ ] Etapa 3: Limiter restrito 5 req/min em auth e webhook
