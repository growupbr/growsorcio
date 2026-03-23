-- GrowSorcio — Funnel Stages dinâmico por tenant
-- Run in Supabase SQL Editor

create table if not exists public.funnel_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  color           text not null default '#52525b',
  is_lost         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint funnel_stages_org_name_unique unique (organization_id, name)
);

create index if not exists funnel_stages_org_order_idx
  on public.funnel_stages (organization_id, display_order);

create trigger trg_funnel_stages_updated_at
before update on public.funnel_stages
for each row execute function public.set_updated_at();

alter table public.funnel_stages enable row level security;

-- Todos os membros da org podem ler as etapas
create policy funnel_stages_select
  on public.funnel_stages for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Apenas owner/admin podem criar etapas
create policy funnel_stages_insert
  on public.funnel_stages for insert
  to authenticated
  with check (public.user_role(organization_id) in ('owner', 'admin'));

-- Apenas owner/admin podem editar
create policy funnel_stages_update
  on public.funnel_stages for update
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'))
  with check (public.user_role(organization_id) in ('owner', 'admin'));

-- Apenas owner/admin podem excluir
create policy funnel_stages_delete
  on public.funnel_stages for delete
  to authenticated
  using (public.user_role(organization_id) in ('owner', 'admin'));

-- ─── Função: semeia etapas padrão para uma org ─────────────────────────────

create or replace function public.seed_default_funnel_stages(p_org_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.funnel_stages (organization_id, name, display_order, color, is_lost)
  values
    (p_org_id, 'Lead Anúncio',       0,  '#a78bfa', false),
    (p_org_id, 'Analisar Perfil',    1,  '#f97316', false),
    (p_org_id, 'Seguiu Perfil',      2,  '#f97316', false),
    (p_org_id, 'Abordagem Enviada',  3,  '#f97316', false),
    (p_org_id, 'Respondeu',          4,  '#f97316', false),
    (p_org_id, 'Em Desenvolvimento', 5,  '#f97316', false),
    (p_org_id, 'Follow-up Ativo',    6,  '#f97316', false),
    (p_org_id, 'Lead Capturado',     7,  '#f97316', false),
    (p_org_id, 'Reunião Agendada',   8,  '#f59e0b', false),
    (p_org_id, 'Reunião Realizada',  9,  '#f59e0b', false),
    (p_org_id, 'Proposta Enviada',   10, '#f59e0b', false),
    (p_org_id, 'Follow-up Proposta', 11, '#f59e0b', false),
    (p_org_id, 'Fechado',            12, '#22c55e', false),
    (p_org_id, 'Perdido',            13, '#52525b', true)
  on conflict (organization_id, name) do nothing;
end;
$$;

-- ─── Atualiza handle_new_user para semear etapas em novas orgs ─────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'Minha Organizacao'
  );

  insert into public.organizations(name)
  values (v_name)
  returning id into v_org_id;

  insert into public.profiles(user_id, organization_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'owner'
  );

  perform public.seed_default_funnel_stages(v_org_id);

  return new;
end;
$$;

-- ─── Backfill: semeia etapas para orgs existentes sem etapas ───────────────

do $$
declare
  org record;
begin
  for org in
    select o.id
    from public.organizations o
    where not exists (
      select 1 from public.funnel_stages fs where fs.organization_id = o.id
    )
  loop
    perform public.seed_default_funnel_stages(org.id);
  end loop;
end;
$$;
