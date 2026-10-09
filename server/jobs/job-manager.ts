import { AnalysisJob, AnalysisStatus, DesignSpecification } from '../types';

export class JobManager {
  private jobs = new Map<string, AnalysisJob>();
  private urlCache = new Map<string, string>(); // normalizedUrl -> jobId

  createJob(url: string, normalizedUrl: string): AnalysisJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const job: AnalysisJob = {
      id,
      url,
      normalizedUrl,
      status: 'queued',
      progress: 10,
      currentStage: 'Connecting to website',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): AnalysisJob | undefined {
    return this.jobs.get(id);
  }

  getCachedJobId(normalizedUrl: string): string | undefined {
    const cachedId = this.urlCache.get(normalizedUrl);
    if (!cachedId) return undefined;
    const job = this.jobs.get(cachedId);
    if (job && job.status === 'completed') {
      return cachedId;
    }
    return undefined;
  }

  updateJob(
    id: string,
    updates: Partial<AnalysisJob>
  ): AnalysisJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: Date.now(),
    };

    this.jobs.set(id, updatedJob);

    if (updatedJob.status === 'completed') {
      this.urlCache.set(updatedJob.normalizedUrl, id);
    }

    return updatedJob;
  }
}

export const globalJobManager = new JobManager();
