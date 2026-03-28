/**
 * whatsapp.js — Utilitário Click-to-Zap com mensagens SDR por etapa do funil
 *
 * Mensagens padrão baseadas no processo comercial real de SDR para consórcio.
 * Cada índice corresponde a um display_order de etapa (0-based).
 * Posições >= 8 usam fallback para a mensagem da Posição 1 (índice 0).
 */

const DEFAULT_MESSAGES = [
  // Posição 1 (display_order 0) — Primeiro contato no mesmo dia
  `Olá, {nome}! Tudo bem? Aqui é {nome_corretor} da {empresa}. Você solicitou contato através de um dos nossos anúncios sobre consórcio de {tipo_bem}. Não vou te tomar muito tempo — minha função é entender o seu perfil e ver se consigo te ajudar. Leva menos de 5 minutos. Podemos conversar agora?`,

  // Posição 2 (display_order 1) — Lead não atendeu, recontato mesmo dia (tarde)
  `Olá {nome}! {nome_corretor} novamente da {empresa}. Tentei te ligar mais cedo mas não consegui falar. Você solicitou informações sobre consórcio de {tipo_bem} — queria entender melhor o que você está buscando. Tem um momento agora?`,

  // Posição 3 (display_order 2) — Segundo dia de tentativa
  `Oi {nome}, {nome_corretor} da {empresa} por aqui. Estou tentando entrar em contato desde ontem sobre sua solicitação de consórcio de {tipo_bem} no valor de {valor_carta}. Se ainda tiver interesse, é só responder aqui que te chamo. 😊`,

  // Posição 4 (display_order 3) — Confirmação da reunião
  `Olá {nome}! {nome_corretor} aqui da {empresa}. Passando para confirmar nossa reunião que agendamos. Vou preparar um estudo personalizado com as melhores oportunidades de consórcio de {tipo_bem} para o seu perfil. Confirmamos?`,

  // Posição 5 (display_order 4) — Follow-up pós reunião — envio da simulação
  `Olá {nome}! Foi um prazer conversar com você. Conforme combinamos, estou preparando a simulação personalizada do consórcio de {tipo_bem} no valor de {valor_carta}. Te envio em breve. Qualquer dúvida estou à disposição!`,

  // Posição 6 (display_order 5) — Cobrar feedback da simulação
  `Oi {nome}! {nome_corretor} aqui. Já enviei a simulação que preparei especialmente para você. O que achou? Ficou com alguma dúvida sobre os números ou a estratégia? Posso te explicar melhor qualquer ponto.`,

  // Posição 7 (display_order 6) — Manter vivo, contornar objeção
  `Olá {nome}, tudo bem? {nome_corretor} da {empresa}. Queria saber se ficou alguma dúvida sobre a proposta do consórcio de {tipo_bem}. Às vezes surgem perguntas depois que a gente para para pensar — pode me perguntar à vontade que estou aqui para resolver. 😊`,

  // Posição 8 (display_order 7) — Cobrar documentos pendentes
  `Olá {nome}! {nome_corretor} aqui. Tudo certo com os documentos que solicitei? Quanto antes finalizarmos essa etapa, mais rápido conseguimos avançar para a contemplação. Precisa de ajuda para saber o que enviar?`,
];

/** Mensagem de desfeita — enviada quando o lead não responde após 3+ dias */
const DEFAULT_CLOSING_MESSAGE =
  `Olá {nome}, {nome_corretor} aqui da {empresa}. Tentei entrar em contato algumas vezes mas entendo que talvez não seja o momento certo para você. Vou deixar em aberto — se um dia quiser conversar sobre consórcio de {tipo_bem}, pode me chamar aqui. Abraço!`;

/**
 * Retorna a mensagem padrão para um dado display_order.
 * Posições além do array usam fallback para a Posição 1.
 */
export function getDefaultMessage(displayOrder) {
  const idx = typeof displayOrder === 'number' ? displayOrder : 0;
  return DEFAULT_MESSAGES[idx] ?? DEFAULT_MESSAGES[0];
}

export function getDefaultClosingMessage() {
  return DEFAULT_CLOSING_MESSAGE;
}

/**
 * Substitui todas as variáveis de um template e retorna a mensagem pronta.
 *
 * @param {string} template - Template com variáveis em {chaves}
 * @param {object} lead - Objeto do lead (campos: nome, tipo_de_bem, valor_da_carta, whatsapp)
 * @param {object} user - Objeto do usuário Supabase Auth
 * @param {string} orgNome - Nome da organização
 */
export function buildWhatsappMessage(template, lead, user, orgNome) {
  const firstName = lead?.nome?.split(' ')[0] || 'você';
  const tipoBem = lead?.tipo_de_bem || 'imóvel';
  const valorCarta = lead?.valor_da_carta
    ? `R$ ${Number(lead.valor_da_carta).toLocaleString('pt-BR')}`
    : 'seu consórcio';
  const nomeCorretor =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    '';
  const empresa = orgNome || 'nossa empresa';

  return template
    .replace(/{nome}/g, firstName)
    .replace(/{tipo_bem}/g, tipoBem)
    .replace(/{valor_carta}/g, valorCarta)
    .replace(/{nome_corretor}/g, nomeCorretor)
    .replace(/{empresa}/g, empresa);
}

/**
 * Monta o link wa.me com mensagem URL-encoded.
 * Normaliza números brasileiros: 11 dígitos → prefixo 55.
 *
 * @param {string} whatsapp - Número do lead (qualquer formato)
 * @param {string} message - Mensagem já substituída
 * @returns {string|null} - URL wa.me ou null se número inválido
 */
export function buildWhatsappLink(whatsapp, message) {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, '');
  if (digits.length < 8) return null;

  let number;
  if (digits.length === 11) {
    number = `55${digits}`;
  } else if (digits.length === 13 && digits.startsWith('55')) {
    number = digits;
  } else if (digits.length === 12 && digits.startsWith('55')) {
    number = digits;
  } else {
    // Número estrangeiro ou formato desconhecido — usa como está
    number = digits;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Retorna o template efetivo para uma etapa:
 * - Se etapa.message_template existir: usa ele
 * - Caso contrário: usa a mensagem padrão do display_order
 */
export function getEffectiveTemplate(etapa) {
  return etapa?.message_template || getDefaultMessage(etapa?.display_order ?? 0);
}
