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

-- 5) Trigger de timestamp compatível com schemas mistos
-- Corrige o erro: NEW não possui campo updated_at (quando a tabela usa atualizado_em)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at = now();
  elsif to_jsonb(new) ? 'atualizado_em' then
    new.atualizado_em = now();
  end if;
  return new;
end;
$$;

-- 6) Garante defaults de criação/atualização em leads
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'criado_em'
  ) then
    execute 'alter table public.leads alter column criado_em set default now()';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'atualizado_em'
  ) then
    execute 'alter table public.leads alter column atualizado_em set default now()';
  end if;
end;
$$;

-- 7) Recria trigger de update em leads com a função corrigida
do $$
begin
  if to_regclass('public.leads') is not null then
    execute 'drop trigger if exists trg_set_updated_at_leads on public.leads';
    execute 'create trigger trg_set_updated_at_leads before update on public.leads for each row execute function public.set_updated_at()';
  end if;
end;
$$;

commit;
