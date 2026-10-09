import { db } from '../db';
import { creditService } from './credit-service';
import { PLAN_CONFIGS, PlanConfig, PlanEntitlements } from './plans-config';

export interface UserEntitlementsSummary {
  planId: 'free' | 'pro' | 'business';
  planName: string;
  plan: PlanConfig;
  status: string;
  creditBalance: number;
  entitlements: PlanEntitlements;
  usage: {
    activeProjectsCount: number;
    maxProjects: number;
    monthlyAnalysesCount: number;
    maxAnalysesPerMonth: number;
    customDomainsCount: number;
    maxCustomDomains: number;
    githubSyncAllowed: boolean;
  };
}

export class EntitlementService {
  /**
   * Get full entitlement & usage summary for a user.
   */
  async getUserEntitlements(userId: string): Promise<UserEntitlementsSummary> {
    const { balance, subscription } = await creditService.ensureAccountCredits(userId);
    const planId = subscription.planId || 'free';
    const plan = PLAN_CONFIGS[planId] || PLAN_CONFIGS.free;

    // Calculate usage metrics
    const projects = await db.listProjects(userId);
    const activeProjectsCount = projects.filter((p) => p.status === 'active').length;

    // Analyses in current billing cycle
    const cycleStart = new Date(subscription.currentPeriodStart).getTime();
    const aiUsage = await db.listAiUsage(userId, 100);
    const monthlyAnalysesCount = aiUsage.filter(
      (a) => a.actionType === 'analysis' && new Date(a.createdAt).getTime() >= cycleStart
    ).length;

    // Custom domains in use across all projects
    const allDomains = await Promise.all(
      projects.map((p) => db.listProjectDomains(p.id, userId))
    );
    const customDomainsCount = allDomains.flat().length;

    return {
      planId,
      planName: plan.name,
      plan,
      status: subscription.status,
      creditBalance: balance,
      entitlements: plan.entitlements,
      usage: {
        activeProjectsCount,
        maxProjects: plan.entitlements.maxProjects,
        monthlyAnalysesCount,
        maxAnalysesPerMonth: plan.entitlements.maxAnalysesPerMonth,
        customDomainsCount,
        maxCustomDomains: plan.entitlements.customDomainsAllowed,
        githubSyncAllowed: plan.entitlements.githubSyncAllowed,
      },
    };
  }

  /**
   * Validates if user is entitled to run a URL reference analysis.
   */
  async assertCanAnalyze(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const summary = await this.getUserEntitlements(userId);

    // 1. Check monthly analysis limit
    if (summary.usage.monthlyAnalysesCount >= summary.usage.maxAnalysesPerMonth) {
      return {
        allowed: false,
        error: `Monthly analysis limit reached (${summary.usage.monthlyAnalysesCount}/${summary.usage.maxAnalysesPerMonth}). Upgrade to Pro or Business to analyze more reference websites.`,
      };
    }

    // 2. Check credits (1 credit)
    if (summary.creditBalance < 1) {
      return {
        allowed: false,
        error: `You need at least 1 AI credit to analyze a website. Your current balance is 0 credits. Please upgrade your plan or top up credits.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Validates if user is entitled to generate a website.
   */
  async assertCanGenerate(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const summary = await this.getUserEntitlements(userId);

    // 1. Check max projects limit
    if (summary.usage.activeProjectsCount >= summary.usage.maxProjects) {
      return {
        allowed: false,
        error: `Active project limit reached (${summary.usage.activeProjectsCount}/${summary.usage.maxProjects} projects). Upgrade to Pro or Business to create more projects, or archive an existing project.`,
      };
    }

    // 2. Check credits (5 credits)
    if (summary.creditBalance < 5) {
      return {
        allowed: false,
        error: `Generating an original website requires 5 AI credits. You currently have ${summary.creditBalance} credits. Please upgrade your plan or top up credits to proceed.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Validates if user is entitled to apply an AI natural language edit.
   */
  async assertCanEdit(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const summary = await this.getUserEntitlements(userId);

    if (summary.creditBalance < 1) {
      return {
        allowed: false,
        error: `AI edits require 1 credit. Your current balance is 0 credits. Please upgrade or top up credits.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Validates if user can connect an additional custom domain.
   */
  async assertCanAddCustomDomain(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const summary = await this.getUserEntitlements(userId);

    if (summary.usage.maxCustomDomains <= 0) {
      return {
        allowed: false,
        error: `Custom domains are available on Pro and Business plans. Upgrade to Pro to connect custom domains with automated SSL/TLS certificates.`,
      };
    }

    if (summary.usage.customDomainsCount >= summary.usage.maxCustomDomains) {
      return {
        allowed: false,
        error: `Custom domain limit reached (${summary.usage.customDomainsCount}/${summary.usage.maxCustomDomains} domains). Upgrade to Business for up to 10 custom domains.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Validates if user is entitled to sync/push to GitHub.
   */
  async assertCanSyncGitHub(userId: string): Promise<{ allowed: boolean; error?: string }> {
    const summary = await this.getUserEntitlements(userId);

    if (!summary.usage.githubSyncAllowed) {
      return {
        allowed: false,
        error: `GitHub repository synchronization is a Pro and Business feature. Upgrade to Pro to push generated React code directly to GitHub.`,
      };
    }

    return { allowed: true };
  }
}

export const entitlementService = new EntitlementService();
