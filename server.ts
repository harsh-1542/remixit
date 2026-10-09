import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { startWebsiteAnalysis } from './server/analysis/analyzer';
import { globalJobManager } from './server/jobs/job-manager';
import {
  startWebsiteGeneration,
  editWebsiteGeneration,
} from './server/generation/generation-service';
import { globalGenerationManager } from './server/generation/generation-job-manager';
import { generateProjectZip } from './server/generation/export-service';
import { authRouter } from './server/routes/auth-routes';
import { projectRouter } from './server/routes/project-routes';
import { savedWebsiteRouter } from './server/routes/saved-website-routes';
import { deploymentRouter } from './server/routes/deployment-routes';
import { githubRouter } from './server/routes/github-routes';
import { domainRouter } from './server/routes/domain-routes';
import { optionalAuth } from './server/auth/auth-service';
import fs from 'fs';
import { db } from './server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  // 1. Start Analysis: POST /api/analyze
  app.post('/api/analyze', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Please enter a website URL.' });
      }

      const result = await startWebsiteAnalysis(url);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Analysis initiation failed.' });
    }
  });

  // 2. Get Analysis Status: GET /api/analyze/:jobId
  app.get('/api/analyze/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = globalJobManager.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Analysis job not found.' });
    }

    return res.json({
      jobId: job.id,
      url: job.url,
      status: job.status,
      progress: job.progress,
      currentStage: job.currentStage,
      error: job.error,
    });
  });

  // 3. Get Analysis Result: GET /api/analyze/:jobId/result
  app.get('/api/analyze/:jobId/result', (req, res) => {
    const { jobId } = req.params;
    const job = globalJobManager.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Analysis job not found.' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({
        error: `Job is not completed yet (current status: ${job.status}).`,
        status: job.status,
      });
    }

    return res.json({
      jobId: job.id,
      url: job.url,
      status: job.status,
      designSpec: job.designSpec,
      desktopScreenshot: job.desktopScreenshot,
      mobileScreenshot: job.mobileScreenshot,
      metadata: job.metadata,
    });
  });

  // -------------------------------------------------------------
  // Phase 4 Authentication, Projects & Bookmarks API Endpoints
  // -------------------------------------------------------------
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/saved-websites', savedWebsiteRouter);

  // -------------------------------------------------------------
  // Phase 5 Deployment, Publishing & Public Site Routes
  // -------------------------------------------------------------
  app.use('/api', deploymentRouter);

  // -------------------------------------------------------------
  // Phase 6 GitHub Integration & Custom Domains Routes
  // -------------------------------------------------------------
  app.use('/api/github', githubRouter);
  app.use('/api', githubRouter); // mounts /api/projects/:projectId/github endpoints
  app.use('/api', domainRouter);

  // Serve static assets inside deployment directory if any
  app.use('/sites/:deploymentId', (req, res, next) => {
    const { deploymentId } = req.params;
    const dir = path.resolve(process.cwd(), 'data', 'deployments', deploymentId);
    if (fs.existsSync(dir)) {
      return express.static(dir)(req, res, next);
    }
    next();
  });

  // Standalone HTML website endpoint for published sites
  app.get(['/sites/:deploymentId', '/sites/:deploymentId/raw', '/sites/:deploymentId/index.html'], (req, res) => {
    const { deploymentId } = req.params;
    const filePath = path.resolve(process.cwd(), 'data', 'deployments', deploymentId, 'index.html');
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(filePath);
    }
    return res.status(404).send('Published website not found or has been unpublished.');
  });

  // Custom Domain Live Preview & Verification Endpoint
  app.get('/domains/:domainId/preview', async (req, res) => {
    try {
      const { domainId } = req.params;
      const domain = await db.getDomainById(domainId);
      if (!domain) {
        return res.status(404).send('Custom domain not found.');
      }
      const project = await db.getProjectById(domain.projectId);
      const deploymentId = domain.deploymentId || project?.currentDeploymentId;
      if (!deploymentId) {
        return res.status(400).send(`Domain "${domain.domain}" is configured, but the project has not been published yet. Please publish the project to activate this domain.`);
      }
      const filePath = path.resolve(process.cwd(), 'data', 'deployments', deploymentId, 'index.html');
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Published website deployment bundle was not found.');
      }
      const htmlContent = fs.readFileSync(filePath, 'utf-8');
      const bannerHtml = `
        <div style="position: sticky; top: 0; left: 0; right: 0; z-index: 999999; background: #18181B; color: #FAFAF8; padding: 10px 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; font-size: 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span>
            <strong>Live Custom Domain Preview:</strong>
            <span style="color: #60A5FA; font-weight: 600;">https://${domain.domain}</span>
            <span style="opacity: 0.65; font-size: 11px;">(${domain.isApex ? 'Apex root' : 'Subdomain'} · SSL: ${domain.sslStatus.toUpperCase()})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <span style="opacity: 0.75; font-size: 11px;">Project: ${project?.name || 'Remix Website'}</span>
            <a href="/editor/${project?.id}" style="color: #FAFAF8; text-decoration: underline; font-weight: 600;">Back to Editor</a>
          </div>
        </div>
      `;
      const injectedHtml = htmlContent.replace(/<body([^>]*)>/i, `<body$1>${bannerHtml}`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(injectedHtml);
    } catch (err: any) {
      return res.status(500).send('Error serving custom domain preview: ' + err.message);
    }
  });

  // Custom Domain Host Routing Middleware
  app.use(async (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/sites') ||
      req.path.startsWith('/domains') ||
      req.path.startsWith('/@') ||
      req.path.startsWith('/src') ||
      req.path.startsWith('/node_modules')
    ) {
      return next();
    }

    const hostHeader = (req.headers['x-custom-domain'] as string) || req.headers.host || '';
    const cleanHost = hostHeader.split(':')[0].toLowerCase();

    if (!cleanHost || cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === '0.0.0.0') {
      return next();
    }

    try {
      const customDomain = await db.findDomainByName(cleanHost);
      if (customDomain) {
        const project = await db.getProjectById(customDomain.projectId);
        const deploymentId = customDomain.deploymentId || project?.currentDeploymentId;
        if (deploymentId) {
          const deployDir = path.resolve(process.cwd(), 'data', 'deployments', deploymentId);
          const reqSubpath = req.path === '/' ? 'index.html' : req.path.replace(/^\//, '');
          const assetFile = path.resolve(deployDir, reqSubpath);
          if (fs.existsSync(assetFile) && fs.statSync(assetFile).isFile()) {
            return res.sendFile(assetFile);
          }
          const indexFile = path.resolve(deployDir, 'index.html');
          if (fs.existsSync(indexFile)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.sendFile(indexFile);
          }
        }
      }
    } catch (err) {
      console.error('[Custom Domain Host Routing Error]:', err);
    }

    next();
  });

  // -------------------------------------------------------------
  // Phase 3 Generation API Endpoints
  // -------------------------------------------------------------

  // 4. Start Website Generation: POST /api/generate
  app.post('/api/generate', optionalAuth, async (req, res) => {
    try {
      const { config, referenceJobId } = req.body;
      if (!config || !config.name) {
        return res.status(400).json({ error: 'Please provide website configuration.' });
      }

      const userId = (req as any).user?.id;
      const result = await startWebsiteGeneration(config, referenceJobId, userId);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Generation failed.' });
    }
  });

  // 5. Get Generation Status: GET /api/generate/:jobId
  app.get('/api/generate/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = globalGenerationManager.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Generation job not found.' });
    }

    return res.json({
      jobId: job.id,
      projectId: job.projectId,
      status: job.status,
      progress: job.progress,
      currentStage: job.currentStage,
      error: job.error,
    });
  });

  // 6. Get Generation Result: GET /api/generate/:jobId/result
  app.get('/api/generate/:jobId/result', optionalAuth, async (req, res) => {
    const { jobId } = req.params;
    const userId = (req as any).user?.id;

    // First check memory manager
    const memJob = globalGenerationManager.getJob(jobId);
    if (memJob && memJob.status === 'completed' && memJob.websiteDefinition) {
      return res.json({
        jobId: memJob.id,
        projectId: memJob.projectId,
        status: memJob.status,
        websiteDefinition: memJob.websiteDefinition,
        version: memJob.version,
      });
    }

    // Next check persistent database (if reopening an existing project)
    if (userId) {
      const dbProject = await db.getProject(jobId, userId);
      if (dbProject?.currentVersion?.websiteDefinition) {
        return res.json({
          jobId: dbProject.id,
          projectId: dbProject.id,
          status: 'completed',
          websiteDefinition: dbProject.currentVersion.websiteDefinition,
          version: dbProject.currentVersion.versionNumber,
        });
      }
    } else {
      // Try guest user if unauthenticated
      const guestProject = await db.getProject(jobId, 'usr_guest');
      if (guestProject?.currentVersion?.websiteDefinition) {
        return res.json({
          jobId: guestProject.id,
          projectId: guestProject.id,
          status: 'completed',
          websiteDefinition: guestProject.currentVersion.websiteDefinition,
          version: guestProject.currentVersion.versionNumber,
        });
      }
    }

    if (memJob) {
      return res.status(400).json({
        error: `Job is not ready yet (current status: ${memJob.status}).`,
        status: memJob.status,
      });
    }

    return res.status(404).json({ error: 'Project or generation job not found.' });
  });

  // 7. Natural Language Edit: POST /api/generate/:projectId/edit
  app.post('/api/generate/:projectId/edit', optionalAuth, async (req, res) => {
    try {
      const { projectId } = req.params;
      const { instruction } = req.body;
      const userId = (req as any).user?.id;

      if (!instruction || !instruction.trim()) {
        return res.status(400).json({ error: 'Please enter an edit instruction.' });
      }

      const updated = await editWebsiteGeneration(projectId, instruction, userId);
      const project = globalGenerationManager.getProject(projectId);

      return res.json({
        status: 'completed',
        websiteDefinition: updated,
        version: project?.version || 1,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Edit failed.' });
    }
  });

  // 8. Undo Version: POST /api/generate/:projectId/undo
  app.post('/api/generate/:projectId/undo', (req, res) => {
    const { projectId } = req.params;
    const undone = globalGenerationManager.undoVersion(projectId);

    if (!undone || !undone.websiteDefinition) {
      return res.status(400).json({ error: 'No previous version available to undo.' });
    }

    return res.json({
      status: 'completed',
      websiteDefinition: undone.websiteDefinition,
      version: undone.version,
    });
  });

  // 9. Download Standalone Code ZIP: GET /api/generate/:projectId/export
  app.get('/api/generate/:projectId/export', async (req, res) => {
    try {
      const { projectId } = req.params;
      const job = globalGenerationManager.getProject(projectId);

      if (!job || !job.websiteDefinition) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      const zipBuffer = await generateProjectZip(job.websiteDefinition);
      const safeName = job.websiteDefinition.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="remix-${safeName}-site.zip"`);
      return res.send(zipBuffer);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'ZIP export failed.' });
    }
  });

  // Vite middleware in dev or static files in prod
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Remix] Server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('[Remix] Server failed to start:', err);
  process.exit(1);
});
