-- GrowSorcio | Migração para isolamento por usuário
-- Execute no Supabase SQL Editor (produção) ANTES de ativar escopo user-level no backend.

begin;

-- 1) Colunas de dono do registro
alter table public.leads
  add column if not exists owner_user_id uuid references auth.users(id);

alter table public.interacoes
  add column if not exists owner_user_id uuid references auth.users(id);

alter table public.cadencia_itens
  add column if not exists owner_user_id uuid references auth.users(id);

-- 2) Backfill: leads sem dono recebem o owner da organização (profiles.role = 'owner')
update public.leads l
set owner_user_id = p.user_id
from public.profiles p
where l.owner_user_id is null
  and p.organization_id = l.organization_id
  and p.role = 'owner';

-- 3) Backfill: interações/cadência herdam dono do lead
update public.interacoes i
set owner_user_id = l.owner_user_id
from public.leads l
where i.owner_user_id is null
  and l.id = i.lead_id
  and l.organization_id = i.organization_id;

update public.cadencia_itens c
set owner_user_id = l.owner_user_id
from public.leads l
where c.owner_user_id is null
  and l.id = c.lead_id
  and l.organization_id = c.organization_id;

-- 4) Índices para performance dos filtros
create index if not exists idx_leads_org_owner on public.leads (organization_id, owner_user_id);
create index if not exists idx_interacoes_org_owner on public.interacoes (organization_id, owner_user_id);
create index if not exists idx_cadencia_org_owner on public.cadencia_itens (organization_id, owner_user_id);

commit;
