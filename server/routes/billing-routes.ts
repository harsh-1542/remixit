import { Router } from 'express';
import { requireAuth } from '../auth/auth-service';
import { PLAN_CONFIGS, CREDIT_PACKS, CREDIT_COSTS } from '../billing/plans-config';
import { creditService } from '../billing/credit-service';
import { entitlementService } from '../billing/entitlement-service';
import { paymentService } from '../billing/payment-service';
import { db } from '../db';

export const billingRouter = Router();

// GET /api/billing/plans - Get all plans, credit packs, and credit costs
billingRouter.get('/plans', (_req, res) => {
  return res.json({
    plans: Object.values(PLAN_CONFIGS),
    creditPacks: CREDIT_PACKS,
    creditCosts: CREDIT_COSTS,
    isStripeConfigured: paymentService.isStripeConfigured(),
  });
});

// GET /api/billing/status - Get current user plan, subscription, credits, and entitlements
billingRouter.get('/status', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const entitlements = await entitlementService.getUserEntitlements(user.id);
    const subscription = await db.getSubscription(user.id);

    return res.json({
      ...entitlements,
      subscription: subscription || null,
      isStripeConfigured: paymentService.isStripeConfigured(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/history - Get credit ledger history & payments history
billingRouter.get('/history', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 50;

    const [transactions, payments, aiUsage] = await Promise.all([
      db.listCreditTransactions(user.id, limit),
      db.listPayments(user.id),
      db.listAiUsage(user.id, limit),
    ]);

    return res.json({
      transactions,
      payments,
      aiUsage,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/checkout - Start checkout for subscription
billingRouter.post('/checkout', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { planId, interval } = req.body;

    if (!planId || (planId !== 'pro' && planId !== 'business')) {
      return res.status(400).json({ error: 'Please select a valid paid plan (pro or business).' });
    }

    const billingInterval = interval === 'annual' ? 'annual' : 'monthly';
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;

    const session = await paymentService.createSubscriptionCheckout(
      user.id,
      user.email,
      planId,
      billingInterval,
      origin
    );

    return res.json(session);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/billing/topup - Start checkout for credit pack
billingRouter.post('/topup', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { packId } = req.body;

    if (!packId || !CREDIT_PACKS.some((p) => p.id === packId)) {
      return res.status(400).json({ error: 'Please select a valid credit pack.' });
    }

    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;

    const session = await paymentService.createTopUpCheckout(
      user.id,
      user.email,
      packId,
      origin
    );

    return res.json(session);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/billing/confirm-test - Authoritatively confirm test checkout session on server
billingRouter.post('/confirm-test', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { sessionId, type, planId, interval, packId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    const result = await paymentService.confirmTestCheckout(user.id, {
      sessionId,
      type: type || 'subscription',
      planId,
      interval,
      packId,
    });

    return res.json({
      success: true,
      ...result,
      message:
        type === 'topup'
          ? `Successfully purchased ${result.creditsGranted} AI credits! New balance: ${result.newBalance}`
          : `Upgraded to ${result.subscription?.planId?.toUpperCase()} Plan! ${result.creditsGranted} monthly credits granted.`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/billing/change-plan - Upgrade or downgrade plan
billingRouter.post('/change-plan', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { planId, interval } = req.body;

    if (!planId || !PLAN_CONFIGS[planId]) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    const updated = await paymentService.changePlan(user.id, planId, interval);
    const balance = await db.getCreditBalance(user.id);

    return res.json({
      success: true,
      subscription: updated,
      newBalance: balance,
      message: `Your subscription has been switched to ${PLAN_CONFIGS[planId].name}.`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/billing/cancel - Cancel active subscription
billingRouter.post('/cancel', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const updated = await paymentService.cancelSubscription(user.id);

    return res.json({
      success: true,
      subscription: updated,
      message: `Subscription scheduled to cancel on ${new Date(
        updated.currentPeriodEnd
      ).toLocaleDateString()}. You will keep all paid features until then.`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/billing/resume - Resume subscription scheduled for cancellation
billingRouter.post('/resume', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const updated = await paymentService.resumeSubscription(user.id);

    return res.json({
      success: true,
      subscription: updated,
      message: 'Your subscription has been resumed successfully.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/billing/receipts/:paymentId - Render official receipt
billingRouter.get('/receipts/:paymentId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { paymentId } = req.params;

    const payment = await db.getPayment(paymentId);
    if (!payment || payment.userId !== user.id) {
      return res.status(404).send('Receipt not found or unauthorized.');
    }

    const amountFormatted = `$${(payment.amount / 100).toFixed(2)}`;
    const dateFormatted = new Date(payment.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const itemName =
      payment.paymentType === 'subscription'
        ? `Remix ${PLAN_CONFIGS[payment.planId || 'pro']?.name || 'Pro'} Subscription`
        : `Remix ${CREDIT_PACKS.find((p) => p.id === payment.creditPackId)?.name || 'Credit Top-Up'}`;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt — ${payment.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAFAF8; color: #18181B; margin: 0; padding: 40px 20px; }
          .receipt { max-width: 560px; margin: 0 auto; background: #FFF; border: 1px solid #E4E4E7; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #F4F4F5; padding-bottom: 24px; margin-bottom: 24px; }
          .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .status { display: inline-block; padding: 4px 10px; background: #DCFCE7; color: #166534; font-size: 11px; font-weight: 700; border-radius: 999px; text-transform: uppercase; }
          .meta { font-size: 12px; color: #71717A; margin-top: 4px; font-family: monospace; }
          .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F4F4F5; font-size: 13px; }
          .total { display: flex; justify-content: space-between; padding: 18px 0; font-size: 16px; font-weight: 800; border-top: 2px solid #18181B; margin-top: 16px; }
          .footer { margin-top: 32px; font-size: 11px; color: #A1A1AA; text-align: center; }
          .btn-print { margin-top: 24px; text-align: center; }
          .btn-print button { padding: 8px 18px; border: 1px solid #D4D4D8; background: #FFF; font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div>
              <div class="logo">remix.</div>
              <div class="meta">Receipt #${payment.id}</div>
              <div class="meta">Date: ${dateFormatted}</div>
            </div>
            <div class="status">Paid</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #71717A; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Billed To</div>
            <div style="font-size: 14px; font-weight: 600;">${user.displayName || 'Remix User'}</div>
            <div style="font-size: 12px; color: #71717A;">${user.email}</div>
          </div>
          <div style="margin-top: 28px;">
            <div class="row" style="font-weight: 600; color: #71717A; font-size: 11px; text-transform: uppercase;">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div class="row">
              <div>
                <div style="font-weight: 600;">${itemName}</div>
                <div style="font-size: 11px; color: #71717A; margin-top: 2px;">+${payment.creditsGranted} AI Credits included</div>
              </div>
              <div style="font-weight: 600;">${amountFormatted}</div>
            </div>
            <div class="total">
              <span>Total Paid</span>
              <span>${amountFormatted} USD</span>
            </div>
          </div>
          <div class="footer">
            Thank you for building with Remix. Find it. Remix it. Build it.<br>
            All subscriptions and credit packs include full access to exported React & TypeScript code.
          </div>
          <div class="btn-print">
            <button onclick="window.print()">Print Receipt</button>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(receiptHtml);
  } catch (err: any) {
    return res.status(500).send('Error generating receipt: ' + err.message);
  }
});

// POST /api/billing/webhook - Stripe Webhook handler
billingRouter.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  try {
    const rawBody = (req as any).rawBody || req.body;
    const result = await paymentService.handleWebhook(rawBody, sig || '');
    return res.json({ received: true, ...result });
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
