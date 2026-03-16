'use strict';

const crypto  = require('crypto');
const express = require('express');
const router  = express.Router();
const { supabase, getOrganizationId } = require('../supabase');
const { createCustomer, createBilling } = require('../services/abacatepay');

const APP_URL    = process.env.APP_URL    || 'https://app.growsorcio.com.br';
const LANDING_URL = process.env.LANDING_URL || 'https://growsorcio.com.br';

// ── POST /api/billing/checkout ───────────────────────────────────────────────
// Cria cliente + cobrança na AbacatePay e retorna a URL de pagamento
router.post('/checkout', async (req, res) => {
  const { plan, billingPeriod = 'monthly', name, email, cellphone, taxId, organizationId } = req.body;

  if (!plan || !name || !email || !cellphone || !taxId) {
    return res.status(400).json({ erro: 'Campos obrigatórios: plan, name, email, cellphone, taxId' });
  }
  if (!['start', 'pro', 'elite'].includes(plan)) {
    return res.status(400).json({ erro: 'Plano inválido. Use: start, pro ou elite' });
  }

  try {
    const resolvedOrganizationId = organizationId || await getOrganizationId();

    // 1. Cria o cliente na AbacatePay
    const customer = await createCustomer({ name, email, cellphone, taxId });

    // 2. Cria a cobrança
    const billing = await createBilling({
      plan,
      billingPeriod,
      customerId: customer.id,
      returnUrl:     `${LANDING_URL}/#precos`,
      completionUrl: `${APP_URL}/pagamento-confirmado`,
    });

    // 3. Salva assinatura como 'pending' no Supabase
    await supabase.from('subscriptions').upsert({
      organization_id:        resolvedOrganizationId,
      plan,
      billing_period:         billingPeriod,
      status:                 'pending',
      abacatepay_customer_id: customer.id,
      abacatepay_billing_id:  billing.id,
    }, { onConflict: 'abacatepay_billing_id' });

    return res.json({ url: billing.url, billingId: billing.id });
  } catch (err) {
    console.error('[billing/checkout]', err.message);
    return res.status(500).json({ erro: err.message });
  }
});

// ── POST /api/billing/webhook ────────────────────────────────────────────────
// Recebe eventos da AbacatePay (billing.paid, pix.paid, billing.expired)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Valida o secret do webhook
  const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const receivedSecret = req.headers['x-webhook-secret'] || req.headers['x-abacatepay-secret'] || '';
    const expected = Buffer.from(webhookSecret);
    const received = Buffer.from(receivedSecret);
    const valid = expected.length === received.length &&
      crypto.timingSafeEqual(expected, received);
    if (!valid) {
      console.warn('[webhook] Secret inválido ou ausente');
      return res.status(401).json({ erro: 'Unauthorized' });
    }
  }
  let event;
  try {
    if (Buffer.isBuffer(req.body)) {
      event = JSON.parse(req.body.toString('utf-8'));
    } else if (typeof req.body === 'string') {
      event = JSON.parse(req.body);
    } else {
      event = req.body;
    }
  } catch {
    return res.status(400).json({ erro: 'Body inválido' });
  }

  const { event: eventType, data } = event;
  const billingId = data?.id;

  if (!billingId) return res.status(400).json({ erro: 'ID da cobrança ausente' });

  try {
    if (eventType === 'billing.paid' || eventType === 'pix.paid') {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30); // +30 dias

      await supabase
        .from('subscriptions')
        .update({
          status:             'active',
          current_period_end: periodEnd.toISOString(),
        })
        .eq('abacatepay_billing_id', billingId);

      console.log(`[webhook] Pagamento confirmado: ${billingId}`);
    }

    if (eventType === 'billing.expired') {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('abacatepay_billing_id', billingId);

      console.log(`[webhook] Cobrança expirada: ${billingId}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[billing/webhook]', err.message);
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
