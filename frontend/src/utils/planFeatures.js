'use strict';

// Mapa de features gated por plano.
// Features NÃO listadas aqui estão disponíveis para todos os planos.
export const FEATURE_PLANS = {
  whatsapp: ['pro', 'elite'],
  growia:   ['elite'],
};

// Label amigável do plano mínimo necessário para cada feature
export const FEATURE_PLAN_LABEL = {
  whatsapp: 'Pro',
  growia:   'Elite',
};

export const PLAN_LABELS = {
  start: 'Start',
  pro:   'Pro',
  elite: 'Elite',
};
