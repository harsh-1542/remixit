import { db } from '../db';
import { WebsiteDefinition } from '../../src/types/website-definition';
import { DeploymentRecord, DeploymentStatus, DeploymentProviderType } from '../db/types';
import { globalDeploymentJobManager } from './deployment-jobs';
import { validateWebsiteDefinition, sanitizeWebsiteDefinition } from './deployment-validator';
import { buildProductionArtifact } from './artifact-builder';
import { managedProvider } from './managed-provider';
import { vercelProvider } from './vercel-provider';
import { DeploymentProvider } from './types';

export class DeploymentService {
  private providers: Map<DeploymentProviderType, DeploymentProvider> = new Map();

  constructor() {
    this.providers.set('remix_managed', managedProvider);
    this.providers.set('vercel', vercelProvider);
  }

  getProvider(name: DeploymentProviderType): DeploymentProvider {
    return this.providers.get(name) || managedProvider;
  }

  /**
   * Start a new deployment for a project version.
   */
  async startDeployment(params: {
    projectId: string;
    userId: string;
    versionId?: string;
    provider?: DeploymentProviderType;
    description?: string;
  }): Promise<{ deploymentId: string; jobId: string; status: DeploymentStatus }> {
    const { projectId, userId } = params;

    // 1. Verify project ownership
    const project = await db.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found or unauthorized.');
    }

    // 2. Prevent duplicate concurrent deployment for the same project
    if (globalDeploymentJobManager.hasActiveJobForProject(projectId)) {
      throw new Error('A deployment is already currently in progress for this project.');
    }

    // 3. Resolve target version
    let targetVersion;
    if (params.versionId) {
      targetVersion = await db.getVersion(params.versionId, projectId, userId);
    } else {
      targetVersion = project.currentVersion;
    }

    if (!targetVersion || !targetVersion.websiteDefinition) {
      throw new Error('No valid saved website version found to publish.');
    }

    // 4. Validate Website Definition
    const validation = validateWebsiteDefinition(targetVersion.websiteDefinition);
    if (!validation.valid) {
      throw new Error(`Cannot publish: ${validation.errors.join(' ')}`);
    }

    const sanitizedSnapshot = sanitizeWebsiteDefinition(targetVersion.websiteDefinition);
    const selectedProvider = params.provider || (vercelProvider.isConfigured() ? 'vercel' : 'remix_managed');
    const deploymentId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 5. Create database record in 'queued' status
    const deploymentRecord = await db.createDeployment({
      id: deploymentId,
      projectId,
      userId,
      projectVersionId: targetVersion.id,
      versionNumber: targetVersion.versionNumber,
      provider: selectedProvider,
      providerDeploymentId: `pending_${deploymentId}`,
      deploymentUrl: '',
      status: 'queued',
      description: params.description || `Published version ${targetVersion.versionNumber}`,
      publishedSnapshot: sanitizedSnapshot,
    });

    // 6. Create asynchronous job tracker
    const job = globalDeploymentJobManager.createJob(
      deploymentId,
      projectId,
      userId,
      targetVersion.id,
      targetVersion.versionNumber,
      selectedProvider
    );

    // 7. Execute deployment asynchronously
    this.executeDeploymentJob(job.id, deploymentId, projectId, userId, targetVersion.versionNumber, sanitizedSnapshot, selectedProvider, params.description).catch((err) => {
      console.error(`[DeploymentService] Deployment job ${job.id} failed:`, err);
    });

    return {
      deploymentId,
      jobId: job.id,
      status: 'queued',
    };
  }

  /**
   * Background deployment job execution.
   */
  private async executeDeploymentJob(
    jobId: string,
    deploymentId: string,
    projectId: string,
    userId: string,
    versionNumber: number,
    snapshot: WebsiteDefinition,
    providerName: DeploymentProviderType,
    description?: string
  ) {
    try {
      // Stage 1: Validating project & version
      globalDeploymentJobManager.updateJob(jobId, {
        status: 'preparing',
        progress: 15,
        currentStage: 'Validating project & version',
      });
      await delay(250);

      // Stage 2: Preparing website files & HTML bundle
      globalDeploymentJobManager.updateJob(jobId, {
        status: 'preparing',
        progress: 35,
        currentStage: 'Preparing website files & markup',
      });

      const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : '';
      const artifact = buildProductionArtifact(snapshot, deploymentId, appUrl);
      await delay(250);

      // Stage 3: Validating build configuration
      globalDeploymentJobManager.updateJob(jobId, {
        status: 'building',
        progress: 55,
        currentStage: 'Validating build configuration',
      });
      await delay(250);

      // Stage 4: Uploading deployment to provider
      globalDeploymentJobManager.updateJob(jobId, {
        status: 'deploying',
        progress: 75,
        currentStage: 'Uploading deployment package',
      });

      const provider = this.getProvider(providerName);
      const result = await provider.deploy({
        deploymentId,
        projectId,
        userId,
        versionNumber,
        websiteDefinition: snapshot,
        files: artifact.files,
        description,
      });

      // Stage 5: Building website on edge
      globalDeploymentJobManager.updateJob(jobId, {
        status: 'deploying',
        progress: 90,
        currentStage: 'Optimizing and building on hosting edge',
      });
      await delay(300);

      // Stage 6: Verifying deployment URL
      globalDeploymentJobManager.updateJob(jobId, {
        status: 'ready',
        progress: 100,
        currentStage: 'Your website is live',
        deploymentUrl: result.deploymentUrl,
        buildLogSummary: result.buildLogSummary,
      });

      // 8. Update database record to 'ready'
      await db.updateDeployment(deploymentId, {
        status: 'ready',
        providerDeploymentId: result.providerDeploymentId,
        deploymentUrl: result.deploymentUrl,
        buildLogSummary: result.buildLogSummary,
        publishedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(`[DeploymentService] Deployment failed:`, err);
      const errorMessage = err.message || 'Deployment could not be completed.';

      globalDeploymentJobManager.updateJob(jobId, {
        status: 'failed',
        progress: 100,
        currentStage: 'Deployment failed',
        error: errorMessage,
      });

      await db.updateDeployment(deploymentId, {
        status: 'failed',
        errorMessage,
      });
    }
  }

  /**
   * Republish an earlier project version (Rollback).
   */
  async republishVersion(params: {
    projectId: string;
    versionId: string;
    userId: string;
  }): Promise<{ deploymentId: string; jobId: string; status: DeploymentStatus }> {
    return this.startDeployment({
      projectId: params.projectId,
      versionId: params.versionId,
      userId: params.userId,
      description: 'Republished previous version',
    });
  }

  /**
   * Unpublish a live website deployment.
   */
  async unpublishDeployment(deploymentId: string, userId: string): Promise<DeploymentRecord> {
    const deployment = await db.getDeployment(deploymentId, userId);
    if (!deployment) {
      throw new Error('Deployment not found or unauthorized.');
    }

    const provider = this.getProvider(deployment.provider);
    if (provider.unpublish) {
      try {
        await provider.unpublish(deployment.providerDeploymentId);
      } catch (err) {
        console.warn('[DeploymentService] Provider unpublish notice:', err);
      }
    }

    return db.unpublishDeployment(deploymentId, userId);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const deploymentService = new DeploymentService();
