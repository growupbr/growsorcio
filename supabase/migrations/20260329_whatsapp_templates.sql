-- GrowSorcio — Click-to-Zap: templates de mensagem por etapa
-- Adiciona campo message_template em funnel_stages e closing_message em organizations

-- Cada etapa pode armazenar um template de WebsApp editado pelo corretor.
-- NULL significa "usar a mensagem padrão da posição correspondente".
ALTER TABLE public.funnel_stages
  ADD COLUMN IF NOT EXISTS message_template TEXT DEFAULT NULL;

-- Mensagem de encerramento global por organização ("Mensagem de Desfeita").
-- NULL significa "usar a mensagem padrão de encerramento".
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS closing_message TEXT DEFAULT NULL;

-- Sem migração de políticas RLS: funnel_stages já tem policies que cobrem
-- todos os campos; organizations é acessado via service_role na API.
