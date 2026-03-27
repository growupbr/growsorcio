# GrowSorcio — Histórico de Tasks Concluídas

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
