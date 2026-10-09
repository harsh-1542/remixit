import { Router } from 'express';
import { requireAuth, optionalAuth } from '../auth/auth-service';
import { db } from '../db';
import { deploymentService } from '../deployment/deployment-service';
import { globalDeploymentJobManager } from '../deployment/deployment-jobs';

export const deploymentRouter = Router();

// POST /api/projects/:projectId/deployments - Create a new deployment
deploymentRouter.post('/projects/:projectId/deployments', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const { versionId, provider, description } = req.body;

    const result = await deploymentService.startDeployment({
      projectId,
      userId: user.id,
      versionId,
      provider,
      description,
    });

    return res.status(202).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Deployment initiation failed.' });
  }
});

// GET /api/deployments/:deploymentId - Get deployment details
deploymentRouter.get('/deployments/:deploymentId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { deploymentId } = req.params;

    const deployment = await db.getDeployment(deploymentId, user.id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found or unauthorized.' });
    }

    return res.json({ deployment });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/deployments/:deploymentId/status - Poll deployment status
deploymentRouter.get('/deployments/:deploymentId/status', optionalAuth, async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const job = globalDeploymentJobManager.getJobByDeploymentId(deploymentId);

    if (job) {
      return res.json({
        jobId: job.id,
        deploymentId: job.deploymentId,
        projectId: job.projectId,
        status: job.status,
        progress: job.progress,
        currentStage: job.currentStage,
        deploymentUrl: job.deploymentUrl,
        error: job.error,
        buildLogSummary: job.buildLogSummary,
      });
    }

    // If job finished and cleared from memory, check database
    const deployment = await db.getPublicDeployment(deploymentId);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found.' });
    }

    return res.json({
      deploymentId: deployment.id,
      projectId: deployment.projectId,
      status: deployment.status,
      progress: deployment.status === 'ready' ? 100 : 0,
      currentStage: deployment.status === 'ready' ? 'Your website is live' : deployment.status,
      deploymentUrl: deployment.deploymentUrl,
      error: deployment.errorMessage,
      buildLogSummary: deployment.buildLogSummary,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId/deployments - List project deployment history
deploymentRouter.get('/projects/:projectId/deployments', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    // Verify project ownership
    const project = await db.getProject(projectId, user.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    const deployments = await db.listDeployments(projectId, user.id);
    return res.json({ deployments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/deployments/republish - Republish earlier version
deploymentRouter.post(
  '/projects/:projectId/deployments/republish',
  requireAuth,
  async (req, res) => {
    try {
      const user = (req as any).user;
      const { projectId } = req.params;
      const { versionId } = req.body;

      if (!versionId) {
        return res.status(400).json({ error: 'versionId is required.' });
      }

      const result = await deploymentService.republishVersion({
        projectId,
        versionId,
        userId: user.id,
      });

      return res.status(202).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Republish failed.' });
    }
  }
);

// POST /api/deployments/:deploymentId/unpublish - Unpublish deployment
deploymentRouter.post('/deployments/:deploymentId/unpublish', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { deploymentId } = req.params;

    const unpublished = await deploymentService.unpublishDeployment(deploymentId, user.id);
    return res.json({
      success: true,
      deployment: unpublished,
      message: 'Website unpublished successfully.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to unpublish.' });
  }
});

// GET /api/public/site/:deploymentId - Public unauthenticated read-only website snapshot
deploymentRouter.get('/public/site/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = await db.getPublicDeployment(deploymentId);

    if (!deployment || deployment.status !== 'ready') {
      return res.status(404).json({
        error: 'This website is not published or has been unpublished by the author.',
      });
    }

    return res.json({
      deploymentId: deployment.id,
      projectId: deployment.projectId,
      versionNumber: deployment.versionNumber,
      publishedAt: deployment.publishedAt,
      websiteDefinition: deployment.publishedSnapshot,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
