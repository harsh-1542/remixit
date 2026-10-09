import { DesignSpecification } from '../types';
import { WebsiteDefinition, UserGenerationConfig } from '../../src/types/website-definition';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus =
  | 'queued'
  | 'preparing'
  | 'building'
  | 'deploying'
  | 'ready'
  | 'failed'
  | 'cancelled'
  | 'unpublished';

export type DeploymentProviderType = 'remix_managed' | 'vercel';

export interface DeploymentRecord {
  id: string;
  projectId: string;
  userId: string;
  projectVersionId: string;
  versionNumber: number;
  provider: DeploymentProviderType;
  providerDeploymentId: string;
  deploymentUrl: string;
  status: DeploymentStatus;
  buildLogSummary?: string;
  errorCode?: string;
  errorMessage?: string;
  description?: string;
  publishedSnapshot: WebsiteDefinition;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  unpublishedAt?: string;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  referenceUrl?: string;
  referenceAnalysisId?: string;
  currentVersionId?: string;
  currentDeploymentId?: string;
  publishedUrl?: string;
  publishedVersionId?: string;
  publishedAt?: string;
  deploymentStatus?: DeploymentStatus;
  createdAt: string;
  updatedAt: string;
  // Included in summaries
  currentVersion?: ProjectVersionRecord;
  versionsCount?: number;
}

export interface ProjectVersionRecord {
  id: string;
  projectId: string;
  versionNumber: number;
  websiteDefinition: WebsiteDefinition;
  generationConfiguration?: UserGenerationConfig;
  editPrompt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface ReferenceAnalysisRecord {
  id: string;
  userId?: string;
  sourceUrl: string;
  normalizedUrl: string;
  designSpecification: DesignSpecification;
  desktopScreenshotPath?: string;
  mobileScreenshotPath?: string;
  analysisStatus: string;
  createdAt: string;
}

export interface SavedWebsiteRecord {
  id: string;
  userId: string;
  websiteId: string;
  createdAt: string;
}

// --- Phase 6: GitHub Integration Types ---
export interface GitHubConnectionRecord {
  id: string;
  userId: string;
  githubUserId: string;
  githubUsername: string;
  githubAvatarUrl?: string;
  accessToken: string; // Stored securely on server
  scopes: string[];
  connectedAt: string;
  updatedAt: string;
}

export interface ProjectRepositoryRecord {
  id: string;
  projectId: string;
  userId: string;
  githubConnectionId: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  visibility: 'public' | 'private';
  defaultBranch: string;
  lastSyncCommitSha?: string;
  lastSyncCommitMessage?: string;
  lastSyncAt?: string;
  syncStatus: 'synced' | 'pending' | 'syncing' | 'failed' | 'conflict';
  syncError?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Phase 6: Custom Domain Types ---
export type DomainVerificationStatus =
  | 'not_configured'
  | 'pending_dns'
  | 'awaiting_verification'
  | 'verifying'
  | 'ssl_provisioning'
  | 'active'
  | 'failed';

export interface DnsInstructionRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl?: number;
  purpose: string;
}

export interface CustomDomainRecord {
  id: string;
  projectId: string;
  userId: string;
  deploymentId?: string;
  provider: 'remix_managed' | 'vercel';
  domain: string; // e.g. example.com or app.example.com
  normalizedDomain: string;
  isApex: boolean;
  isPrimary: boolean;
  verificationStatus: DomainVerificationStatus;
  sslStatus: 'active' | 'provisioning' | 'pending' | 'failed';
  verificationToken: string;
  dnsRecords: DnsInstructionRecord[];
  lastCheckedAt?: string;
  verifiedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseService {
  // User Profiles
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;

  // Projects
  listProjects(userId: string, options?: { search?: string; sortBy?: 'updated_at' | 'created_at' | 'name' }): Promise<ProjectRecord[]>;
  getProject(projectId: string, userId: string): Promise<ProjectRecord | null>;
  getProjectById(projectId: string): Promise<ProjectRecord | null>;
  createProject(data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, initialVersion?: { definition: WebsiteDefinition; config?: UserGenerationConfig }): Promise<ProjectRecord>;
  updateProject(projectId: string, userId: string, updates: Partial<ProjectRecord>): Promise<ProjectRecord>;
  deleteProject(projectId: string, userId: string): Promise<boolean>;
  duplicateProject(projectId: string, userId: string): Promise<ProjectRecord>;

  // Versions
  listVersions(projectId: string, userId: string): Promise<ProjectVersionRecord[]>;
  getVersion(versionId: string, projectId: string, userId: string): Promise<ProjectVersionRecord | null>;
  createVersion(projectId: string, userId: string, definition: WebsiteDefinition, editPrompt?: string): Promise<ProjectVersionRecord>;
  restoreVersion(projectId: string, versionId: string, userId: string): Promise<ProjectRecord>;

  // Deployments
  createDeployment(data: Omit<DeploymentRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DeploymentRecord>;
  getDeployment(deploymentId: string, userId?: string): Promise<DeploymentRecord | null>;
  listDeployments(projectId: string, userId: string): Promise<DeploymentRecord[]>;
  updateDeployment(deploymentId: string, updates: Partial<DeploymentRecord>): Promise<DeploymentRecord>;
  unpublishDeployment(deploymentId: string, userId: string): Promise<DeploymentRecord>;
  getPublicDeployment(deploymentId: string): Promise<DeploymentRecord | null>;

  // Saved References
  listSavedWebsites(userId: string): Promise<SavedWebsiteRecord[]>;
  saveWebsite(userId: string, websiteId: string): Promise<SavedWebsiteRecord>;
  removeSavedWebsite(userId: string, websiteId: string): Promise<boolean>;
  isWebsiteSaved(userId: string, websiteId: string): Promise<boolean>;

  // Analyses
  saveAnalysis(analysis: Omit<ReferenceAnalysisRecord, 'createdAt'>): Promise<ReferenceAnalysisRecord>;
  getAnalysis(id: string): Promise<ReferenceAnalysisRecord | null>;

  // Phase 6: GitHub Integration
  getGitHubConnection(userId: string): Promise<GitHubConnectionRecord | null>;
  saveGitHubConnection(data: GitHubConnectionRecord): Promise<GitHubConnectionRecord>;
  deleteGitHubConnection(userId: string): Promise<boolean>;

  getProjectRepository(projectId: string, userId: string): Promise<ProjectRepositoryRecord | null>;
  saveProjectRepository(data: ProjectRepositoryRecord): Promise<ProjectRepositoryRecord>;
  deleteProjectRepository(projectId: string, userId: string): Promise<boolean>;

  // Phase 6: Custom Domains
  listProjectDomains(projectId: string, userId: string): Promise<CustomDomainRecord[]>;
  getDomain(domainId: string, userId: string): Promise<CustomDomainRecord | null>;
  getDomainById(domainId: string): Promise<CustomDomainRecord | null>;
  findDomainByName(domain: string): Promise<CustomDomainRecord | null>;
  saveDomain(data: CustomDomainRecord): Promise<CustomDomainRecord>;
  updateDomain(domainId: string, updates: Partial<CustomDomainRecord>): Promise<CustomDomainRecord>;
  deleteDomain(domainId: string, userId: string): Promise<boolean>;
  setPrimaryDomain(projectId: string, domainId: string, userId: string): Promise<CustomDomainRecord[]>;

  // Phase 7: Subscriptions, Usage Credits & Payments
  getSubscription(userId: string): Promise<SubscriptionRecord | null>;
  saveSubscription(data: SubscriptionRecord): Promise<SubscriptionRecord>;
  updateSubscription(id: string, updates: Partial<SubscriptionRecord>): Promise<SubscriptionRecord>;

  getCreditBalance(userId: string): Promise<number>;
  recordCreditTransaction(tx: Omit<CreditLedgerRecord, 'id' | 'createdAt' | 'balanceAfter'>): Promise<CreditLedgerRecord>;
  listCreditTransactions(userId: string, limit?: number): Promise<CreditLedgerRecord[]>;
  hasOperationBeenCharged(operationId: string): Promise<boolean>;

  recordPayment(data: PaymentRecord): Promise<PaymentRecord>;
  listPayments(userId: string): Promise<PaymentRecord[]>;
  getPayment(paymentId: string): Promise<PaymentRecord | null>;

  recordAiUsage(data: AiUsageRecord): Promise<AiUsageRecord>;
  listAiUsage(userId: string, limit?: number): Promise<AiUsageRecord[]>;

  isWebhookEventProcessed(provider: string, eventId: string): Promise<boolean>;
  recordWebhookEvent(event: WebhookEventRecord): Promise<void>;
}

// --- Phase 7: Monetization & Billing Models ---
export type SubscriptionStatus =
  | 'free'
  | 'checkout_pending'
  | 'active'
  | 'renewal_pending'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: 'free' | 'pro' | 'business';
  status: SubscriptionStatus;
  billingInterval: 'monthly' | 'annual';
  provider: 'stripe' | 'razorpay' | 'system';
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreditTransactionType =
  | 'allocation'
  | 'signup_bonus'
  | 'purchase'
  | 'analysis'
  | 'generation'
  | 'edit'
  | 'regeneration'
  | 'section_regeneration'
  | 'refund'
  | 'adjustment'
  | 'expiration';

export interface CreditLedgerRecord {
  id: string;
  userId: string;
  transactionType: CreditTransactionType;
  amount: number; // Signed integer (e.g. +500, -5, +100)
  balanceAfter: number;
  operationId?: string;
  projectId?: string;
  reason: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'refunded';
export type PaymentType = 'subscription' | 'topup';

export interface PaymentRecord {
  id: string;
  userId: string;
  subscriptionId?: string;
  provider: 'stripe' | 'razorpay' | 'system';
  providerPaymentId: string;
  providerOrderId?: string;
  amount: number; // In cents/smallest currency unit (e.g. 2900 for $29.00)
  currency: string;
  status: PaymentStatus;
  paymentType: PaymentType;
  planId?: string;
  creditPackId?: string;
  creditsGranted: number;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiUsageRecord {
  id: string;
  userId: string;
  projectId?: string;
  operationId: string;
  actionType: 'analysis' | 'generation' | 'edit' | 'regeneration' | 'section_regeneration';
  model: string;
  creditsCharged: number;
  status: 'success' | 'failed' | 'refunded';
  createdAt: string;
  completedAt?: string;
}

export interface WebhookEventRecord {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  status: 'processed' | 'failed' | 'ignored';
  receivedAt: string;
  processedAt: string;
}
