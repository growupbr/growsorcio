'use strict';

const BASE_URL = 'https://api.abacatepay.com';

// Preços em centavos por plano/período
const PRICES = {
  start:  { monthly: 14700, yearly: 140400 },
  pro:    { monthly: 44700, yearly: 428400 },
  elite:  { monthly: 99700, yearly: 956400 },
};

function getToken() {
  const token = process.env.ABACATEPAY_TOKEN;
  if (!token) throw new Error('ABACATEPAY_TOKEN não configurado no .env');
  return token;
}

async function apiFetch(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

// ── Clientes ────────────────────────────────────────────────────────────────

async function createCustomer({ name, email, cellphone, taxId }) {
  return apiFetch('POST', '/v1/customer/create', { name, email, cellphone, taxId });
}

// ── Cobranças ────────────────────────────────────────────────────────────────

async function createBilling({ plan, billingPeriod, customerId, returnUrl, completionUrl }) {
  const price = PRICES[plan]?.[billingPeriod];
  if (!price) throw new Error(`Plano inválido: ${plan}/${billingPeriod}`);

  const periodLabel = billingPeriod === 'yearly' ? 'Anual' : 'Mensal';
  const planLabel   = { start: 'Grow START', pro: 'Grow PRO', elite: 'Grow ELITE AI' }[plan];

  return apiFetch('POST', '/v1/billing/create', {
    frequency: 'ONE_TIME',
    methods: ['PIX', 'CARD'],
    products: [{
      externalId: `growsorcio-${plan}-${billingPeriod}`,
      name: `${planLabel} — ${periodLabel}`,
      description: `Assinatura GrowSorcio ${planLabel} (${periodLabel})`,
      quantity: 1,
      price,
    }],
    customerId,
    returnUrl,
    completionUrl,
  });
}

async function getBilling(billingId) {
  return apiFetch('GET', `/v1/billing/get?id=${billingId}`);
}

module.exports = { createCustomer, createBilling, getBilling, PRICES };
