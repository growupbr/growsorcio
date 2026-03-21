// Fonte única de verdade para as etapas do funil de vendas.
// Todos os componentes e páginas devem importar daqui.

export const ETAPAS = [
  'Lead Anúncio', 'Analisar Perfil', 'Seguiu Perfil',
  'Abordagem Enviada', 'Respondeu', 'Em Desenvolvimento',
  'Follow-up Ativo', 'Lead Capturado',
  'Reunião Agendada', 'Reunião Realizada',
  'Proposta Enviada', 'Follow-up Proposta',
  'Fechado', 'Perdido',
];

// Etapas sem 'Lead Anúncio' — para criação manual de leads (prospecção)
export const ETAPAS_SEM_ANUNCIO = ETAPAS.filter(e => e !== 'Lead Anúncio');

// Subconjunto exibido no funil do Dashboard
export const ETAPAS_FUNIL = [
  'Seguiu Perfil', 'Abordagem Enviada', 'Respondeu',
  'Lead Capturado', 'Reunião Agendada', 'Reunião Realizada',
  'Proposta Enviada', 'Fechado',
];

// Etapas com metadado de fase — usado no Kanban
export const ETAPAS_KANBAN = [
  { nome: 'Lead Anúncio',       fase: 'anuncio'   },
  { nome: 'Analisar Perfil',    fase: 'captacao'  },
  { nome: 'Seguiu Perfil',      fase: 'captacao'  },
  { nome: 'Abordagem Enviada',  fase: 'captacao'  },
  { nome: 'Respondeu',          fase: 'captacao'  },
  { nome: 'Em Desenvolvimento', fase: 'captacao'  },
  { nome: 'Follow-up Ativo',    fase: 'captacao'  },
  { nome: 'Lead Capturado',     fase: 'captacao'  },
  { nome: 'Reunião Agendada',   fase: 'captacao'  },
  { nome: 'Reunião Realizada',  fase: 'captacao'  },
  { nome: 'Proposta Enviada',   fase: 'comercial' },
  { nome: 'Follow-up Proposta', fase: 'comercial' },
  { nome: 'Fechado',            fase: 'fechado'   },
  { nome: 'Perdido',            fase: 'perdido'   },
];
