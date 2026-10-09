import { db } from '../db';
import { CreditLedgerRecord, SubscriptionRecord } from '../db/types';
import { PLAN_CONFIGS, CREDIT_PACKS } from './plans-config';

export class CreditService {
  /**
   * Ensures user account has active subscription state and has received initial or monthly credit allocation.
   * Enforces idempotency so users cannot obtain extra free credits by reloading.
   */
  async ensureAccountCredits(userId: string): Promise<{
    balance: number;
    subscription: SubscriptionRecord;
  }> {
    const now = new Date();
    const nowIso = now.toISOString();

    let sub = await db.getSubscription(userId);

    if (!sub) {
      // Create initial Free plan subscription
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      sub = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        planId: 'free',
        status: 'active',
        billingInterval: 'monthly',
        provider: 'system',
        currentPeriodStart: nowIso,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await db.saveSubscription(sub);

      // Grant initial promotional free credits (50 credits)
      await db.recordCreditTransaction({
        userId,
        transactionType: 'signup_bonus',
        amount: PLAN_CONFIGS.free.includedMonthlyCredits,
        operationId: `init_bonus_${userId}`,
        reason: 'Welcome bonus: Initial free plan credit allowance',
        metadata: { planId: 'free' },
      });
    } else {
      // Check if monthly cycle has expired and renew allocation
      const periodEnd = new Date(sub.currentPeriodEnd);
      if (now > periodEnd && sub.status === 'active') {
        const nextEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const plan = PLAN_CONFIGS[sub.planId] || PLAN_CONFIGS.free;

        const cycleKey = `alloc_${sub.id}_${now.getFullYear()}_${now.getMonth() + 1}`;
        const alreadyAllocated = await db.hasOperationBeenCharged(cycleKey);

        if (!alreadyAllocated) {
          await db.recordCreditTransaction({
            userId,
            transactionType: 'allocation',
            amount: plan.includedMonthlyCredits,
            operationId: cycleKey,
            reason: `Monthly credit allocation (${plan.name} plan)`,
            metadata: { planId: sub.planId },
          });

          sub = await db.updateSubscription(sub.id, {
            currentPeriodStart: nowIso,
            currentPeriodEnd: nextEnd,
          });
        }
      }
    }

    const balance = await db.getCreditBalance(userId);
    return { balance, subscription: sub };
  }

  /**
   * Check balance and atomically deduct credits for an operation.
   * If operation was already charged, avoids duplicate deduction (idempotency).
   */
  async deductCredits(
    userId: string,
    amount: number,
    options: {
      action: 'analysis' | 'generation' | 'edit' | 'regeneration' | 'section_regeneration';
      operationId: string;
      projectId?: string;
      reason: string;
      model?: string;
    }
  ): Promise<{
    success: boolean;
    balanceAfter: number;
    error?: string;
    record?: CreditLedgerRecord;
  }> {
    await this.ensureAccountCredits(userId);

    // Idempotency check: don't double charge same operation
    if (options.operationId) {
      const alreadyCharged = await db.hasOperationBeenCharged(options.operationId);
      if (alreadyCharged) {
        const currentBalance = await db.getCreditBalance(userId);
        return { success: true, balanceAfter: currentBalance };
      }
    }

    const currentBalance = await db.getCreditBalance(userId);

    if (currentBalance < amount) {
      return {
        success: false,
        balanceAfter: currentBalance,
        error: `Insufficient AI credits. This action requires ${amount} ${
          amount === 1 ? 'credit' : 'credits'
        }, but you have ${currentBalance} available. Please upgrade your plan or top up your credits.`,
      };
    }

    const record = await db.recordCreditTransaction({
      userId,
      transactionType: options.action,
      amount: -Math.abs(amount),
      operationId: options.operationId,
      projectId: options.projectId,
      reason: options.reason,
      metadata: {
        action: options.action,
        model: options.model || 'gemini-2.5-flash',
      },
    });

    // Record AI usage record
    await db.recordAiUsage({
      id: `ai_use_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      projectId: options.projectId,
      operationId: options.operationId,
      actionType: options.action,
      model: options.model || 'gemini-2.5-flash',
      creditsCharged: amount,
      status: 'success',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    return {
      success: true,
      balanceAfter: record.balanceAfter,
      record,
    };
  }

  /**
   * Refund credits if an AI operation failed after reservation.
   */
  async refundCredits(
    userId: string,
    operationId: string,
    reason: string
  ): Promise<{ success: boolean; refundedAmount: number; newBalance: number }> {
    const transactions = await db.listCreditTransactions(userId, 50);
    const chargedTx = transactions.find((t) => t.operationId === operationId && t.amount < 0);

    if (!chargedTx) {
      const currentBalance = await db.getCreditBalance(userId);
      return { success: false, refundedAmount: 0, newBalance: currentBalance };
    }

    const refundAmount = Math.abs(chargedTx.amount);
    const refundOpKey = `refund_${operationId}`;

    const alreadyRefunded = transactions.some((t) => t.operationId === refundOpKey);
    if (alreadyRefunded) {
      const currentBalance = await db.getCreditBalance(userId);
      return { success: true, refundedAmount: refundAmount, newBalance: currentBalance };
    }

    const refundRecord = await db.recordCreditTransaction({
      userId,
      transactionType: 'refund',
      amount: refundAmount,
      operationId: refundOpKey,
      projectId: chargedTx.projectId,
      reason: `Refund: ${reason}`,
      metadata: { originalTransactionId: chargedTx.id },
    });

    return {
      success: true,
      refundedAmount: refundAmount,
      newBalance: refundRecord.balanceAfter,
    };
  }

  /**
   * Grants purchased credits from a top-up pack.
   */
  async grantPurchasedCredits(
    userId: string,
    packId: string,
    paymentId: string
  ): Promise<{ success: boolean; creditsAdded: number; newBalance: number }> {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      throw new Error(`Invalid credit pack: ${packId}`);
    }

    const opKey = `topup_${paymentId}`;
    const alreadyGranted = await db.hasOperationBeenCharged(opKey);
    if (alreadyGranted) {
      const b = await db.getCreditBalance(userId);
      return { success: true, creditsAdded: pack.credits, newBalance: b };
    }

    const record = await db.recordCreditTransaction({
      userId,
      transactionType: 'purchase',
      amount: pack.credits,
      operationId: opKey,
      reason: `Top-up: ${pack.name} (+${pack.credits} credits)`,
      metadata: { packId: pack.id, paymentId },
    });

    return {
      success: true,
      creditsAdded: pack.credits,
      newBalance: record.balanceAfter,
    };
  }

  /**
   * Grants monthly subscription credits upon plan upgrade or renewal.
   */
  async grantSubscriptionCredits(
    userId: string,
    planId: 'free' | 'pro' | 'business',
    eventId: string
  ): Promise<{ creditsGranted: number; newBalance: number }> {
    const plan = PLAN_CONFIGS[planId] || PLAN_CONFIGS.free;
    const opKey = `sub_grant_${eventId}`;

    const alreadyGranted = await db.hasOperationBeenCharged(opKey);
    if (alreadyGranted) {
      const b = await db.getCreditBalance(userId);
      return { creditsGranted: plan.includedMonthlyCredits, newBalance: b };
    }

    const record = await db.recordCreditTransaction({
      userId,
      transactionType: 'allocation',
      amount: plan.includedMonthlyCredits,
      operationId: opKey,
      reason: `Subscription plan allocation: ${plan.name} (+${plan.includedMonthlyCredits} credits)`,
      metadata: { planId, eventId },
    });

    return {
      creditsGranted: plan.includedMonthlyCredits,
      newBalance: record.balanceAfter,
    };
  }
}

export const creditService = new CreditService();
