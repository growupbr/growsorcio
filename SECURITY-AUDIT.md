# GrowSorcio — Security Audit Report

**Data:** 2026-03-28  
**Versão auditada:** Estado do repositório em 2026-03-28  
**Auditor:** GitHub Copilot (análise estática de código)  
**Stack:** Node.js 20 + Express 4 + Supabase (PostgreSQL) + React 18 + Vite

---

## Resumo Executivo

| Severidade | Quantidade |
|------------|-----------|
| 🔴 CRÍTICO  | 4         |
| 🟠 ALTO     | 5         |
| 🟡 MÉDIO    | 7         |
| 🔵 BAIXO    | 3         |
| **Total**  | **19**    |

O GrowSorcio possui uma base sólida de segurança — autenticação via Supabase Auth é correta, CORS está configurado com whitelist, RLS está definido nas migrations e `organization_id` é sempre extraído do JWT. Entretanto, foram identificados **4 findings críticos** que devem ser resolvidos antes da abertura para usuários pagantes, especialmente a credencial Supabase hardcoded no código-fonte e a ausência de rate limiting e security headers.

---

## Findings

---

### [CRÍTICO] C1 — Credencial Supabase hardcoded no código-fonte

- **Localização:** `frontend/src/api/supabaseClient.js`
- **Descrição:** O arquivo `supabaseClient.js` contém a `supabaseAnonKey` como literal string no código-fonte em vez de usar variável de ambiente. A chave completa (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`) está em texto plano e foi comitada no git history, sendo também incluída nos bundles de produção gerados pelo Vite. Existe um segundo arquivo correto (`supabaseClient.ts`) que usa `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- **Risco:** Embora a `anon key` seja considerada pública pelo Supabase (é lida pelo browser), sua exposição no código-fonte e histórico git cria riscos quando combinada com políticas RLS frágeis. Mais grave: a duplicidade dos dois clientes (`.js` hardcoded e `.ts` seguro) cria risco real de qualquer componente que importe o `.js` bypassar silenciosamente o fluxo seguro. A chave está exposta em git history permanentemente.
- **Correção:**
  1. Deletar `frontend/src/api/supabaseClient.js` imediatamente: `git rm frontend/src/api/supabaseClient.js`
  2. Verificar que TODOS os imports usam `supabaseClient.ts` (busca por `supabaseClient.js` em imports)
  3. Limpar histórico git: `npx git-filter-repo --path frontend/src/api/supabaseClient.js --invert-paths`
  4. Revogar e regenerar a anon key no Supabase Dashboard → Settings → API Keys → Regenerate
  5. Atualizar `.env.production` e redesdobrar o frontend

---

### [CRÍTICO] C2 — Lead webhook sem autenticação quando variável de ambiente não está configurada

- **Localização:** `backend/routes/webhook.js` — `POST /api/webhook/lead`
- **Descrição:** A validação do webhook é condicional: `if (webhookSecret) { ... }`. Se a variável `LEAD_WEBHOOK_SECRET` não estiver definida no ambiente de produção, o bloco de validação é completamente ignorado e qualquer requisição POST cria leads no banco sem nenhuma verificação de origem.
- **Risco:** Qualquer bot ou atacante pode inundar o sistema com leads falsos (`POST /api/webhook/lead` com payload mínimo), poluindo o CRM de todos os tenants. Em produção, se a env var for esquecida no deploy, o endpoint fica aberto.
- **Correção:**
  1. Tornar o secret obrigatório — falhar no startup se não estiver definido:
     ```javascript
     const webhookSecret = process.env.LEAD_WEBHOOK_SECRET;
     if (!webhookSecret) throw new Error('[FATAL] LEAD_WEBHOOK_SECRET não configurado');
     ```
  2. Migrar para HMAC-SHA256 em vez de comparação de token simples:
     ```javascript
     const signature = crypto
       .createHmac('sha256', webhookSecret)
       .update(JSON.stringify(req.body))
       .digest('hex');
     const provided = req.headers['x-webhook-signature'] || '';
     if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(provided))) {
       return res.status(401).json({ erro: 'Assinatura inválida' });
     }
     ```
  3. Garantir que `LEAD_WEBHOOK_SECRET` está no checklist de variáveis de ambiente do deploy (Railway/Vercel)

---

### [CRÍTICO] C3 — Isolamento multi-tenant depende 100% de filtro manual (sem RLS como rede de segurança)

- **Localização:** `backend/middleware/auth.js` L109–111, todas as rotas em `backend/routes/`
- **Descrição:** O comentário no código é explícito: `"RLS não está configurado no Supabase — o isolamento é garantido pelo filtro manual .eq('organization_id', organizationId)"`. O backend usa o client `service_role` (que bypassa RLS completamente) em TODAS as queries de dados. As migrations definem RLS corretamente, mas o backend nunca usa um client autenticado com o JWT do usuário, então as policies nunca são consultadas.
- **Risco:** Violação P0 do princípio central do projeto. Qualquer desenvolvedor que adicione um novo endpoint e esqueça o `.eq('organization_id', req.organizationId)` expõe dados de TODOS os tenants. Não há defensas no banco — 100% da segurança está em código JavaScript que pode ter bugs, ser refatorado incorretamente ou ter um `return` antecipado que pule o filtro.
- **Correção (curto prazo):** Adicionar linting/grep no CI que bloqueia qualquer query Supabase sem `.eq('organization_id'` nas rotas de dados.
- **Correção (definitiva):** Migrar rotas de dados para `createUserClient(req.headers.authorization.slice(7))`:
  ```javascript
  // Em authMiddleware — trocar:
  req.supabase = supabase; // service_role — bypassa RLS
  // Por:
  req.supabase = createUserClient(token); // usa anon key + JWT — RLS ativo
  ```
  Isso move o enforcement de isolamento para o banco, tornando impossível vazar dados entre tenants por esquecimento de filtro.

---

### [CRÍTICO] C4 — Injeção de filtro PostgREST no duplicate check de leads

- **Localização:** `backend/routes/leads.js` L469–480 (endpoint `POST /api/leads`)
- **Descrição:** A verificação de duplicata usa string interpolation diretamente em filtro PostgREST:
  ```javascript
  const safeWa = String(whatsapp).replace(/"/g, '');
  dupQuery = dupQuery.or(`whatsapp.eq."${safeWa}",email.eq."${safeMail}"`);
  ```
  A "sanitização" remove apenas aspas duplas, mas PostgREST aceita outros caracteres especiais (`,`, `.`, `(`, `)`) como parte da sintaxe de filtro. Um atacante pode injetar predicados adicionais.
- **Risco:** Injeção de filtro pode expor dados de outros leads dentro da organização (ex: forçar busca por `restricao_cpf.eq.true`) ou manipular a lógica de deduplicação.
- **Correção:** Usar queries separadas em vez de `.or()` com interpolação:
  ```javascript
  // Busca separada por whatsapp
  const waCheck = whatsapp
    ? await db.from('leads').select('id').eq('organization_id', organizationId).eq('whatsapp', whatsapp).maybeSingle()
    : { data: null };
  // Busca separada por email
  const emailCheck = email
    ? await db.from('leads').select('id').eq('organization_id', organizationId).eq('email', email).maybeSingle()
    : { data: null };
  const isDuplicate = !!(waCheck.data || emailCheck.data);
  ```
  O client Supabase parametriza valores em `.eq()` automaticamente, eliminando o risco de injeção.

---

### [ALTO] A1 — Nenhum rate limiting em nenhuma rota da API

- **Localização:** `backend/server.js`
- **Descrição:** O servidor não possui `express-rate-limit` ou equivalente configurado em nível global ou por rota. O único rate limiting existente é um Map em memória no webhook de lead (`backend/routes/webhook.js`), que não cobre o restante da API.
- **Risco:** Brute force de tokens JWT em `/api/me`, enumeração de recursos (leads, interações), flood de requisições no billing, crash do servidor por sobrecarga. Em contexto SaaS, um único usuário malicioso pode degradar o serviço para todos os tenants.
- **Correção:** Instalar `express-rate-limit` e configurar por camada:
  ```javascript
  import rateLimit from 'express-rate-limit';
  // Global: 300 req/min por IP
  app.use(rateLimit({ windowMs: 60_000, max: 300 }));
  // Rotas de auth/billing: mais restrito
  const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 30, message: { erro: 'Muitas tentativas' } });
  app.use('/api/billing/checkout-public', authLimiter);
  app.use('/api/billing/pix', authLimiter);
  ```

---

### [ALTO] A2 — Nenhum security header configurado (sem Helmet)

- **Localização:** `backend/server.js`
- **Descrição:** O servidor Express não usa `helmet` nem configura headers de segurança manualmente. Isso significa ausência de: `Content-Security-Policy`, `Strict-Transport-Security` (HSTS), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`. Adicionalmente, `X-Powered-By: Express` está sendo enviado em todas as respostas, expondo a stack tecnológica.
- **Risco:** Ausência de CSP aumenta o impacto de qualquer XSS (permite exfiltração de tokens do `localStorage`). Ausência de HSTS habilita downgrade attacks em HTTPS. `X-Powered-By` facilita reconhecimento de vulnerabilidades específicas do Express.
- **Correção:**
  ```javascript
  import helmet from 'helmet';
  app.use(helmet()); // configura todos os headers de segurança com defaults seguros
  app.disable('x-powered-by'); // redundante com helmet, mas explícito
  ```
  CSP deve ser configurada para o contexto do frontend (domínios Supabase, Meta Pixel se aplicável).

---

### [ALTO] A3 — Webhook AbacatePay sem rate limiting e vulnerável a replay attack

- **Localização:** `backend/routes/billing.js` L171–248 (`POST /api/billing/webhook`)
- **Descrição:** O webhook de billing não tem rate limiting, e a validação usa apenas comparação de secret string sem timestamp ou nonce. O mesmo payload de `billing.paid` pode ser reenviado infinitas vezes por um atacante que possua o secret (ex: via log vazado ou interceptação).
- **Risco:** Replay attack permite reativar assinaturas expiradas ou duplicar processamento de pagamentos. Sem rate limiting, flood de webhooks pode causar alta carga de escrita no banco.
- **Correção:**
  1. Adicionar rate limiting no endpoint:
     ```javascript
     const webhookLimiter = rateLimit({ windowMs: 60_000, max: 100 });
     router.post('/webhook', webhookLimiter, express.raw({ type: 'application/json' }), ...);
     ```
  2. Verificar se AbacatePay envia `X-Webhook-Timestamp` e validar janela de 5 minutos
  3. Registrar `data.id` processados em tabela `webhook_events` para idempotência:
     ```javascript
     const { data: existing } = await supabase.from('webhook_events').select('id').eq('provider_id', data.id).maybeSingle();
     if (existing) return res.json({ received: true }); // idempotente
     ```

---

### [ALTO] A4 — Legacy org fallback pode atribuir usuário à organização de outro tenant

- **Localização:** `backend/middleware/auth.js` L33–40 (`inferOrganizationIdFallbackLegacy`)
- **Descrição:** A função `inferOrganizationIdFallbackLegacy()` consulta o banco e, se houver exatamente 1 organização, atribui automaticamente qualquer novo usuário a ela. Em um ambiente multi-tenant em crescimento, este código é uma bomba-relógio: entre o 1º e o 2º tenant, qualquer novo signup sem perfil criado corretamente é atribuído à organização do primeiro cliente.
- **Risco:** Cross-tenant data leak silencioso. O novo usuário passa a ver todos os leads, interações e dados do tenant original.
- **Correção:** Remover completamente `inferOrganizationIdFallbackLegacy()` e garantir que `createOrganizationForUser()` é sempre a única opção quando não há perfil:
  ```javascript
  async function ensureUserProfile(user) {
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('user_id', user.id).maybeSingle();
    if (profile?.organization_id) return profile.organization_id;
    // Sem fallback — sempre cria nova org
    return createOrganizationForUser(user);
  }
  ```

---

### [ALTO] A5 — Webhooks usam token simples em vez de HMAC (sem assinatura criptográfica)

- **Localização:** `backend/routes/webhook.js` (lead) + `backend/routes/billing.js` (AbacatePay)
- **Descrição:** Ambos os webhooks validam autenticidade comparando um secret em texto plano (`x-webhook-key` / `x-webhook-secret`). Embora o webhook de billing use `crypto.timingSafeEqual` (correto para evitar timing attacks), nenhum dos dois assina o payload com HMAC-SHA256. Um secret capturado em log ou tráfego de rede permite forjar qualquer evento.
- **Risco:** Forjamento de evento `billing.paid` ativa assinaturas sem pagamento real. Forjamento de leads cria entradas falsas em todos os tenants.
- **Correção:** Migrar para HMAC-SHA256 conforme padrão da indústria (GitHub, Stripe, Meta):
  ```javascript
  // Sender assina: X-Webhook-Signature: sha256=<hmac>
  // Receiver verifica:
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = req.headers['x-webhook-signature'] || '';
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided.padEnd(expected.length)))) {
    return res.status(401).json({ erro: 'Assinatura inválida' });
  }
  ```

---

### [MÉDIO] M1 — CORS permite requisições sem header Origin

- **Localização:** `backend/server.js` L12–23
- **Descrição:** A condição de CORS é `!origin || ORIGENS_PERMITIDAS.includes(origin)`. O `!origin` faz com que requisições sem header `Origin` (curl, scripts de servidor, requisições `file://`) passem sem validação.
- **Risco:** Ferramentas de automação e scripts externos podem fazer chamadas autenticadas à API sem restrição de CORS. Em ambientes de desenvolvimento com whitelist larga, isso é amplificado.
- **Correção:**
  ```javascript
  origin(origin, callback) {
    if (ORIGENS_PERMITIDAS.includes(origin)) return callback(null, true);
    return callback(new Error(`Origem não permitida: ${origin}`));
  }
  ```

---

### [MÉDIO] M2 — Busca de leads sem escape de caracteres ILIKE (risco de ReDoS/ILIKE abuse)

- **Localização:** `backend/routes/leads.js` — endpoint `GET /api/leads?busca=`
- **Descrição:** O parâmetro `busca` é interpolado diretamente em filtro PostgREST ILIKE sem escape dos caracteres especiais `%`, `_` e `\`, e sem limite de tamanho.
- **Risco:** Um `busca` com muitos `%` consecutivos pode causar scan completo da tabela. Sem limite de tamanho, strings longas aumentam a carga no Postgres.
- **Correção:**
  ```javascript
  if (busca) {
    const term = String(busca).trim().slice(0, 100); // limite de tamanho
    if (term.length < 2) return res.status(400).json({ erro: 'Busca mínima: 2 caracteres' });
    const escaped = term.replace(/[%_\\]/g, '\\$&'); // escapa chars especiais ILIKE
    query = query.or(`nome.ilike.%${escaped}%,whatsapp.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }
  ```

---

### [MÉDIO] M3 — CPF/CNPJ sem validação de formato em endpoints públicos de billing

- **Localização:** `backend/routes/billing.js` — `POST /checkout-public` e `POST /pix`
- **Descrição:** O campo `taxId` (CPF/CNPJ) é aceito se presente, mas sem validação de formato ou dígitos verificadores. Endpoints são públicos (sem auth middleware).
- **Risco:** Dados inválidos passam para o processador de pagamento (AbacatePay), causando falhas silenciosas. Potencial para tentativas de injeção via campo de documento.
- **Correção:** Implementar validação de CPF (11 dígitos, algoritmo Mod 11) e CNPJ (14 dígitos, algoritmo Mod 11) antes de repassar ao gateway.

---

### [MÉDIO] M4 — Email sem validação de formato em endpoints públicos de billing

- **Localização:** `backend/routes/billing.js` — `POST /checkout-public` e `POST /pix`
- **Descrição:** O campo `email` é verificado apenas por presença (`!email`), não por formato RFC válido.
- **Risco:** Emails inválidos são enviados ao AbacatePay e podem causar falhas no envio de confirmação de pagamento ao cliente.
- **Correção:** Adicionar validação simples antes do processamento:
  ```javascript
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) return res.status(400).json({ erro: 'Email inválido' });
  ```

---

### [MÉDIO] M5 — Rate limiting do webhook de lead está em memória (não persiste entre restarts)

- **Localização:** `backend/routes/webhook.js` — Map `_rateMap`
- **Descrição:** O rate limiting usa um `Map` em memória que é zerado a cada restart do servidor. Em caso de deploy contínuo, crash ou instâncias múltiplas no futuro, o limite é ineficaz.
- **Risco:** Atacante pode forçar restart do servidor (ex: via payload que causa erro não tratado) e limpar os contadores de rate limiting para reiniciar flood.
- **Correção:** Migrar para rate limiting via `express-rate-limit` com store em Redis ou memória compartilhada, ou usar solução externa (Upstash, Railway Redis).

---

### [MÉDIO] M6 — Dois clientes Supabase no frontend com risco de import incorreto

- **Localização:** `frontend/src/api/supabaseClient.js` (inseguro) + `frontend/src/api/supabaseClient.ts` (seguro)
- **Descrição:** Existem dois arquivos com o mesmo nome base mas extensões diferentes. O `.js` contém chave hardcoded; o `.ts` usa variáveis de ambiente. Qualquer componente que faça `import from './supabaseClient'` pode resolver para o arquivo errado dependendo da configuração do Vite/TypeScript.
- **Risco:** Regressão silenciosa — após resolução do C1, desenvolvedor pode criar novo arquivo `.js` sem perceber a duplicidade. Sem lint rule, o risco persiste.
- **Correção:** Deletar `supabaseClient.js` (parte da correção de C1). Adicionar rule ESLint para bloquear imports de arquivos `.js` quando existir equivalente `.ts`.

---

### [MÉDIO] M7 — JWT do usuário em localStorage sem CSP para mitigar XSS

- **Localização:** `frontend/src/hooks/useAuth.jsx`, `frontend/src/api/client.js`
- **Descrição:** O token JWT é armazenado em `localStorage` pelo Supabase Auth (padrão da biblioteca). Sem headers CSP no backend, qualquer XSS pode ler e exfiltrar o token.
- **Risco:** XSS + falta de CSP = Account takeover completo. O token permite autenticar e acessar todos os dados do tenant da vítima.
- **Correção:** A correção de A2 (Helmet/CSP) mitiga significativamente este risco. Não é necessário migrar para cookies HttpOnly se CSP estiver bem configurado.

---

### [BAIXO] B1 — Arquivo `leads.js.bak` no repositório

- **Localização:** `backend/routes/leads.js.bak`
- **Descrição:** Arquivo de backup com versão anterior do código de rotas de leads está comitado no repositório.
- **Risco:** Pode conter lógica descontinuada, queries sem filtro de `organization_id` ou outros padrões inseguros já corrigidos. Exposição de histórico de implementação.
- **Correção:** `git rm backend/routes/leads.js.bak && git commit -m "chore: remove backup file"`

---

### [BAIXO] B2 — `X-Powered-By: Express` exposto nas respostas

- **Localização:** `backend/server.js`
- **Descrição:** Express envia `X-Powered-By: Express` por padrão em todas as respostas HTTP. Este header é resolvido pela correção A2 (Helmet), mas merece registro específico.
- **Risco:** Facilita reconhecimento da stack e direcionamento de exploits específicos do Express.
- **Correção:** `app.disable('x-powered-by')` ou usar `helmet()` (que desabilita automaticamente).

---

### [BAIXO] B3 — `path-to-regexp` com vulnerabilidade ReDoS (backend) e `picomatch` (frontend)

- **Localização:** `backend/package.json` (dependência transitiva via Express), `frontend/package.json` (dependência transitiva)
- **Descrição:** `npm audit` identificou:
  - **Backend:** `path-to-regexp` — HIGH — ReDoS via múltiplos parâmetros de rota (CVE pendente)
  - **Frontend:** `picomatch` — HIGH — Method Injection em POSIX Character Classes (CVE pendente)
- **Risco:** `path-to-regexp` pode causar DoS via rotas malformadas. `picomatch` afeta apenas o build (Vite), não o runtime de produção.
- **Correção:**
  ```bash
  # Backend:
  cd backend && npm update && npm audit fix
  # Frontend:
  cd frontend && npm audit fix
  # Se não resolver automaticamente:
  npm audit fix --force  # avaliar breaking changes
  ```

---

## Plano de Ação Recomendado

### 🔴 Sprint 1 — Crítico (executar ANTES do go-live) — Esforço: ~1 dia

| Prioridade | Task | Esforço |
|-----------|------|---------|
| 1 | [C1] Deletar `supabaseClient.js`, limpar git history, rotacionar anon key | 2h |
| 2 | [C2] Tornar `LEAD_WEBHOOK_SECRET` obrigatório no startup | 30min |
| 3 | [C4] Refatorar duplicate check para queries separadas parametrizadas | 1h |
| 4 | [A4] Remover `inferOrganizationIdFallbackLegacy()` | 30min |

### 🟠 Sprint 2 — Alto (semana 1) — Esforço: ~1,5 dias

| Prioridade | Task | Esforço |
|-----------|------|---------|
| 5 | [A2] Instalar e configurar `helmet` com CSP | 2h |
| 6 | [A1] Implementar `express-rate-limit` global + rotas críticas | 2h |
| 7 | [A3] Rate limiting no webhook AbacatePay + idempotência via `webhook_events` | 3h |
| 8 | [C3] Migrar rotas de dados para `createUserClient()` (RLS ativo no banco) | 4h |
| 9 | [A5] Migrar webhooks para HMAC-SHA256 | 2h |

### 🟡 Sprint 3 — Médio (semana 2) — Esforço: ~1 dia

| Prioridade | Task | Esforço |
|-----------|------|---------|
| 10 | [M1] Remover `!origin` do CORS | 15min |
| 11 | [M2] Adicionar escape e limite de tamanho na busca de leads | 30min |
| 12 | [M3+M4] Validar CPF/CNPJ e email no billing público | 2h |
| 13 | [M5] Migrar rate limit do webhook para `express-rate-limit` | 1h |
| 14 | [B1] Deletar `leads.js.bak` | 5min |
| 15 | [B3] Executar `npm audit fix` em backend e frontend | 30min |

### 🔵 Backlog — Baixo (próximo mês)

| Task | Esforço |
|------|---------|
| [M6] ESLint rule para imports de supabase client | 1h |
| [M7] Revisar configuração de CSP após A2 estar feito | 1h |
| [B2] Confirmar que X-Powered-By foi removido pelo helmet | 5min |

---

## Itens que requerem ação manual (fora do código)

- [ ] Executar `npm audit` no backend e frontend após atualizar dependências
- [ ] Rotacionar `SUPABASE_ANON_KEY` no Supabase Dashboard após remoção de `supabaseClient.js`
- [ ] Verificar se `LEAD_WEBHOOK_SECRET` está configurado em TODOS os ambientes de deploy (Railway, Vercel)
- [ ] Confirmar com AbacatePay se o webhook deles suporta HMAC ou qual mecanismo de assinatura está disponível
- [ ] Revisar logs de produção para verificar se houve acessos suspeitos ao endpoint `/api/webhook/lead`

---

*Relatório gerado por análise estática de código. Auditoria dinâmica (pentesting) e revisão de configurações de infraestrutura (Railway, Vercel, Supabase Dashboard) são recomendadas como etapa complementar.*
