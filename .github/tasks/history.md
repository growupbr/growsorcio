# GrowSorcio — Histórico de Tasks Concluídas

---

## [x] [FIX] Build Vercel — JSX em arquivo .js (useAtividades)

**Responsável:** Matheus
**Data de conclusão:** 2026-03-28

- [x] Varredura de todos os `.js` em `frontend/src/` com JSX (grep por `<[A-Z]` e `</`)
- [x] Único arquivo afetado: `frontend/src/hooks/useAtividades.js` (linha 69-73: `<AtividadesContext.Provider>`)
- [x] Renomeado para `useAtividades.jsx`
- [x] Todos os imports (`App.jsx`, `Kanban.jsx`, `Dashboard.jsx`, `AtividadesPendentes.jsx`) já usavam caminho sem extensão — nenhuma alteração necessária
- [x] Build local validado: `✓ built in 4.06s` sem erros

---

## [x] [FEAT] LGPD — Banner de cookies, Política de Privacidade e Direitos do Titular

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

- [x] Migration `consent_records` com RLS por `organization_id` (`supabase/migrations/20260328_consent_records.sql`)
- [x] Hook `useCookieConsent.js` — `localStorage` key `growsorcio_cookie_consent`, versão `2026-03-28`
- [x] Componente `CookieBanner.jsx` — fixed bottom, `role="dialog"`, 3 ações, aria-live, auto-focus
- [x] Componente `CookieModal.jsx` — 2 categorias (essential 2 itens, functional 5 itens), toggles, fechar com Escape
- [x] Página `/privacidade` — 10 seções LGPD art. 7/18/33 em pt-BR
- [x] Página `/cookies` — tabela de 7 armazenamentos com nome, local, tipo, duração e finalidade
- [x] Rota backend `GET /api/minha-conta/meus-dados` — portabilidade: conta + perfil + consentimentos + estatísticas
- [x] Rota backend `DELETE /api/minha-conta/excluir-conta` — anonimização + assinatura global revogada + registro de auditoria

---

## [x] [FEAT] Redesenho Gamificação — Insígnias por Nível de Faturamento + Popup

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

- [x] Backend `GET /api/leads/stats/faturamento` (SUM valor_da_carta WHERE etapa_funil = 'Fechado', escopado por organization_id)
- [x] Frontend API `faturamentoAcumulado()` em `client.js` (cache 5 min)
- [x] Hook `useFaturamento.js` — fetch com cancelamento e estado loading/erro
- [x] `GamificationBadge.jsx` redesenhado — 10 níveis, SVG badges inline, barra #FF4500
- [x] `LevelModal` inline — overlay blur, lista dos 10 níveis, "Você está aqui" com borda #FF4500
- [x] `TopBar.jsx` atualizado — removida prop `volume` (agora auto-fetching interno)
- [x] Níveis oficiais aplicados (Iniciando Jornada → Legado Eterno)

---

## [x] [FEAT] Funil de Conversão — Lógica Cumulativa + Etapas Dinâmicas

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

- [x] Etapa 1: Refatorar `FunilConversao` em `DashboardCharts.jsx` — aceitar `etapas` (do `useFunilStages`), calcular contagem cumulativa, exibir card de descartados separado, skeleton, estado vazio e tooltip corrigido
- [x] Etapa 2: Atualizar `Dashboard.jsx` — importar `useFunilStages`, passar `etapas` e `carregandoEtapas` para `<DashboardCharts>`
- [x] Etapa 3: Validar build sem erros (`npm run build`)
- [x] `server.js` — linha `app.use('/api/minha-conta', authMiddleware, require('./routes/minha-conta'))`
- [x] `Checkout.jsx` — checkbox aceite + botão desabilitado sem aceite
- [x] `App.jsx` — `CookieController`, lazy Privacidade + PoliticaCookies, rotas `/privacidade` e `/cookies` (app + landing)
- [x] `LandingPage.jsx` — footer com links `/privacidade` e `/cookies`

---

## [x] [UI] Dashboard — Remover estética genérica de IA

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

- [x] MetricaCard: remover gradiente + glow, reduzir número para text-2xl, borda rgba(255,255,255,0.1)
- [x] OrigemCard: bg-white/5, borda sutil, ícone neutro, paleta restrita (remover roxo)
- [x] RelStatCard: remover glow blur + gradient bar, texto-2xl, apenas Total em #FF4500
- [x] Tabs visão/relatórios: remover gradiente e shadow, usar fundo flat rgba(255,69,0,0.12)
- [x] Botão exportar CSV: remover gradiente → flat rgba
- [x] index.css .card: remover box-shadow pesado, borda rgba(255,255,255,0.08)
- [x] index.css .card-metric:hover: remover orange glow

---

## [x] [UI] Correções visuais do Dashboard no mobile

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

### `src/components/TopBar.jsx`
- [x] Logo adicionada no lado esquerdo da TopBar, visível apenas em mobile (`md:hidden`). Resolve ausência do logo em telas &lt;768px onde a Sidebar fica oculta.

### `src/components/MetricaCard.jsx`
- [x] `pr-12` reduzido para `pr-8` no label — evita que texto seja cortado em colunas de 2 no mobile (375px)
- [x] Ícone: `top-5 right-5 p-2.5` → `top-4 right-4 p-2` — fica menos intrusivo em cards pequenos

### `src/pages/Dashboard.jsx`
- [x] Botão "Novo lead" removido do header do Dashboard. Apenas o Kanban deve ter ação de cadastro.
- [x] Import `QuickAddModal` e state `showModal` removidos (não havia mais trigger após remoção do botão)

### `src/components/GamificationBadge.jsx`
- [x] Visual completamente redesenhado: fundo neutro `rgba(255,255,255,0.03)`, sem glow/neon condicional
- [x] Barra de progresso sólida `#FF4500` (era gradiente cor-do-nível)
- [x] 3 linhas: nome+volume / barra / percentual+meta. Layout previsível e clean.
- [x] Imports de `Gem`, `ShieldCheck`, `Target`, `Lightbulb` mantidos (usados pelo array LEVELS)
- [x] Removido `neonBorder` do render — condições especiais por nível ficam apenas na lógica, não no visual

---

## [x] [FEAT] DnD mobile improvements — Kanban

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

### `src/pages/Kanban.jsx`
- [x] **Auto-scroll horizontal durante drag** — `boardRef` no container + `pointermove`/`touchmove` global rastreando `pointerXRef`. Loop `rAF` ativo apenas durante drag (`isDraggingRef`). Zona de ativação 100px, velocidade proporcional até 14px/frame. Inicia em `handleDragStart`, para em `handleDragEnd`.
- [x] **Long press 1 segundo** — `TouchSensor` atualizado de `delay: 250ms` para `delay: 1000ms, tolerance: 5`. Evita arrastar acidentalmente ao rolar.
- [x] **Colunas recolhíveis** — Estado `colunasRecolhidas` (boolean). Botão toggle "Recolher/Expandir" no header com ícones `CollapseIcon`/`ExpandIcon`. Prop `recolhida` em `Coluna`: modo compacto 52px com nome vertical (`writing-mode: vertical-rl`) + dot de cor + contador. Transição `duration-200`.

---

## [x] [FIX] WhatsApp mobile + performance de cards no Kanban

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

### `src/utils/waWindow.js`
- [x] Adicionado `isMobile()` via `navigator.userAgent`
- [x] Mobile: usa `window.open(url, '_blank', 'noopener,noreferrer')` — sem parâmetros de popup que o mobile ignora
- [x] Desktop: mantém singleton com popup 480×700 (comportamento anterior)

### `src/pages/LeadPerfil.jsx`
- [x] URL do Click-to-Zap trocada de `https://web.whatsapp.com/send?phone=` para `https://wa.me/{phone}?text=...`
- [x] Mensagem pré-preenchida com nome e tipo de bem do lead (`encodeURIComponent`)
- [x] Funciona tanto no app nativo (mobile) quanto no WhatsApp Web (desktop)

### `src/pages/Kanban.jsx`
- [x] `import React` adicionado (necessário para `React.memo`)
- [x] `BlessedBadge` envolvido em `React.memo` — não re-renderiza se os campos Blessed do lead não mudarem
- [x] `LeadCard` envolvido em `React.memo` — evita re-render de todos os cards ao mover/hover/selecionar outro card

---

## [x] [PERFORMANCE] Cache e otimização — Dashboard, Propostas, Lead, Calculadora

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-27

### `src/api/client.js`
- [x] `resumoStats` TTL: 20 s → 2 min (evita refetch a cada troca de período/remontagem do Dashboard)
- [x] `evolucaoLeads` TTL: 20 s → 5 min (dados de evolução mudam raramente no dia)
- [x] `listarLeads` TTL: 15 s → 30 s (reduz round-trips no Kanban e na aba Relatórios)
- [x] `buscarLead(id)` — adicionado `cacheTTL: 30 s` + deduplicação inflight (elimina refetch ao abrir/fechar perfil no Kanban; invalidado automaticamente por `_invalidate(['/leads'])` nas mutações)

### `src/pages/Propostas.jsx`
- [x] Adicionado `useMemo` nos cálculos financeiros de `DocumentoA4` (só recalcula quando `valorCredito`, `prazo`, `parcela` ou `taxaAdm` mudam — campos de texto/cor não disparam recálculo)
- [x] Estado do formulário persistido em `sessionStorage` (`growsorcio:propostas:dados`) — dados sobrevivem a troca de rota com `React.lazy()` sem resetar para os valores padrão

### `src/pages/Calculadora.jsx`
- [x] `handleCopiarTexto` envolvido em `useCallback([res, valorCreditoStr, showToast])` — referência estável entre renders
- [x] `handleBaixarImagem` envolvido em `useCallback([exportRef, exporting, gerarNomeArquivo, showToast])` — referência estável entre renders
- Cálculos do `res` já estavam em `useMemo` — mantidos sem alteração

---

## [x] [UI] Melhorar GamificationBadge

**Responsável:** Luiz  
**Data de conclusão:** 2026-03-27

- [x] Adicionar `formatCompact()` para exibir volume de forma legível (R$ 12,5M, R$ 1,2B)
- [x] Linha 1: ícone do nível + nome do nível + volume vendido atual
- [x] Linha 2: barra de progresso + próxima meta (threshold + nome com cor do nível)
- [x] Remover `%` numérico da barra
- [x] Remover tooltip (hover) — info agora sempre visível inline
- [x] Remover import `useState` desnecessário
- [x] `minWidth` ajustado de 132 para 180px para acomodar próxima meta

**Arquivo alterado:** `frontend/src/components/GamificationBadge.jsx`

---

## [x] [UI] Reorganizar navegação mobile

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

- [x] `BottomNavBar.jsx`: remover GrowIA da nav mobile
- [x] `BottomNavBar.jsx`: adicionar Propostas (FileText), Calculadora (Calculator), WhatsApp/Conversas (MessageCircle)
- [x] GrowIA continua visível apenas na Sidebar desktop (sem alteração no `Sidebar.jsx`)

---

## [x] [FEAT] Check de atividades pendentes: Kanban + Dashboard

**Responsável:** Matheus  
**Data de conclusão:** 2026-03-28

- [x] `backend/routes/cadencia.js`: `GET /api/cadencia/pendentes?lead_id=X` (organização extraída do JWT)
- [x] `backend/routes/cadencia.js`: `PATCH /:id/concluir` registra interação automática (tipo: Anotação)
- [x] `frontend/src/api/client.js`: `listarCadenciaPendentes`
- [x] `frontend/src/hooks/useAtividades.js`: Context compartilhado com `concluir()`, `getByLead()`, `countByLead()`
- [x] `frontend/src/components/AtividadesPendentes.jsx`: dropdown inline para LeadCard com swipe mobile
- [x] `frontend/src/App.jsx`: envolver AppLayout com `AtividadesProvider`
- [x] `frontend/src/pages/Kanban.jsx`: badge "N pendentes" + dropdown no `LeadCard`
- [x] `frontend/src/pages/Dashboard.jsx`: checkboxes com animação + link do lead na cadência hoje

