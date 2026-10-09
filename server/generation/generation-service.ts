import { globalJobManager } from '../jobs/job-manager';
import { globalGenerationManager } from './generation-job-manager';
import { getGenerationProvider } from '../ai/generation-factory';
import { UserGenerationConfig, WebsiteDefinition } from '../../src/types/website-definition';
import { DesignSpecification } from '../types';
import { db } from '../db';

export async function startWebsiteGeneration(
  config: UserGenerationConfig,
  referenceJobId?: string,
  userId?: string
): Promise<{ jobId: string; projectId: string; status: string }> {
  if (!config.name || !config.name.trim()) {
    throw new Error('Please provide a website or product name.');
  }

  // 1. Resolve DesignSpecification
  let spec: DesignSpecification;
  if (referenceJobId) {
    const analysisJob = globalJobManager.getJob(referenceJobId);
    if (analysisJob && analysisJob.designSpec) {
      spec = analysisJob.designSpec;
    } else {
      spec = createDefaultSpecification(config);
    }
  } else {
    spec = createDefaultSpecification(config);
  }

  // 2. Create Generation Job
  const job = globalGenerationManager.createJob(config, referenceJobId);

  // 3. Process generation in background
  processGenerationJob(job.id, spec, config, userId).catch((err) => {
    console.error(`[GenerationService] Job ${job.id} failed:`, err);
  });

  return { jobId: job.id, projectId: job.projectId, status: job.status };
}

async function processGenerationJob(
  jobId: string,
  spec: DesignSpecification,
  config: UserGenerationConfig,
  userId?: string
) {
  try {
    // Stage 1: Preparing design specification
    globalGenerationManager.updateJob(jobId, {
      status: 'preparing-spec',
      progress: 20,
      currentStage: 'Preparing design specification',
    });
    await delay(250);

    // Stage 2: Planning page structure
    globalGenerationManager.updateJob(jobId, {
      status: 'planning-structure',
      progress: 40,
      currentStage: 'Planning page structure',
    });
    await delay(300);

    // Stage 3: Generating website sections
    globalGenerationManager.updateJob(jobId, {
      status: 'generating-sections',
      progress: 65,
      currentStage: 'Generating website sections',
    });

    const provider = getGenerationProvider();
    const websiteDef = await provider.generateWebsite(spec, config);

    // Stage 4: Validating components
    globalGenerationManager.updateJob(jobId, {
      status: 'validating-components',
      progress: 85,
      currentStage: 'Validating components',
    });
    await delay(250);

    // Stage 5: Rendering preview
    globalGenerationManager.updateJob(jobId, {
      status: 'rendering-preview',
      progress: 95,
      currentStage: 'Rendering preview',
    });
    await delay(250);

    // Stage 6: Completed
    const job = globalGenerationManager.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      currentStage: 'Preparing the editor',
      websiteDefinition: websiteDef,
    });

    // 7. Persist to Database if user is authenticated or guest
    const targetUserId = userId || 'usr_guest';
    try {
      await db.createProject(
        {
          id: job?.projectId,
          userId: targetUserId,
          name: config.name,
          description: config.description,
          status: 'active',
          referenceUrl: spec.site?.normalizedUrl,
          referenceAnalysisId: job?.referenceJobId,
        },
        { definition: websiteDef, config }
      );
    } catch (dbErr) {
      console.warn('[GenerationService] Non-fatal: DB project creation note:', dbErr);
    }
  } catch (err: any) {
    globalGenerationManager.updateJob(jobId, {
      status: 'failed',
      progress: 100,
      currentStage: 'Generation failed',
      error: err.message || 'Website generation encountered an error. Please try again.',
    });
  }
}

export async function editWebsiteGeneration(
  projectId: string,
  instruction: string,
  userId?: string
): Promise<WebsiteDefinition> {
  let currentDef: WebsiteDefinition | null = null;

  // 1. Check database first if userId exists
  if (userId) {
    const project = await db.getProject(projectId, userId);
    if (project?.currentVersion?.websiteDefinition) {
      currentDef = project.currentVersion.websiteDefinition;
    }
  }

  // 2. Check memory manager
  if (!currentDef) {
    const memJob = globalGenerationManager.getProject(projectId);
    if (memJob?.websiteDefinition) {
      currentDef = memJob.websiteDefinition;
    }
  }

  if (!currentDef) {
    throw new Error('Project not found or not ready for editing.');
  }

  const provider = getGenerationProvider();
  const updatedDef = await provider.editWebsite(currentDef, instruction);

  // Update memory manager
  globalGenerationManager.saveVersion(projectId, updatedDef);

  // Update database version if project exists in db
  if (userId) {
    try {
      await db.createVersion(projectId, userId, updatedDef, instruction);
    } catch (dbErr) {
      console.warn('[GenerationService] DB version creation note:', dbErr);
    }
  }

  return updatedDef;
}

function createDefaultSpecification(config: UserGenerationConfig): DesignSpecification {
  const isDark = config.colorPreference === 'dark';
  return {
    site: {
      title: config.name,
      description: config.description,
      category: config.industry,
      normalizedUrl: 'https://reference.remix.design',
    },
    visualStyle: {
      primaryStyle: 'Modern SaaS',
      secondaryStyles: ['Swiss Grid', 'Modular Bento'],
      theme: isDark ? 'dark' : 'light',
      vibeDescription: 'Refined architectural clarity with generous negative space.',
    },
    colors: {
      primary: [isDark ? '#FFFFFF' : '#09090B'],
      backgrounds: [isDark ? '#09090B' : '#FAFAF8'],
      text: [isDark ? '#F4F4F5' : '#09090B'],
      accents: [isDark ? '#22C55E' : '#3B82F6'],
    },
    typography: {
      headingStyle: 'Geometric Neo-Grotesque',
      bodyStyle: 'Humanist Sans-Serif',
      hierarchy: 'Dramatic scale',
      alignment: 'Left aligned',
    },
    layout: {
      maxWidth: '1440px',
      grid: '12-column modular grid',
      spacing: '80px to 120px',
      alignment: 'Left aligned spine',
    },
    sections: [
      { type: 'navigation', order: 1, layout: 'Sticky top bar', description: 'Global header' },
      { type: 'hero', order: 2, layout: 'Asymmetric split', description: 'Primary value proposition' },
      { type: 'feature_grid', order: 3, layout: '3-column cards', description: 'Capabilities' },
      { type: 'pricing', order: 4, layout: '3-tier comparative', description: 'Pricing plans' },
      { type: 'cta', order: 5, layout: 'Full-bleed banner', description: 'Conversion prompt' },
      { type: 'footer', order: 6, layout: 'Multi-column index', description: 'Footer' },
    ],
    components: ['Navbar', 'Hero', 'Cards', 'Pricing', 'CTA', 'Footer'],
    features: ['Responsive layout', 'Micro-interactions', 'Structured spacing'],
    imagery: { style: 'Clean UI mockups', usage: 'Product focus' },
    responsive: { desktop: '1440px 12-column', mobile: 'Single-column stack' },
    animation: { present: true, characteristics: ['Subtle hover transitions'] },
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
