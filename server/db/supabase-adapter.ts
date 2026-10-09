import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DatabaseService,
  UserProfile,
  ProjectRecord,
  ProjectVersionRecord,
  ReferenceAnalysisRecord,
  SavedWebsiteRecord,
  DeploymentRecord,
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
import { fileStorageDb } from './file-storage';

export class SupabaseDatabaseService implements DatabaseService {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // --- User Profiles ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const patch: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.displayName !== undefined) patch.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;

    const { data, error } = await this.client
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // --- Projects ---
  async listProjects(
    userId: string,
    options?: { search?: string; sortBy?: 'updated_at' | 'created_at' | 'name' }
  ): Promise<ProjectRecord[]> {
    let query = this.client
      .from('projects')
      .select(`
        *,
        current_version:project_versions!fk_current_version(*),
        versions:project_versions(id)
      `)
      .eq('user_id', userId);

    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    const sortCol = options?.sortBy || 'updated_at';
    query = query.order(sortCol, { ascending: sortCol === 'name' });

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list projects: ${error.message}`);

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      status: row.status,
      referenceUrl: row.reference_url,
      referenceAnalysisId: row.reference_analysis_id,
      currentVersionId: row.current_version_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      currentVersion: row.current_version
        ? {
            id: row.current_version.id,
            projectId: row.current_version.project_id,
            versionNumber: row.current_version.version_number,
            websiteDefinition: row.current_version.website_definition,
            generationConfiguration: row.current_version.generation_configuration,
            editPrompt: row.current_version.edit_prompt,
            createdAt: row.current_version.created_at,
            createdBy: row.current_version.created_by,
          }
        : undefined,
      versionsCount: row.versions?.length || 0,
    }));
  }

  async getProject(projectId: string, userId: string): Promise<ProjectRecord | null> {
    const { data, error } = await this.client
      .from('projects')
      .select(`
        *,
        current_version:project_versions!fk_current_version(*),
        versions:project_versions(id)
      `)
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      status: data.status,
      referenceUrl: data.reference_url,
      referenceAnalysisId: data.reference_analysis_id,
      currentVersionId: data.current_version_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      currentVersion: data.current_version
        ? {
            id: data.current_version.id,
            projectId: data.current_version.project_id,
            versionNumber: data.current_version.version_number,
            websiteDefinition: data.current_version.website_definition,
            generationConfiguration: data.current_version.generation_configuration,
            editPrompt: data.current_version.edit_prompt,
            createdAt: data.current_version.created_at,
            createdBy: data.current_version.created_by,
          }
        : undefined,
      versionsCount: data.versions?.length || 0,
    };
  }

  async getProjectById(projectId: string): Promise<ProjectRecord | null> {
    return fileStorageDb.getProjectById(projectId);
  }

  async createProject(
    data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>,
    initialVersion?: { definition: WebsiteDefinition; config?: UserGenerationConfig }
  ): Promise<ProjectRecord> {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { error: insertErr } = await this.client.from('projects').insert({
      id: projectId,
      user_id: data.userId,
      name: data.name,
      description: data.description,
      status: data.status || 'active',
      reference_url: data.referenceUrl,
      reference_analysis_id: data.referenceAnalysisId,
      created_at: now,
      updated_at: now,
    });

    if (insertErr) throw new Error(`Project creation failed: ${insertErr.message}`);

    if (initialVersion?.definition) {
      const versionId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await this.client.from('project_versions').insert({
        id: versionId,
        project_id: projectId,
        version_number: 1,
        website_definition: initialVersion.definition,
        generation_configuration: initialVersion.config,
        edit_prompt: 'Initial generation',
        created_at: now,
        created_by: data.userId,
      });

      await this.client
        .from('projects')
        .update({ current_version_id: versionId })
        .eq('id', projectId);
    }

    return (await this.getProject(projectId, data.userId))!;
  }

  async updateProject(
    projectId: string,
    userId: string,
    updates: Partial<ProjectRecord>
  ): Promise<ProjectRecord> {
    const patch: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.currentVersionId !== undefined) patch.current_version_id = updates.currentVersionId;

    const { error } = await this.client
      .from('projects')
      .update(patch)
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) throw new Error(`Update failed: ${error.message}`);
    return (await this.getProject(projectId, userId))!;
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    return !error;
  }

  async duplicateProject(projectId: string, userId: string): Promise<ProjectRecord> {
    const original = await this.getProject(projectId, userId);
    if (!original) throw new Error('Original project not found.');

    const newProjectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { error: pErr } = await this.client.from('projects').insert({
      id: newProjectId,
      user_id: userId,
      name: `${original.name} (Copy)`,
      description: original.description,
      status: 'active',
      reference_url: original.referenceUrl,
      reference_analysis_id: original.referenceAnalysisId,
      created_at: now,
      updated_at: now,
    });

    if (pErr) throw new Error(`Duplication failed: ${pErr.message}`);

    if (original.currentVersion) {
      const newVersionId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await this.client.from('project_versions').insert({
        id: newVersionId,
        project_id: newProjectId,
        version_number: 1,
        website_definition: original.currentVersion.websiteDefinition,
        generation_configuration: original.currentVersion.generationConfiguration,
        edit_prompt: `Duplicated from ${original.name}`,
        created_at: now,
        created_by: userId,
      });

      await this.client
        .from('projects')
        .update({ current_version_id: newVersionId })
        .eq('id', newProjectId);
    }

    return (await this.getProject(newProjectId, userId))!;
  }

  // --- Versions ---
  async listVersions(projectId: string, userId: string): Promise<ProjectVersionRecord[]> {
    const project = await this.getProject(projectId, userId);
    if (!project) throw new Error('Unauthorized or project not found.');

    const { data, error } = await this.client
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    if (error) throw new Error(`Failed to list versions: ${error.message}`);

    return (data || []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      versionNumber: row.version_number,
      websiteDefinition: row.website_definition,
      generationConfiguration: row.generation_configuration,
      editPrompt: row.edit_prompt,
      createdAt: row.created_at,
      createdBy: row.created_by,
    }));
  }

  async getVersion(
    versionId: string,
    projectId: string,
    userId: string
  ): Promise<ProjectVersionRecord | null> {
    const project = await this.getProject(projectId, userId);
    if (!project) return null;

    const { data, error } = await this.client
      .from('project_versions')
      .select('*')
      .eq('id', versionId)
      .eq('project_id', projectId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      projectId: data.project_id,
      versionNumber: data.version_number,
      websiteDefinition: data.website_definition,
      generationConfiguration: data.generation_configuration,
      editPrompt: data.edit_prompt,
      createdAt: data.created_at,
      createdBy: data.created_by,
    };
  }

  async createVersion(
    projectId: string,
    userId: string,
    definition: WebsiteDefinition,
    editPrompt?: string
  ): Promise<ProjectVersionRecord> {
    const versions = await this.listVersions(projectId, userId);
    const nextVersionNumber = versions.length > 0 ? Math.max(...versions.map((v) => v.versionNumber)) + 1 : 1;

    const versionId = `ver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { error: vErr } = await this.client.from('project_versions').insert({
      id: versionId,
      project_id: projectId,
      version_number: nextVersionNumber,
      website_definition: definition,
      edit_prompt: editPrompt || `Version ${nextVersionNumber}`,
      created_at: now,
      created_by: userId,
    });

    if (vErr) throw new Error(`Version creation failed: ${vErr.message}`);

    await this.updateProject(projectId, userId, {
      currentVersionId: versionId,
    });

    return (await this.getVersion(versionId, projectId, userId))!;
  }

  async restoreVersion(
    projectId: string,
    versionId: string,
    userId: string
  ): Promise<ProjectRecord> {
    const version = await this.getVersion(versionId, projectId, userId);
    if (!version) throw new Error('Version not found or unauthorized.');

    await this.createVersion(
      projectId,
      userId,
      version.websiteDefinition,
      `Restored from Version ${version.versionNumber}`
    );

    return (await this.getProject(projectId, userId))!;
  }

  // --- Saved References ---
  async listSavedWebsites(userId: string): Promise<SavedWebsiteRecord[]> {
    const { data, error } = await this.client
      .from('saved_websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      websiteId: row.website_id,
      createdAt: row.created_at,
    }));
  }

  async saveWebsite(userId: string, websiteId: string): Promise<SavedWebsiteRecord> {
    const id = `save_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from('saved_websites')
      .upsert(
        { id, user_id: userId, website_id: websiteId, created_at: now },
        { onConflict: 'user_id,website_id' }
      )
      .select('*')
      .single();

    if (error) throw new Error(`Save failed: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      websiteId: data.website_id,
      createdAt: data.created_at,
    };
  }

  async removeSavedWebsite(userId: string, websiteId: string): Promise<boolean> {
    const { error } = await this.client
      .from('saved_websites')
      .delete()
      .eq('user_id', userId)
      .eq('website_id', websiteId);

    return !error;
  }

  async isWebsiteSaved(userId: string, websiteId: string): Promise<boolean> {
    const { count, error } = await this.client
      .from('saved_websites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('website_id', websiteId);

    return !error && (count || 0) > 0;
  }

  // --- Analyses ---
  async saveAnalysis(
    analysis: Omit<ReferenceAnalysisRecord, 'createdAt'>
  ): Promise<ReferenceAnalysisRecord> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('reference_analyses')
      .upsert({
        id: analysis.id,
        user_id: analysis.userId,
        source_url: analysis.sourceUrl,
        normalized_url: analysis.normalizedUrl,
        design_specification: analysis.designSpecification,
        desktop_screenshot_path: analysis.desktopScreenshotPath,
        mobile_screenshot_path: analysis.mobileScreenshotPath,
        analysis_status: analysis.analysisStatus,
        created_at: now,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Analysis save failed: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      sourceUrl: data.source_url,
      normalizedUrl: data.normalized_url,
      designSpecification: data.design_specification,
      desktopScreenshotPath: data.desktop_screenshot_path,
      mobileScreenshotPath: data.mobile_screenshot_path,
      analysisStatus: data.analysis_status,
      createdAt: data.created_at,
    };
  }

  async getAnalysis(id: string): Promise<ReferenceAnalysisRecord | null> {
    const { data, error } = await this.client
      .from('reference_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      sourceUrl: data.source_url,
      normalizedUrl: data.normalized_url,
      designSpecification: data.design_specification,
      desktopScreenshotPath: data.desktop_screenshot_path,
      mobileScreenshotPath: data.mobile_screenshot_path,
      analysisStatus: data.analysis_status,
      createdAt: data.created_at,
    };
  }

  // --- Deployments (Supabase with fileStorage fallback) ---
  async createDeployment(
    data: Omit<DeploymentRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<DeploymentRecord> {
    try {
      const now = new Date().toISOString();
      const deploymentId = data.id || `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const { data: row, error } = await this.client
        .from('deployments')
        .insert({
          id: deploymentId,
          project_id: data.projectId,
          user_id: data.userId,
          project_version_id: data.projectVersionId,
          version_number: data.versionNumber,
          provider: data.provider,
          provider_deployment_id: data.providerDeploymentId,
          deployment_url: data.deploymentUrl,
          status: data.status,
          build_log_summary: data.buildLogSummary,
          published_snapshot: data.publishedSnapshot,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();

      if (!error && row) {
        return {
          id: row.id,
          projectId: row.project_id,
          userId: row.user_id,
          projectVersionId: row.project_version_id,
          versionNumber: row.version_number,
          provider: row.provider,
          providerDeploymentId: row.provider_deployment_id,
          deploymentUrl: row.deployment_url,
          status: row.status,
          buildLogSummary: row.build_log_summary,
          publishedSnapshot: row.published_snapshot,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      }
    } catch {}
    return fileStorageDb.createDeployment(data);
  }

  async getDeployment(deploymentId: string, userId?: string): Promise<DeploymentRecord | null> {
    try {
      let query = this.client.from('deployments').select('*').eq('id', deploymentId);
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query.single();
      if (!error && data) {
        return {
          id: data.id,
          projectId: data.project_id,
          userId: data.user_id,
          projectVersionId: data.project_version_id,
          versionNumber: data.version_number,
          provider: data.provider,
          providerDeploymentId: data.provider_deployment_id,
          deploymentUrl: data.deployment_url,
          status: data.status,
          buildLogSummary: data.build_log_summary,
          publishedSnapshot: data.published_snapshot,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {}
    return fileStorageDb.getDeployment(deploymentId, userId);
  }

  async listDeployments(projectId: string, userId: string): Promise<DeploymentRecord[]> {
    try {
      const { data, error } = await this.client
        .from('deployments')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          projectId: row.project_id,
          userId: row.user_id,
          projectVersionId: row.project_version_id,
          versionNumber: row.version_number,
          provider: row.provider,
          providerDeploymentId: row.provider_deployment_id,
          deploymentUrl: row.deployment_url,
          status: row.status,
          buildLogSummary: row.build_log_summary,
          publishedSnapshot: row.published_snapshot,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      }
    } catch {}
    return fileStorageDb.listDeployments(projectId, userId);
  }

  async updateDeployment(
    deploymentId: string,
    updates: Partial<DeploymentRecord>
  ): Promise<DeploymentRecord> {
    try {
      const patch: any = { updated_at: new Date().toISOString() };
      if (updates.status) patch.status = updates.status;
      if (updates.deploymentUrl) patch.deployment_url = updates.deploymentUrl;
      if (updates.buildLogSummary) patch.build_log_summary = updates.buildLogSummary;
      const { data, error } = await this.client
        .from('deployments')
        .update(patch)
        .eq('id', deploymentId)
        .select('*')
        .single();
      if (!error && data) {
        return {
          id: data.id,
          projectId: data.project_id,
          userId: data.user_id,
          projectVersionId: data.project_version_id,
          versionNumber: data.version_number,
          provider: data.provider,
          providerDeploymentId: data.provider_deployment_id,
          deploymentUrl: data.deployment_url,
          status: data.status,
          buildLogSummary: data.build_log_summary,
          publishedSnapshot: data.published_snapshot,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {}
    return fileStorageDb.updateDeployment(deploymentId, updates);
  }

  async unpublishDeployment(deploymentId: string, userId: string): Promise<DeploymentRecord> {
    return fileStorageDb.unpublishDeployment(deploymentId, userId);
  }

  async getPublicDeployment(deploymentId: string): Promise<DeploymentRecord | null> {
    try {
      const { data, error } = await this.client
        .from('deployments')
        .select('*')
        .eq('id', deploymentId)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          projectId: data.project_id,
          userId: data.user_id,
          projectVersionId: data.project_version_id,
          versionNumber: data.version_number,
          provider: data.provider,
          providerDeploymentId: data.provider_deployment_id,
          deploymentUrl: data.deployment_url,
          status: data.status,
          buildLogSummary: data.build_log_summary,
          publishedSnapshot: data.published_snapshot,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch {}
    return fileStorageDb.getPublicDeployment(deploymentId);
  }

  // --- Phase 6: GitHub Integration ---
  async getGitHubConnection(userId: string): Promise<GitHubConnectionRecord | null> {
    return fileStorageDb.getGitHubConnection(userId);
  }

  async saveGitHubConnection(data: GitHubConnectionRecord): Promise<GitHubConnectionRecord> {
    return fileStorageDb.saveGitHubConnection(data);
  }

  async deleteGitHubConnection(userId: string): Promise<boolean> {
    return fileStorageDb.deleteGitHubConnection(userId);
  }

  async getProjectRepository(projectId: string, userId: string): Promise<ProjectRepositoryRecord | null> {
    return fileStorageDb.getProjectRepository(projectId, userId);
  }

  async saveProjectRepository(data: ProjectRepositoryRecord): Promise<ProjectRepositoryRecord> {
    return fileStorageDb.saveProjectRepository(data);
  }

  async deleteProjectRepository(projectId: string, userId: string): Promise<boolean> {
    return fileStorageDb.deleteProjectRepository(projectId, userId);
  }

  // --- Phase 6: Custom Domains ---
  async listProjectDomains(projectId: string, userId: string): Promise<CustomDomainRecord[]> {
    return fileStorageDb.listProjectDomains(projectId, userId);
  }

  async getDomain(domainId: string, userId: string): Promise<CustomDomainRecord | null> {
    return fileStorageDb.getDomain(domainId, userId);
  }

  async getDomainById(domainId: string): Promise<CustomDomainRecord | null> {
    return fileStorageDb.getDomainById(domainId);
  }

  async findDomainByName(domain: string): Promise<CustomDomainRecord | null> {
    return fileStorageDb.findDomainByName(domain);
  }

  async saveDomain(data: CustomDomainRecord): Promise<CustomDomainRecord> {
    return fileStorageDb.saveDomain(data);
  }

  async updateDomain(domainId: string, updates: Partial<CustomDomainRecord>): Promise<CustomDomainRecord> {
    return fileStorageDb.updateDomain(domainId, updates);
  }

  async deleteDomain(domainId: string, userId: string): Promise<boolean> {
    return fileStorageDb.deleteDomain(domainId, userId);
  }

  async setPrimaryDomain(projectId: string, domainId: string, userId: string): Promise<CustomDomainRecord[]> {
    return fileStorageDb.setPrimaryDomain(projectId, domainId, userId);
  }

  // --- Phase 7: Subscriptions, Usage Credits & Payments ---
  async getSubscription(userId: string): Promise<SubscriptionRecord | null> {
    return fileStorageDb.getSubscription(userId);
  }

  async saveSubscription(data: SubscriptionRecord): Promise<SubscriptionRecord> {
    return fileStorageDb.saveSubscription(data);
  }

  async updateSubscription(id: string, updates: Partial<SubscriptionRecord>): Promise<SubscriptionRecord> {
    return fileStorageDb.updateSubscription(id, updates);
  }

  async getCreditBalance(userId: string): Promise<number> {
    return fileStorageDb.getCreditBalance(userId);
  }

  async recordCreditTransaction(
    tx: Omit<CreditLedgerRecord, 'id' | 'createdAt' | 'balanceAfter'>
  ): Promise<CreditLedgerRecord> {
    return fileStorageDb.recordCreditTransaction(tx);
  }

  async listCreditTransactions(userId: string, limit?: number): Promise<CreditLedgerRecord[]> {
    return fileStorageDb.listCreditTransactions(userId, limit);
  }

  async hasOperationBeenCharged(operationId: string): Promise<boolean> {
    return fileStorageDb.hasOperationBeenCharged(operationId);
  }

  async recordPayment(data: PaymentRecord): Promise<PaymentRecord> {
    return fileStorageDb.recordPayment(data);
  }

  async listPayments(userId: string): Promise<PaymentRecord[]> {
    return fileStorageDb.listPayments(userId);
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    return fileStorageDb.getPayment(paymentId);
  }

  async recordAiUsage(data: AiUsageRecord): Promise<AiUsageRecord> {
    return fileStorageDb.recordAiUsage(data);
  }

  async listAiUsage(userId: string, limit?: number): Promise<AiUsageRecord[]> {
    return fileStorageDb.listAiUsage(userId, limit);
  }

  async isWebhookEventProcessed(provider: string, eventId: string): Promise<boolean> {
    return fileStorageDb.isWebhookEventProcessed(provider, eventId);
  }

  async recordWebhookEvent(event: WebhookEventRecord): Promise<void> {
    return fileStorageDb.recordWebhookEvent(event);
  }
}
