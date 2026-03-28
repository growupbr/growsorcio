-- GrowSorcio: Índices de performance — 2026-03-28
-- Complementa os índices já existentes em 20260313_init_crm.sql
-- Todos os índices são CONCURRENTLY para não bloquear produção

-- 1. Consultas de período (stats/resumo, relatórios por data)
--    Antes: seq scan ao filtrar leads por organization_id + criado_em
create index concurrently if not exists leads_org_criado_em_idx
  on public.leads (organization_id, criado_em);

-- 2. Scope por usuário (userScopeEnabled = true nos planos Pro+)
--    Antes: seq scan ao combinar organization_id + owner_user_id
create index concurrently if not exists leads_org_owner_idx
  on public.leads (organization_id, owner_user_id);

-- 3. Dashboard → pendências do dia (cadência concluída + data prevista)
--    Antes: seq scan na tabela cadencia_itens sem filtro por concluido
create index concurrently if not exists cadencia_concluido_data_idx
  on public.cadencia_itens (organization_id, concluido, data_prevista);

-- 4. Histórico de interações por lead (ordenado por criado_em DESC)
--    Antes: sort após fetch de todas as interações do lead
create index concurrently if not exists interacoes_created_at_idx
  on public.interacoes (lead_id, criado_em desc);
