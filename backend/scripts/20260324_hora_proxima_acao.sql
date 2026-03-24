-- GrowSorcio | Adiciona campo de hora da próxima ação
-- Execute no Supabase SQL Editor

alter table public.leads
  add column if not exists hora_proxima_acao text;

comment on column public.leads.hora_proxima_acao is
  'Horário da próxima ação no formato HH:MM (ex: 14:30). Opcional.';
