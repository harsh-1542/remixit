import { DeploymentJob } from './types';
import { DeploymentStatus, DeploymentProviderType } from '../db/types';

export class DeploymentJobManager {
  private jobs: Map<string, DeploymentJob> = new Map();

  createJob(
    deploymentId: string,
    projectId: string,
    userId: string,
    versionId: string,
    versionNumber: number,
    provider: DeploymentProviderType
  ): DeploymentJob {
    const jobId = `djob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    const job: DeploymentJob = {
      id: jobId,
      deploymentId,
      projectId,
      userId,
      versionId,
      versionNumber,
      provider,
      status: 'queued',
      progress: 5,
      currentStage: 'Validating project & version',
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(jobId, job);
    return { ...job };
  }

  getJob(jobId: string): DeploymentJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  getJobByDeploymentId(deploymentId: string): DeploymentJob | undefined {
    for (const job of this.jobs.values()) {
      if (job.deploymentId === deploymentId) {
        return { ...job };
      }
    }
    return undefined;
  }

  updateJob(jobId: string, updates: Partial<DeploymentJob>): DeploymentJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const updated: DeploymentJob = {
      ...job,
      ...updates,
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, updated);
    return { ...updated };
  }

  // Check if project has an in-flight deployment to avoid accidental duplicate submissions
  hasActiveJobForProject(projectId: string): boolean {
    for (const job of this.jobs.values()) {
      if (
        job.projectId === projectId &&
        ['queued', 'preparing', 'building', 'deploying'].includes(job.status)
      ) {
        // Expire jobs older than 5 minutes
        if (Date.now() - job.updatedAt < 5 * 60 * 1000) {
          return true;
        }
      }
    }
    return false;
  }
}

export const globalDeploymentJobManager = new DeploymentJobManager();
