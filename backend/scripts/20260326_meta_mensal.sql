-- Adiciona coluna meta_mensal à tabela profiles
alter table public.profiles
  add column if not exists meta_mensal integer default 0;
