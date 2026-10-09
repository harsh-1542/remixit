import {
  GenerationJob,
  GenerationStatus,
  UserGenerationConfig,
  WebsiteDefinition,
} from '../../src/types/website-definition';

export class GenerationJobManager {
  private jobs = new Map<string, GenerationJob>();
  private projects = new Map<string, GenerationJob>(); // projectId -> latest job

  createJob(
    config: UserGenerationConfig,
    referenceJobId?: string
  ): GenerationJob {
    const id = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const job: GenerationJob = {
      id,
      projectId,
      referenceJobId,
      status: 'queued',
      progress: 10,
      currentStage: 'Preparing design specification',
      config,
      version: 1,
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(id, job);
    this.projects.set(projectId, job);
    return job;
  }

  getJob(id: string): GenerationJob | undefined {
    return this.jobs.get(id) || this.projects.get(id);
  }

  getProject(projectId: string): GenerationJob | undefined {
    return this.projects.get(projectId);
  }

  updateJob(
    id: string,
    updates: Partial<GenerationJob>
  ): GenerationJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob: GenerationJob = {
      ...job,
      ...updates,
      updatedAt: Date.now(),
    };

    this.jobs.set(id, updatedJob);
    this.projects.set(updatedJob.projectId, updatedJob);
    return updatedJob;
  }

  saveVersion(projectId: string, newDef: WebsiteDefinition): GenerationJob | undefined {
    const job = this.projects.get(projectId);
    if (!job) return undefined;

    const history = job.history ? [...job.history] : [];
    if (job.websiteDefinition) {
      history.push(JSON.parse(JSON.stringify(job.websiteDefinition)));
    }

    const updatedJob: GenerationJob = {
      ...job,
      websiteDefinition: newDef,
      version: job.version + 1,
      history,
      updatedAt: Date.now(),
    };

    this.jobs.set(job.id, updatedJob);
    this.projects.set(projectId, updatedJob);
    return updatedJob;
  }

  undoVersion(projectId: string): GenerationJob | undefined {
    const job = this.projects.get(projectId);
    if (!job || !job.history || job.history.length === 0) return undefined;

    const previousDef = job.history.pop()!;
    const updatedJob: GenerationJob = {
      ...job,
      websiteDefinition: previousDef,
      version: Math.max(1, job.version - 1),
      updatedAt: Date.now(),
    };

    this.jobs.set(job.id, updatedJob);
    this.projects.set(projectId, updatedJob);
    return updatedJob;
  }
}

export const globalGenerationManager = new GenerationJobManager();
