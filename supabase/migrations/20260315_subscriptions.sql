-- GrowSorcio — Subscriptions (AbacatePay)
-- Run in Supabase SQL Editor

create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations(id) on delete cascade,
  plan                    text not null check (plan in ('start', 'pro', 'elite')),
  billing_period          text not null default 'monthly' check (billing_period in ('monthly', 'yearly')),
  status                  text not null default 'trial'
                            check (status in ('trial', 'active', 'pending', 'expired', 'cancelled')),
  trial_ends_at           timestamptz not null default (now() + interval '14 days'),
  current_period_end      timestamptz,
  abacatepay_customer_id  text,
  abacatepay_billing_id   text unique,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_org_idx on public.subscriptions (organization_id);
create index if not exists subscriptions_billing_id_idx on public.subscriptions (abacatepay_billing_id);

create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

-- Organização vê apenas sua própria assinatura
create policy subscriptions_select
on public.subscriptions for select
to authenticated
using (public.is_org_member(organization_id));

-- Apenas service_role escreve (via backend/webhook)
create policy subscriptions_insert_service
on public.subscriptions for insert
to service_role
with check (true);

create policy subscriptions_update_service
on public.subscriptions for update
to service_role
using (true)
with check (true);
