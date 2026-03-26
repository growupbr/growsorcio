-- Adiciona colunas phone_number e avatar_url à tabela profiles
alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists avatar_url   text;
