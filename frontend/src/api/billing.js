const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3334');

export async function criarPix({ plan, billingPeriod, name, email, cellphone, taxId }) {
  const res = await fetch(`${API_BASE}/api/billing/pix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, billingPeriod, name, email, cellphone, taxId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || 'Erro ao gerar PIX');
  return json; // { pixId, brCode, qrCodeImage, amount, expiresAt }
}

export async function verificarPix(pixId) {
  const res = await fetch(`${API_BASE}/api/billing/pix/${pixId}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || 'Erro ao verificar PIX');
  return json; // { status: 'PENDING' | 'PAID' | 'EXPIRED' }
}

export async function criarCheckoutPublico({ plan, billingPeriod, name, email, cellphone, taxId }) {
  const res = await fetch(`${API_BASE}/api/billing/checkout-public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, billingPeriod, name, email, cellphone, taxId }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || 'Erro ao criar cobrança');
  return json; // { url, billingId }
}

export async function criarCheckout({ plan, billingPeriod, name, email, cellphone, taxId, organizationId }) {
  const res = await fetch(`${API_BASE}/api/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, billingPeriod, name, email, cellphone, taxId, organizationId }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.erro || 'Erro ao criar cobrança');
  return json; // { url, billingId }
}
