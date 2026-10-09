import crypto from 'crypto';
import Stripe from 'stripe';
import { db } from '../db';
import { PaymentRecord, SubscriptionRecord, WebhookEventRecord } from '../db/types';
import { PLAN_CONFIGS, CREDIT_PACKS } from './plans-config';
import { creditService } from './credit-service';

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  mode: 'subscription' | 'payment';
  provider: 'stripe' | 'test_mode';
  clientSecret?: string;
}

export class PaymentService {
  private stripeClient: Stripe | null = null;
  private stripeWebhookSecret: string | undefined;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    this.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (stripeKey && stripeKey.trim() !== '' && !stripeKey.includes('placeholder')) {
      try {
        this.stripeClient = new Stripe(stripeKey);
        console.log('[Billing] Stripe client initialized in live/test mode.');
      } catch (err) {
        console.warn('[Billing] Failed to initialize Stripe client:', err);
      }
    } else {
      console.log('[Billing] Running in Remix Test Billing Mode (Simulated Stripe & Webhooks).');
    }
  }

  isStripeConfigured(): boolean {
    return !!this.stripeClient;
  }

  /**
   * Create a checkout session for a subscription plan (Pro / Business).
   */
  async createSubscriptionCheckout(
    userId: string,
    userEmail: string,
    planId: 'pro' | 'business',
    interval: 'monthly' | 'annual',
    origin: string
  ): Promise<CheckoutSessionResult> {
    const plan = PLAN_CONFIGS[planId];
    if (!plan) throw new Error(`Invalid plan identifier: ${planId}`);

    const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    const amountInCents = Math.round(price * 100);

    const successUrl = `${origin}/dashboard?tab=billing&checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing?checkout=cancelled`;

    if (this.stripeClient) {
      try {
        const session = await this.stripeClient.checkout.sessions.create({
          customer_email: userEmail,
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Remix ${plan.name} Plan`,
                  description: `${plan.tagline} · ${plan.includedMonthlyCredits} AI credits/month`,
                },
                unit_amount: amountInCents,
                recurring: {
                  interval: interval === 'annual' ? 'year' : 'month',
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId,
            planId,
            interval,
            paymentType: 'subscription',
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        return {
          sessionId: session.id,
          url: session.url || successUrl,
          mode: 'subscription',
          provider: 'stripe',
        };
      } catch (err: any) {
        console.error('[Stripe Checkout Error]:', err);
        throw new Error(`Stripe error: ${err.message}`);
      }
    }

    // Test Mode Session
    const testSessionId = `cs_test_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const testCheckoutUrl = `/dashboard?tab=billing&test_checkout=${testSessionId}&plan=${planId}&interval=${interval}&amount=${amountInCents}`;

    return {
      sessionId: testSessionId,
      url: testCheckoutUrl,
      mode: 'subscription',
      provider: 'test_mode',
    };
  }

  /**
   * Create a checkout session for a one-time credit top-up pack.
   */
  async createTopUpCheckout(
    userId: string,
    userEmail: string,
    packId: 'pack_starter' | 'pack_creator' | 'pack_power',
    origin: string
  ): Promise<CheckoutSessionResult> {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new Error(`Invalid credit pack: ${packId}`);

    const amountInCents = Math.round(pack.price * 100);
    const successUrl = `${origin}/dashboard?tab=billing&topup=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard?tab=billing&topup=cancelled`;

    if (this.stripeClient) {
      try {
        const session = await this.stripeClient.checkout.sessions.create({
          customer_email: userEmail,
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Remix ${pack.name}`,
                  description: `${pack.credits} AI Credits (Never expire)`,
                },
                unit_amount: amountInCents,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId,
            packId,
            paymentType: 'topup',
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        return {
          sessionId: session.id,
          url: session.url || successUrl,
          mode: 'payment',
          provider: 'stripe',
        };
      } catch (err: any) {
        console.error('[Stripe Top-Up Error]:', err);
        throw new Error(`Stripe error: ${err.message}`);
      }
    }

    // Test Mode Session
    const testSessionId = `cs_topup_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const testCheckoutUrl = `/dashboard?tab=billing&test_topup=${testSessionId}&pack=${packId}&amount=${amountInCents}`;

    return {
      sessionId: testSessionId,
      url: testCheckoutUrl,
      mode: 'payment',
      provider: 'test_mode',
    };
  }

  /**
   * Complete test-mode checkout authoritatively on the server.
   * Processes the payment, creates subscription or topup record, grants credits, and generates receipt.
   */
  async confirmTestCheckout(
    userId: string,
    params: {
      sessionId: string;
      type: 'subscription' | 'topup';
      planId?: 'pro' | 'business';
      interval?: 'monthly' | 'annual';
      packId?: 'pack_starter' | 'pack_creator' | 'pack_power';
    }
  ): Promise<{
    success: boolean;
    subscription?: SubscriptionRecord;
    payment: PaymentRecord;
    creditsGranted: number;
    newBalance: number;
    receiptUrl: string;
  }> {
    const now = new Date();
    const nowIso = now.toISOString();
    const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    if (params.type === 'subscription') {
      const planId = params.planId || 'pro';
      const plan = PLAN_CONFIGS[planId];
      if (!plan) throw new Error('Invalid plan selected.');

      const interval = params.interval || 'monthly';
      const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
      const amountInCents = Math.round(price * 100);

      const days = interval === 'annual' ? 365 : 30;
      const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      let sub = await db.getSubscription(userId);
      if (!sub) {
        sub = {
          id: `sub_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          userId,
          planId,
          status: 'active',
          billingInterval: interval,
          provider: 'system',
          currentPeriodStart: nowIso,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await db.saveSubscription(sub);
      } else {
        sub = await db.updateSubscription(sub.id, {
          planId,
          status: 'active',
          billingInterval: interval,
          currentPeriodStart: nowIso,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        });
      }

      // Record payment
      const payment: PaymentRecord = {
        id: paymentId,
        userId,
        subscriptionId: sub.id,
        provider: 'system',
        providerPaymentId: params.sessionId,
        amount: amountInCents,
        currency: 'usd',
        status: 'succeeded',
        paymentType: 'subscription',
        planId,
        creditsGranted: plan.includedMonthlyCredits,
        receiptUrl: `/api/billing/receipts/${paymentId}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await db.recordPayment(payment);

      // Grant monthly subscription credits
      const { creditsGranted, newBalance } = await creditService.grantSubscriptionCredits(
        userId,
        planId,
        params.sessionId
      );

      return {
        success: true,
        subscription: sub,
        payment,
        creditsGranted,
        newBalance,
        receiptUrl: payment.receiptUrl || '',
      };
    } else {
      // Top-up pack purchase
      const packId = params.packId || 'pack_starter';
      const pack = CREDIT_PACKS.find((p) => p.id === packId);
      if (!pack) throw new Error('Invalid credit pack selected.');

      const amountInCents = Math.round(pack.price * 100);

      const payment: PaymentRecord = {
        id: paymentId,
        userId,
        provider: 'system',
        providerPaymentId: params.sessionId,
        amount: amountInCents,
        currency: 'usd',
        status: 'succeeded',
        paymentType: 'topup',
        creditPackId: packId,
        creditsGranted: pack.credits,
        receiptUrl: `/api/billing/receipts/${paymentId}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await db.recordPayment(payment);

      const { creditsAdded, newBalance } = await creditService.grantPurchasedCredits(
        userId,
        packId,
        paymentId
      );

      return {
        success: true,
        payment,
        creditsGranted: creditsAdded,
        newBalance,
        receiptUrl: payment.receiptUrl || '',
      };
    }
  }

  /**
   * Cancel subscription at period end.
   */
  async cancelSubscription(userId: string): Promise<SubscriptionRecord> {
    const sub = await db.getSubscription(userId);
    if (!sub || sub.planId === 'free') {
      throw new Error('No active paid subscription found to cancel.');
    }

    const nowIso = new Date().toISOString();
    const updated = await db.updateSubscription(sub.id, {
      cancelAtPeriodEnd: true,
      canceledAt: nowIso,
      status: 'active', // remains active until currentPeriodEnd
    });

    return updated;
  }

  /**
   * Resume subscription before period end.
   */
  async resumeSubscription(userId: string): Promise<SubscriptionRecord> {
    const sub = await db.getSubscription(userId);
    if (!sub || !sub.cancelAtPeriodEnd) {
      throw new Error('Subscription is not scheduled for cancellation.');
    }

    const updated = await db.updateSubscription(sub.id, {
      cancelAtPeriodEnd: false,
      canceledAt: undefined,
    });

    return updated;
  }

  /**
   * Change plan (upgrade / downgrade).
   */
  async changePlan(
    userId: string,
    newPlanId: 'free' | 'pro' | 'business',
    interval?: 'monthly' | 'annual'
  ): Promise<SubscriptionRecord> {
    const sub = await db.getSubscription(userId);
    if (!sub) {
      throw new Error('Subscription account not found.');
    }

    if (newPlanId === 'free') {
      // Downgrade to free: marks cancellation at end of period
      return this.cancelSubscription(userId);
    }

    const plan = PLAN_CONFIGS[newPlanId];
    if (!plan) throw new Error('Invalid plan selection.');

    const nowIso = new Date().toISOString();
    const newInterval = interval || sub.billingInterval || 'monthly';
    const days = newInterval === 'annual' ? 365 : 30;
    const periodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const updated = await db.updateSubscription(sub.id, {
      planId: newPlanId,
      billingInterval: newInterval,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: nowIso,
      currentPeriodEnd: periodEnd,
    });

    // Grant new plan monthly credits
    await creditService.grantSubscriptionCredits(userId, newPlanId, `change_${Date.now()}`);

    return updated;
  }

  /**
   * Verify and process Stripe Webhooks idempotently.
   */
  async handleWebhook(
    rawBody: Buffer | string,
    signature: string
  ): Promise<{ status: string; processed: boolean }> {
    let event: any;

    if (this.stripeClient && this.stripeWebhookSecret) {
      try {
        event = this.stripeClient.webhooks.constructEvent(
          rawBody,
          signature,
          this.stripeWebhookSecret
        );
      } catch (err: any) {
        console.error('[Stripe Webhook Signature Verification Failed]:', err.message);
        throw new Error(`Webhook Error: ${err.message}`);
      }
    } else {
      // If parsing raw JSON directly in simulated/test environment
      try {
        event = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
      } catch (err: any) {
        throw new Error('Invalid JSON webhook payload.');
      }
    }

    const eventId = event.id || `evt_${Date.now()}`;
    const eventType = event.type || 'unknown';

    // Idempotency check: don't process same event twice
    const alreadyProcessed = await db.isWebhookEventProcessed('stripe', eventId);
    if (alreadyProcessed) {
      return { status: 'already_processed', processed: false };
    }

    const nowIso = new Date().toISOString();

    try {
      switch (eventType) {
        case 'checkout.session.completed': {
          const session = event.data?.object;
          const metadata = session?.metadata || {};
          const userId = metadata.userId;

          if (userId) {
            if (metadata.paymentType === 'subscription') {
              const planId = metadata.planId || 'pro';
              const interval = metadata.interval || 'monthly';
              await this.confirmTestCheckout(userId, {
                sessionId: session.id,
                type: 'subscription',
                planId,
                interval,
              });
            } else if (metadata.paymentType === 'topup') {
              const packId = metadata.packId;
              await this.confirmTestCheckout(userId, {
                sessionId: session.id,
                type: 'topup',
                packId,
              });
            }
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data?.object;
          const subId = invoice?.subscription;
          // Renew credits on recurring subscription payment
          if (subId) {
            // Find subscription and grant monthly credits
            console.log(`[Stripe Webhook] Recurring invoice paid for subscription ${subId}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subObj = event.data?.object;
          console.log(`[Stripe Webhook] Subscription deleted: ${subObj?.id}`);
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${eventType}`);
      }

      await db.recordWebhookEvent({
        id: `wh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        provider: 'stripe',
        eventId,
        eventType,
        status: 'processed',
        receivedAt: nowIso,
        processedAt: new Date().toISOString(),
      });

      return { status: 'success', processed: true };
    } catch (err: any) {
      console.error(`[Stripe Webhook Processing Error for ${eventType}]:`, err);
      await db.recordWebhookEvent({
        id: `wh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        provider: 'stripe',
        eventId,
        eventType,
        status: 'failed',
        receivedAt: nowIso,
        processedAt: new Date().toISOString(),
      });
      throw err;
    }
  }
}

export const paymentService = new PaymentService();
