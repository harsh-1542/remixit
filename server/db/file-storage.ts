import fs from 'fs';
import path from 'path';
import {
  DatabaseService,
  UserProfile,
  ProjectRecord,
  ProjectVersionRecord,
  ReferenceAnalysisRecord,
  SavedWebsiteRecord,
  DeploymentRecord,
  DeploymentStatus,
  GitHubConnectionRecord,
  ProjectRepositoryRecord,
  CustomDomainRecord,
  SubscriptionRecord,
  CreditLedgerRecord,
  PaymentRecord,
  AiUsageRecord,
  WebhookEventRecord,
} from './types';
import { WebsiteDefinition, UserGenerationConfig } from '../../src/types/website-definition';

interface DatabaseData {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  sessions: Array<{
    token: string;
    userId: string;
    expiresAt: number;
  }>;
  profiles: UserProfile[];
  projects: ProjectRecord[];
  project_versions: ProjectVersionRecord[];
  reference_analyses: ReferenceAnalysisRecord[];
  saved_websites: SavedWebsiteRecord[];
  deployments: DeploymentRecord[];
  github_connections: GitHubConnectionRecord[];
  project_repositories: ProjectRepositoryRecord[];
  custom_domains: CustomDomainRecord[];
  subscriptions: SubscriptionRecord[];
  credit_ledger: CreditLedgerRecord[];
  payments: PaymentRecord[];
  ai_usage: AiUsageRecord[];
  webhook_events: WebhookEventRecord[];
}

export class FileStorageDatabaseService implements DatabaseService {
  private filePath: string;
  private data: DatabaseData;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'remix-store.json');
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    if (fs.existsSync(this.filePath)) {
      try {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.users && parsed.users.length > 0) {
          if (!parsed.deployments) parsed.deployments = [];
          if (!parsed.github_connections) parsed.github_connections = [];
          if (!parsed.project_repositories) parsed.project_repositories = [];
          if (!parsed.custom_domains) parsed.custom_domains = [];
          if (!parsed.subscriptions) parsed.subscriptions = [];
          if (!parsed.credit_ledger) parsed.credit_ledger = [];
          if (!parsed.payments) parsed.payments = [];
          if (!parsed.ai_usage) parsed.ai_usage = [];
          if (!parsed.webhook_events) parsed.webhook_events = [];
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse remix-store.json, creating new database file:', err);
      }
    }

    // Generate seed demo account (demo@remix.design / password123)
    const demoSalt = '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c';
    const demoDerived = '6543b35588a8f15ef71d0e5170d10c850efc93998b350e909da48512f451fec52077f80dbca30f7b99379659b85c3e6bb69c3a3cbf53ec68153cceca23eafe9b';
    const demoHash = `${demoSalt}:${demoDerived}`;
    const demoUserId = 'usr_demo_alex';
    const now = new Date().toISOString();

    const initial: DatabaseData = {
      users: [
        {
          id: demoUserId,
          email: 'demo@remix.design',
          passwordHash: demoHash,
          displayName: 'Alex Vance',
          avatarUrl: '',
          createdAt: now,
          updatedAt: now,
        },
      ],
      sessions: [],
      profiles: [
        {
          id: demoUserId,
          email: 'demo@remix.design',
          displayName: 'Alex Vance',
          createdAt: now,
          updatedAt: now,
        },
      ],
      projects: [
        {
          id: 'proj_nexus_ai',
          userId: demoUserId,
          name: 'Nexus AI Platform',
          description: 'Autonomous multi-agent orchestration for enterprise engineering workflows.',
          status: 'active',
          referenceUrl: 'https://forma.design',
          referenceAnalysisId: 'job_sample_1',
          currentVersionId: 'ver_nexus_v2',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: 'proj_aura_studio',
          userId: demoUserId,
          name: 'Aura Architecture',
          description: 'Contemporary architectural monograph and spatial exhibition portfolio.',
          status: 'active',
          referenceUrl: 'https://archetype.build',
          referenceAnalysisId: 'job_sample_2',
          currentVersionId: 'ver_aura_v1',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ],
      project_versions: [
        {
          id: 'ver_nexus_v1',
          projectId: 'proj_nexus_ai',
          versionNumber: 1,
          websiteDefinition: {
            id: 'proj_nexus_ai',
            name: 'Nexus AI Platform',
            tagline: 'Autonomous Multi-Agent Orchestration',
            description: 'Enterprise runtime for autonomous reasoning agents.',
            industry: 'AI',
            websiteType: 'SaaS marketing website',
            theme: {
              primaryColor: '#FFFFFF',
              secondaryColor: '#A1A1AA',
              accentColor: '#3B82F6',
              backgroundColor: '#09090B',
              cardBackground: '#18181B',
              textColor: '#F4F4F5',
              mutedTextColor: '#A1A1AA',
              borderColor: '#27272A',
              fontHeading: 'Plus Jakarta Sans',
              fontBody: 'Plus Jakarta Sans',
              radius: 'lg',
              mode: 'dark',
            },
            sections: [
              {
                id: 'sec_nav_1',
                type: 'navbar',
                brandName: 'nexus.',
                tagline: 'Autonomous AI',
                links: [
                  { label: 'Models', href: '#models' },
                  { label: 'Chains', href: '#chains' },
                  { label: 'Docs', href: '#docs' },
                ],
                primaryCta: { label: 'Deploy Agents', href: '#cta' },
              },
              {
                id: 'sec_hero_1',
                type: 'centered-hero',
                badge: 'Autonomous Intelligence Engine',
                heading: 'Orchestrate agents across any infrastructure.',
                description: 'Nexus coordinates autonomous reasoning agents with deterministic reliability and continuous observability.',
                primaryCta: { label: 'Start Free Sandbox', href: '#cta' },
                secondaryCta: { label: 'View Architecture', href: '#features' },
              },
              {
                id: 'sec_feat_1',
                type: 'feature-grid',
                badge: 'Capabilities',
                heading: 'Engineered for extreme precision',
                features: [
                  { title: 'Deterministic Chains', description: 'Guaranteed execution bounds with strict state machine validation.' },
                  { title: 'Sub-millisecond Latency', description: 'Zero-overhead edge routing for high-frequency interactive tools.' },
                  { title: 'Full Traceability', description: 'Replay every agent thought and step with cryptographically verified logs.' },
                ],
              },
              {
                id: 'sec_cta_1',
                type: 'cta',
                heading: 'Ready to build autonomous workflows?',
                description: 'Join thousands of engineering teams building on the Nexus agent runtime.',
                primaryCta: { label: 'Get Started Now', href: '#signup' },
              },
              {
                id: 'sec_foot_1',
                type: 'footer',
                brandName: 'nexus.',
                tagline: 'Autonomous AI Orchestration',
                copyright: '© 2026 Nexus Systems Inc. All rights reserved.',
                columns: [
                  { title: 'Product', links: [{ label: 'Agents', href: '#' }, { label: 'Security', href: '#' }] },
                  { title: 'Resources', links: [{ label: 'Docs', href: '#' }, { label: 'API', href: '#' }] },
                ],
              },
            ],
            meta: {
              title: 'Nexus AI Platform',
              description: 'Autonomous multi-agent orchestration for enterprise engineering workflows.',
              keywords: ['ai', 'agents', 'orchestration'],
            },
          },
          generationConfiguration: {
            name: 'Nexus AI Platform',
            description: 'Autonomous multi-agent orchestration for enterprise engineering workflows.',
            industry: 'AI',
            websiteType: 'SaaS marketing website',
            colorPreference: 'dark',
            customColors: { primary: '#FFFFFF', accent: '#3B82F6', background: '#09090B' },
          },
          editPrompt: 'Initial generation',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          createdBy: demoUserId,
        },
        {
          id: 'ver_nexus_v2',
          projectId: 'proj_nexus_ai',
          versionNumber: 2,
          websiteDefinition: {
            id: 'proj_nexus_ai',
            name: 'Nexus AI Platform',
            tagline: 'Autonomous Multi-Agent Orchestration',
            description: 'Enterprise runtime for autonomous reasoning agents.',
            industry: 'AI',
            websiteType: 'SaaS marketing website',
            theme: {
              primaryColor: '#FFFFFF',
              secondaryColor: '#A1A1AA',
              accentColor: '#6366F1',
              backgroundColor: '#09090B',
              cardBackground: '#18181B',
              textColor: '#F4F4F5',
              mutedTextColor: '#A1A1AA',
              borderColor: '#27272A',
              fontHeading: 'Plus Jakarta Sans',
              fontBody: 'Plus Jakarta Sans',
              radius: 'lg',
              mode: 'dark',
            },
            sections: [
              {
                id: 'sec_nav_1',
                type: 'navbar',
                brandName: 'nexus.',
                tagline: 'Autonomous AI',
                links: [
                  { label: 'Models', href: '#models' },
                  { label: 'Chains', href: '#chains' },
                  { label: 'Docs', href: '#docs' },
                ],
                primaryCta: { label: 'Deploy Agents', href: '#cta' },
              },
              {
                id: 'sec_hero_1',
                type: 'centered-hero',
                badge: 'Next-Gen Agent Runtime',
                heading: 'Orchestrate agents across any cloud or edge cluster.',
                description: 'Nexus coordinates autonomous reasoning agents with deterministic reliability, end-to-end encryption, and continuous observability.',
                primaryCta: { label: 'Deploy in 2 Minutes', href: '#cta' },
                secondaryCta: { label: 'Read Specification', href: '#features' },
              },
              {
                id: 'sec_feat_1',
                type: 'feature-grid',
                badge: 'Capabilities',
                heading: 'Engineered for mission-critical production',
                features: [
                  { title: 'Deterministic Chains', description: 'Guaranteed execution bounds with strict state machine validation.' },
                  { title: 'Sub-millisecond Latency', description: 'Zero-overhead edge routing for high-frequency interactive tools.' },
                  { title: 'Enterprise Audit Vault', description: 'Replay every agent thought and step with cryptographically signed logs.' },
                ],
              },
              {
                id: 'sec_cta_1',
                type: 'cta',
                heading: 'Scale your autonomous infrastructure.',
                description: 'Start with 10,000 free agent execution cycles every month.',
                primaryCta: { label: 'Create Free Account', href: '#signup' },
              },
              {
                id: 'sec_foot_1',
                type: 'footer',
                brandName: 'nexus.',
                tagline: 'Autonomous AI Orchestration',
                copyright: '© 2026 Nexus Systems Inc. All rights reserved.',
                columns: [
                  { title: 'Product', links: [{ label: 'Agents', href: '#' }, { label: 'Security', href: '#' }] },
                  { title: 'Resources', links: [{ label: 'Docs', href: '#' }, { label: 'API', href: '#' }] },
                ],
              },
            ],
            meta: {
              title: 'Nexus AI Platform',
              description: 'Autonomous multi-agent orchestration for enterprise engineering workflows.',
              keywords: ['ai', 'agents', 'orchestration'],
            },
          },
          generationConfiguration: {
            name: 'Nexus AI Platform',
            description: 'Autonomous multi-agent orchestration for enterprise engineering workflows.',
            industry: 'AI',
            websiteType: 'SaaS marketing website',
            colorPreference: 'dark',
            customColors: { primary: '#FFFFFF', accent: '#6366F1', background: '#09090B' },
          },
          editPrompt: 'Refined hero copy and changed accent to indigo',
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          createdBy: demoUserId,
        },
        {
          id: 'ver_aura_v1',
          projectId: 'proj_aura_studio',
          versionNumber: 1,
          websiteDefinition: {
            id: 'proj_aura_studio',
            name: 'Aura Architecture',
            tagline: 'Spatial Practice · Zurich & Milan',
            description: 'Contemporary architectural monograph and spatial exhibition portfolio.',
            industry: 'Architecture',
            websiteType: 'Portfolio and studio website',
            theme: {
              primaryColor: '#18181B',
              secondaryColor: '#52525B',
              accentColor: '#18181B',
              backgroundColor: '#FDFCF7',
              cardBackground: '#F4F4F0',
              textColor: '#18181B',
              mutedTextColor: '#52525B',
              borderColor: '#E4E4E7',
              fontHeading: 'Newsreader',
              fontBody: 'Plus Jakarta Sans',
              radius: 'none',
              mode: 'light',
            },
            sections: [
              {
                id: 'sec_nav_a',
                type: 'navbar',
                brandName: 'AURA',
                tagline: 'Spatial Monograph',
                links: [
                  { label: 'Works', href: '#works' },
                  { label: 'Philosophy', href: '#philosophy' },
                  { label: 'Contact', href: '#contact' },
                ],
                primaryCta: { label: 'Inquire', href: '#contact' },
              },
              {
                id: 'sec_hero_a',
                type: 'centered-hero',
                badge: 'Spatial Practice · 2026',
                heading: 'Architecture as an articulation of silence.',
                description: 'Aura conceives monolithic residential pavilions and public cultural pavilions situated throughout alpine and coastal topographies.',
                primaryCta: { label: 'View Monograph', href: '#works' },
                secondaryCta: { label: 'Selected Works', href: '#philosophy' },
              },
              {
                id: 'sec_feat_a',
                type: 'feature-grid',
                badge: 'Principles',
                heading: 'Tactility, light, and enduring mass',
                features: [
                  { title: 'Cast Concrete Forms', description: 'Massive board-marked concrete structures celebrating geological permanence.' },
                  { title: 'Rhythmic Fenestration', description: 'Floor-to-ceiling glass reveals framing contemplative natural horizons.' },
                  { title: 'Material Honesty', description: 'Unadorned limestone, weathered bronze, and rift-sawn oak throughout.' },
                ],
              },
              {
                id: 'sec_cta_a',
                type: 'cta',
                heading: 'Commission a private residence.',
                description: 'Studio commissions for 2026/2027 calendar are presently being reviewed.',
                primaryCta: { label: 'Request Portfolio Catalogue', href: '#contact' },
              },
              {
                id: 'sec_foot_a',
                type: 'footer',
                brandName: 'AURA ARCHITECTURE',
                tagline: 'Spatial Practice',
                copyright: '© 2026 Aura Studio AG. Zurich / Milan.',
                columns: [
                  { title: 'Offices', links: [{ label: 'Zurich', href: '#' }, { label: 'Milan', href: '#' }] },
                  { title: 'Archive', links: [{ label: 'Publications', href: '#' }, { label: 'Press', href: '#' }] },
                ],
              },
            ],
            meta: {
              title: 'Aura Architecture',
              description: 'Contemporary architectural monograph and spatial exhibition portfolio.',
              keywords: ['architecture', 'monograph', 'design'],
            },
          },
          generationConfiguration: {
            name: 'Aura Architecture',
            description: 'Contemporary architectural monograph and spatial exhibition portfolio.',
            industry: 'Architecture',
            websiteType: 'Portfolio and studio website',
            colorPreference: 'light',
            customColors: { primary: '#18181B', accent: '#18181B', background: '#FDFCF7' },
          },
          editPrompt: 'Initial generation',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          createdBy: demoUserId,
        },
      ],
      reference_analyses: [],
      saved_websites: [
        {
          id: 'save_seed_1',
          userId: demoUserId,
          websiteId: 'forma',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'save_seed_2',
          userId: demoUserId,
          websiteId: 'chrono',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
      deployments: [],
      github_connections: [],
      project_repositories: [],
      custom_domains: [],
      subscriptions: [],
      credit_ledger: [],
      payments: [],
      ai_usage: [],
      webhook_events: [],
    };
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseData): void {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write remix-store.json:', err);
    }
  }

  // --- Auth Helper Methods ---
  findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(user: { id: string; email: string; passwordHash: string; displayName: string }) {
    const now = new Date().toISOString();
    const newUser = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };
    this.data.users.push(newUser);
    const newProfile: UserProfile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: now,
      updatedAt: now,
    };
    this.data.profiles.push(newProfile);
    this.saveData();
    return newProfile;
  }

  createSession(token: string, userId: string, ttlMs: number = 7 * 24 * 60 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    this.data.sessions.push({ token, userId, expiresAt });
    this.saveData();
  }

  findSession(token: string) {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.deleteSession(token);
      return null;
    }
    return session;
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.saveData();
  }

  // --- Profiles ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    const profile = this.data.profiles.find((p) => p.id === userId);
    return profile ? { ...profile } : null;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const idx = this.data.profiles.findIndex((p) => p.id === userId);
    if (idx === -1) {
      throw new Error('Profile not found.');
    }
    const updated = {
      ...this.data.profiles[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.profiles[idx] = updated;

    // Keep user in sync
    const userIdx = this.data.users.findIndex((u) => u.id === userId);
    if (userIdx !== -1 && updates.displayName) {
      this.data.users[userIdx].displayName = updates.displayName;
    }

    this.saveData();
    return { ...updated };
  }

  // --- Projects ---
  async listProjects(
    userId: string,
    options?: { search?: string; sortBy?: 'updated_at' | 'created_at' | 'name' }
  ): Promise<ProjectRecord[]> {
    let list = this.data.projects.filter((p) => p.userId === userId);

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.referenceUrl && p.referenceUrl.toLowerCase().includes(q))
      );
    }

    // Attach currentVersion and versionsCount
    list = list.map((p) => {
      const versions = this.data.project_versions.filter((v) => v.projectId === p.id);
      const curVersion = p.currentVersionId
        ? versions.find((v) => v.id === p.currentVersionId) || versions[versions.length - 1]
        : versions[versions.length - 1];

      return {
        ...p,
        currentVersion: curVersion,
        versionsCount: versions.length,
      };
    });

    const sortBy = options?.sortBy || 'updated_at';
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created_at') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return list;
  }

  async getProject(projectId: string, userId: string): Promise<ProjectRecord | null> {
    const project = this.data.projects.find((p) => p.id === projectId && p.userId === userId);
    if (!project) return null;

    const versions = this.data.project_versions.filter((v) => v.projectId === project.id);
    const curVersion = project.currentVersionId
      ? versions.find((v) => v.id === project.currentVersionId) || versions[versions.length - 1]
      : versions[versions.length - 1];

    return {
      ...project,
      currentVersion: curVersion,
      versionsCount: versions.length,
    };
  }

  async getProjectById(projectId: string): Promise<ProjectRecord | null> {
    const project = this.data.projects.find((p) => p.id === projectId);
    if (!project) return null;

    const versions = this.data.project_versions.filter((v) => v.projectId === project.id);
    const curVersion = project.currentVersionId
      ? versions.find((v) => v.id === project.currentVersionId) || versions[versions.length - 1]
      : versions[versions.length - 1];

    return {
      ...project,
      currentVersion: curVersion,
      versionsCount: versions.length,
    };
  }

  async createProject(
    data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    initialVersion?: { definition: WebsiteDefinition; config?: UserGenerationConfig }
  ): Promise<ProjectRecord> {
    const now = new Date().toISOString();
    const projectId = data.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let currentVersionId: string | undefined = undefined;

    if (initialVersion?.definition) {
      const versionId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const verRecord: ProjectVersionRecord = {
        id: versionId,
        projectId,
        versionNumber: 1,
        websiteDefinition: initialVersion.definition,
        generationConfiguration: initialVersion.config,
        editPrompt: 'Initial generation',
        createdAt: now,
        createdBy: data.userId,
      };
      this.data.project_versions.push(verRecord);
      currentVersionId = versionId;
    }

    const newProject: ProjectRecord = {
      ...data,
      id: projectId,
      currentVersionId,
      createdAt: now,
      updatedAt: now,
    };

    this.data.projects.push(newProject);
    this.saveData();
    return this.getProject(projectId, data.userId) as Promise<ProjectRecord>;
  }

  async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<ProjectRecord>
  ): Promise<ProjectRecord> {
    const idx = this.data.projects.findIndex((p) => p.id === projectId && p.userId === userId);
    if (idx === -1) {
      throw new Error('Project not found or unauthorized.');
    }

    const updated = {
      ...this.data.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.projects[idx] = updated;
    this.saveData();
    return (await this.getProject(projectId, userId))!;
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    const idx = this.data.projects.findIndex((p) => p.id === projectId && p.userId === userId);
    if (idx === -1) return false;

    // Delete project
    this.data.projects.splice(idx, 1);
    // Delete associated versions
    this.data.project_versions = this.data.project_versions.filter(
      (v) => v.projectId !== projectId
    );

    this.saveData();
    return true;
  }

  async duplicateProject(projectId: string, userId: string): Promise<ProjectRecord> {
    const original = await this.getProject(projectId, userId);
    if (!original) throw new Error('Original project not found.');

    const now = new Date().toISOString();
    const newProjectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newName = `${original.name} (Copy)`;

    let newVersionId: string | undefined = undefined;
    if (original.currentVersion) {
      newVersionId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const duplicatedVersion: ProjectVersionRecord = {
        id: newVersionId,
        projectId: newProjectId,
        versionNumber: 1,
        websiteDefinition: JSON.parse(JSON.stringify(original.currentVersion.websiteDefinition)),
        generationConfiguration: original.currentVersion.generationConfiguration
          ? JSON.parse(JSON.stringify(original.currentVersion.generationConfiguration))
          : undefined,
        editPrompt: `Duplicated from ${original.name}`,
        createdAt: now,
        createdBy: userId,
      };
      this.data.project_versions.push(duplicatedVersion);
    }

    const newProject: ProjectRecord = {
      id: newProjectId,
      userId,
      name: newName,
      description: original.description,
      status: 'active',
      referenceUrl: original.referenceUrl,
      referenceAnalysisId: original.referenceAnalysisId,
      currentVersionId: newVersionId,
      createdAt: now,
      updatedAt: now,
    };

    this.data.projects.push(newProject);
    this.saveData();
    return (await this.getProject(newProjectId, userId))!;
  }

  // --- Versions ---
  async listVersions(projectId: string, userId: string): Promise<ProjectVersionRecord[]> {
    const project = await this.getProject(projectId, userId);
    if (!project) throw new Error('Project not found or unauthorized.');

    return this.data.project_versions
      .filter((v) => v.projectId === projectId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getVersion(
    versionId: string,
    projectId: string,
    userId: string
  ): Promise<ProjectVersionRecord | null> {
    const project = await this.getProject(projectId, userId);
    if (!project) return null;

    const version = this.data.project_versions.find(
      (v) => v.id === versionId && v.projectId === projectId
    );
    return version ? { ...version } : null;
  }

  async createVersion(
    projectId: string,
    userId: string,
    definition: WebsiteDefinition,
    editPrompt?: string
  ): Promise<ProjectVersionRecord> {
    const project = await this.getProject(projectId, userId);
    if (!project) throw new Error('Project not found or unauthorized.');

    const versions = this.data.project_versions.filter((v) => v.projectId === projectId);
    const nextVersionNumber = versions.length > 0 ? Math.max(...versions.map((v) => v.versionNumber)) + 1 : 1;

    const now = new Date().toISOString();
    const newVersionId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newVersion: ProjectVersionRecord = {
      id: newVersionId,
      projectId,
      versionNumber: nextVersionNumber,
      websiteDefinition: definition,
      editPrompt: editPrompt || `Version ${nextVersionNumber}`,
      createdAt: now,
      createdBy: userId,
    };

    this.data.project_versions.push(newVersion);

    // Update project's currentVersionId and updatedAt
    await this.updateProject(projectId, userId, {
      currentVersionId: newVersionId,
      updatedAt: now,
    });

    this.saveData();
    return newVersion;
  }

  async restoreVersion(
    projectId: string,
    versionId: string,
    userId: string
  ): Promise<ProjectRecord> {
    const targetVersion = await this.getVersion(versionId, projectId, userId);
    if (!targetVersion) throw new Error('Version not found or unauthorized.');

    // Creating a new current version based on restored content preserves history!
    await this.createVersion(
      projectId,
      userId,
      JSON.parse(JSON.stringify(targetVersion.websiteDefinition)),
      `Restored from Version ${targetVersion.versionNumber}`
    );

    return (await this.getProject(projectId, userId))!;
  }

  // --- Saved References (Bookmarks) ---
  async listSavedWebsites(userId: string): Promise<SavedWebsiteRecord[]> {
    return this.data.saved_websites
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveWebsite(userId: string, websiteId: string): Promise<SavedWebsiteRecord> {
    const existing = this.data.saved_websites.find(
      (s) => s.userId === userId && s.websiteId === websiteId
    );
    if (existing) return existing;

    const record: SavedWebsiteRecord = {
      id: `save_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      websiteId,
      createdAt: new Date().toISOString(),
    };
    this.data.saved_websites.push(record);
    this.saveData();
    return record;
  }

  async removeSavedWebsite(userId: string, websiteId: string): Promise<boolean> {
    const before = this.data.saved_websites.length;
    this.data.saved_websites = this.data.saved_websites.filter(
      (s) => !(s.userId === userId && s.websiteId === websiteId)
    );
    const removed = this.data.saved_websites.length < before;
    if (removed) this.saveData();
    return removed;
  }

  async isWebsiteSaved(userId: string, websiteId: string): Promise<boolean> {
    return this.data.saved_websites.some(
      (s) => s.userId === userId && s.websiteId === websiteId
    );
  }

  // --- Analyses ---
  async saveAnalysis(
    analysis: Omit<ReferenceAnalysisRecord, 'createdAt'>
  ): Promise<ReferenceAnalysisRecord> {
    const record: ReferenceAnalysisRecord = {
      ...analysis,
      createdAt: new Date().toISOString(),
    };
    // Replace if exists
    const idx = this.data.reference_analyses.findIndex((a) => a.id === analysis.id);
    if (idx !== -1) {
      this.data.reference_analyses[idx] = record;
    } else {
      this.data.reference_analyses.push(record);
    }
    this.saveData();
    return record;
  }

  async getAnalysis(id: string): Promise<ReferenceAnalysisRecord | null> {
    const analysis = this.data.reference_analyses.find((a) => a.id === id);
    return analysis ? { ...analysis } : null;
  }

  // --- Deployments ---
  async createDeployment(
    data: Omit<DeploymentRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<DeploymentRecord> {
    const now = new Date().toISOString();
    const deploymentId = data.id || `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: DeploymentRecord = {
      ...data,
      id: deploymentId,
      createdAt: now,
      updatedAt: now,
    };
    this.data.deployments.push(record);

    // If ready, update the project's current deployment references
    if (data.status === 'ready') {
      const pIdx = this.data.projects.findIndex((p) => p.id === data.projectId);
      if (pIdx !== -1) {
        this.data.projects[pIdx].currentDeploymentId = deploymentId;
        this.data.projects[pIdx].publishedUrl = data.deploymentUrl;
        this.data.projects[pIdx].publishedVersionId = data.projectVersionId;
        this.data.projects[pIdx].publishedAt = data.publishedAt || now;
        this.data.projects[pIdx].deploymentStatus = 'ready';
        this.data.projects[pIdx].updatedAt = now;
      }
    }

    this.saveData();
    return { ...record };
  }

  async getDeployment(deploymentId: string, userId?: string): Promise<DeploymentRecord | null> {
    const dep = this.data.deployments.find((d) => d.id === deploymentId);
    if (!dep) return null;
    if (userId && dep.userId !== userId) return null;
    return { ...dep };
  }

  async listDeployments(projectId: string, userId: string): Promise<DeploymentRecord[]> {
    return this.data.deployments
      .filter((d) => d.projectId === projectId && d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((d) => ({ ...d }));
  }

  async updateDeployment(
    deploymentId: string,
    updates: Partial<DeploymentRecord>
  ): Promise<DeploymentRecord> {
    const idx = this.data.deployments.findIndex((d) => d.id === deploymentId);
    if (idx === -1) {
      throw new Error('Deployment not found.');
    }

    const now = new Date().toISOString();
    const updated: DeploymentRecord = {
      ...this.data.deployments[idx],
      ...updates,
      updatedAt: now,
    };
    this.data.deployments[idx] = updated;

    // Update project state if status changed
    const pIdx = this.data.projects.findIndex((p) => p.id === updated.projectId);
    if (pIdx !== -1) {
      if (updated.status === 'ready') {
        this.data.projects[pIdx].currentDeploymentId = updated.id;
        this.data.projects[pIdx].publishedUrl = updated.deploymentUrl;
        this.data.projects[pIdx].publishedVersionId = updated.projectVersionId;
        this.data.projects[pIdx].publishedAt = updated.publishedAt || now;
        this.data.projects[pIdx].deploymentStatus = 'ready';
        this.data.projects[pIdx].updatedAt = now;
      } else if (updated.status === 'failed' && this.data.projects[pIdx].currentDeploymentId === updated.id) {
        this.data.projects[pIdx].deploymentStatus = 'failed';
        this.data.projects[pIdx].updatedAt = now;
      }
    }

    this.saveData();
    return { ...updated };
  }

  async unpublishDeployment(deploymentId: string, userId: string): Promise<DeploymentRecord> {
    const dep = await this.getDeployment(deploymentId, userId);
    if (!dep) throw new Error('Deployment not found or unauthorized.');

    const now = new Date().toISOString();
    const updated = await this.updateDeployment(deploymentId, {
      status: 'unpublished',
      unpublishedAt: now,
    });

    // Reset project active publishing fields if this was the current deployment
    const pIdx = this.data.projects.findIndex((p) => p.id === dep.projectId && p.userId === userId);
    if (pIdx !== -1 && this.data.projects[pIdx].currentDeploymentId === deploymentId) {
      this.data.projects[pIdx].deploymentStatus = 'unpublished';
      this.data.projects[pIdx].publishedUrl = undefined;
      this.data.projects[pIdx].currentDeploymentId = undefined;
      this.data.projects[pIdx].publishedVersionId = undefined;
      this.data.projects[pIdx].updatedAt = now;
      this.saveData();
    }

    return updated;
  }

  async getPublicDeployment(deploymentId: string): Promise<DeploymentRecord | null> {
    const dep = this.data.deployments.find((d) => d.id === deploymentId);
    if (!dep) return null;
    return { ...dep };
  }

  // --- Phase 6: GitHub Connections ---
  async getGitHubConnection(userId: string): Promise<GitHubConnectionRecord | null> {
    const conn = this.data.github_connections.find((c) => c.userId === userId);
    return conn ? { ...conn } : null;
  }

  async saveGitHubConnection(data: GitHubConnectionRecord): Promise<GitHubConnectionRecord> {
    const idx = this.data.github_connections.findIndex((c) => c.userId === data.userId);
    if (idx !== -1) {
      this.data.github_connections[idx] = { ...data, updatedAt: new Date().toISOString() };
    } else {
      this.data.github_connections.push({ ...data });
    }
    this.saveData();
    return { ...data };
  }

  async deleteGitHubConnection(userId: string): Promise<boolean> {
    const prevLen = this.data.github_connections.length;
    this.data.github_connections = this.data.github_connections.filter((c) => c.userId !== userId);
    this.saveData();
    return this.data.github_connections.length < prevLen;
  }

  // --- Phase 6: Project Repositories ---
  async getProjectRepository(projectId: string, userId: string): Promise<ProjectRepositoryRecord | null> {
    const repo = this.data.project_repositories.find((r) => r.projectId === projectId && r.userId === userId);
    return repo ? { ...repo } : null;
  }

  async saveProjectRepository(data: ProjectRepositoryRecord): Promise<ProjectRepositoryRecord> {
    const idx = this.data.project_repositories.findIndex((r) => r.projectId === data.projectId && r.userId === data.userId);
    if (idx !== -1) {
      this.data.project_repositories[idx] = { ...data, updatedAt: new Date().toISOString() };
    } else {
      this.data.project_repositories.push({ ...data });
    }
    this.saveData();
    return { ...data };
  }

  async deleteProjectRepository(projectId: string, userId: string): Promise<boolean> {
    const prevLen = this.data.project_repositories.length;
    this.data.project_repositories = this.data.project_repositories.filter((r) => !(r.projectId === projectId && r.userId === userId));
    this.saveData();
    return this.data.project_repositories.length < prevLen;
  }

  // --- Phase 6: Custom Domains ---
  async listProjectDomains(projectId: string, userId: string): Promise<CustomDomainRecord[]> {
    return this.data.custom_domains
      .filter((d) => d.projectId === projectId && d.userId === userId)
      .map((d) => ({ ...d }));
  }

  async getDomain(domainId: string, userId: string): Promise<CustomDomainRecord | null> {
    const domain = this.data.custom_domains.find((d) => d.id === domainId && d.userId === userId);
    return domain ? { ...domain } : null;
  }

  async getDomainById(domainId: string): Promise<CustomDomainRecord | null> {
    const domain = this.data.custom_domains.find((d) => d.id === domainId);
    return domain ? { ...domain } : null;
  }

  async findDomainByName(domain: string): Promise<CustomDomainRecord | null> {
    const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const found = this.data.custom_domains.find((d) => d.normalizedDomain === normalized);
    return found ? { ...found } : null;
  }

  async saveDomain(data: CustomDomainRecord): Promise<CustomDomainRecord> {
    const idx = this.data.custom_domains.findIndex((d) => d.id === data.id);
    if (idx !== -1) {
      this.data.custom_domains[idx] = { ...data, updatedAt: new Date().toISOString() };
    } else {
      this.data.custom_domains.push({ ...data });
    }
    this.saveData();
    return { ...data };
  }

  async updateDomain(domainId: string, updates: Partial<CustomDomainRecord>): Promise<CustomDomainRecord> {
    const idx = this.data.custom_domains.findIndex((d) => d.id === domainId);
    if (idx === -1) {
      throw new Error('Custom domain not found.');
    }
    const updated: CustomDomainRecord = {
      ...this.data.custom_domains[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.custom_domains[idx] = updated;
    this.saveData();
    return { ...updated };
  }

  async deleteDomain(domainId: string, userId: string): Promise<boolean> {
    const domain = this.data.custom_domains.find((d) => d.id === domainId && d.userId === userId);
    if (!domain) return false;

    this.data.custom_domains = this.data.custom_domains.filter((d) => d.id !== domainId);

    // If this was primary and there are remaining domains, set another as primary
    if (domain.isPrimary) {
      const remaining = this.data.custom_domains.filter((d) => d.projectId === domain.projectId);
      if (remaining.length > 0) {
        remaining[0].isPrimary = true;
      }
    }

    this.saveData();
    return true;
  }

  async setPrimaryDomain(projectId: string, domainId: string, userId: string): Promise<CustomDomainRecord[]> {
    const projectDomains = this.data.custom_domains.filter((d) => d.projectId === projectId && d.userId === userId);
    for (const d of projectDomains) {
      d.isPrimary = d.id === domainId;
      d.updatedAt = new Date().toISOString();
    }
    this.saveData();
    return projectDomains.map((d) => ({ ...d }));
  }

  // --- Phase 7: Subscriptions, Credits & Billing Methods ---
  async getSubscription(userId: string): Promise<SubscriptionRecord | null> {
    const sub = this.data.subscriptions.find((s) => s.userId === userId);
    return sub ? { ...sub } : null;
  }

  async saveSubscription(data: SubscriptionRecord): Promise<SubscriptionRecord> {
    const idx = this.data.subscriptions.findIndex((s) => s.id === data.id || s.userId === data.userId);
    const now = new Date().toISOString();
    const record: SubscriptionRecord = {
      ...data,
      updatedAt: now,
    };
    if (idx !== -1) {
      this.data.subscriptions[idx] = record;
    } else {
      this.data.subscriptions.push(record);
    }
    this.saveData();
    return { ...record };
  }

  async updateSubscription(id: string, updates: Partial<SubscriptionRecord>): Promise<SubscriptionRecord> {
    const idx = this.data.subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error(`Subscription ${id} not found.`);
    }
    const now = new Date().toISOString();
    const updated: SubscriptionRecord = {
      ...this.data.subscriptions[idx],
      ...updates,
      updatedAt: now,
    };
    this.data.subscriptions[idx] = updated;
    this.saveData();
    return { ...updated };
  }

  async getCreditBalance(userId: string): Promise<number> {
    const userTxs = this.data.credit_ledger.filter((t) => t.userId === userId);
    if (userTxs.length === 0) return 0;
    // Sum signed amounts
    const balance = userTxs.reduce((sum, tx) => sum + tx.amount, 0);
    return Math.max(0, balance);
  }

  async recordCreditTransaction(
    tx: Omit<CreditLedgerRecord, 'id' | 'createdAt' | 'balanceAfter'>
  ): Promise<CreditLedgerRecord> {
    const now = new Date().toISOString();
    const currentBalance = await this.getCreditBalance(tx.userId);
    const newBalance = Math.max(0, currentBalance + tx.amount);

    const record: CreditLedgerRecord = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: tx.userId,
      transactionType: tx.transactionType,
      amount: tx.amount,
      balanceAfter: newBalance,
      operationId: tx.operationId,
      projectId: tx.projectId,
      reason: tx.reason,
      metadata: tx.metadata,
      createdAt: now,
    };

    this.data.credit_ledger.push(record);
    this.saveData();
    return { ...record };
  }

  async listCreditTransactions(userId: string, limit = 50): Promise<CreditLedgerRecord[]> {
    return this.data.credit_ledger
      .filter((t) => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((t) => ({ ...t }));
  }

  async hasOperationBeenCharged(operationId: string): Promise<boolean> {
    return this.data.credit_ledger.some(
      (t) => t.operationId === operationId && t.amount < 0
    );
  }

  async recordPayment(data: PaymentRecord): Promise<PaymentRecord> {
    const now = new Date().toISOString();
    const record: PaymentRecord = {
      ...data,
      updatedAt: now,
    };
    const idx = this.data.payments.findIndex(
      (p) => p.id === data.id || (p.providerPaymentId && p.providerPaymentId === data.providerPaymentId)
    );
    if (idx !== -1) {
      this.data.payments[idx] = record;
    } else {
      this.data.payments.push(record);
    }
    this.saveData();
    return { ...record };
  }

  async listPayments(userId: string): Promise<PaymentRecord[]> {
    return this.data.payments
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p) => ({ ...p }));
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    const p = this.data.payments.find((x) => x.id === paymentId || x.providerPaymentId === paymentId);
    return p ? { ...p } : null;
  }

  async recordAiUsage(data: AiUsageRecord): Promise<AiUsageRecord> {
    const idx = this.data.ai_usage.findIndex((a) => a.operationId === data.operationId);
    if (idx !== -1) {
      this.data.ai_usage[idx] = { ...data };
    } else {
      this.data.ai_usage.push({ ...data });
    }
    this.saveData();
    return { ...data };
  }

  async listAiUsage(userId: string, limit = 50): Promise<AiUsageRecord[]> {
    return this.data.ai_usage
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((a) => ({ ...a }));
  }

  async isWebhookEventProcessed(provider: string, eventId: string): Promise<boolean> {
    return this.data.webhook_events.some(
      (e) => e.provider === provider && e.eventId === eventId && e.status === 'processed'
    );
  }

  async recordWebhookEvent(event: WebhookEventRecord): Promise<void> {
    const idx = this.data.webhook_events.findIndex(
      (e) => e.provider === event.provider && e.eventId === event.eventId
    );
    if (idx !== -1) {
      this.data.webhook_events[idx] = { ...event };
    } else {
      this.data.webhook_events.push({ ...event });
    }
    this.saveData();
  }
}

export const fileStorageDb = new FileStorageDatabaseService();
