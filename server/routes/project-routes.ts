import { Router } from 'express';
import { requireAuth } from '../auth/auth-service';
import { entitlementService } from '../billing/entitlement-service';
import { db } from '../db';

export const projectRouter = Router();

// GET /api/projects - List user's projects
projectRouter.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { search, sortBy } = req.query;

    const projects = await db.listProjects(user.id, {
      search: search as string,
      sortBy: sortBy as any,
    });

    return res.json({ projects });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list projects.' });
  }
});

// POST /api/projects - Create a new project
projectRouter.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, description, referenceUrl, referenceAnalysisId, websiteDefinition, config } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    // Check project capacity entitlement
    const summary = await entitlementService.getUserEntitlements(user.id);
    if (summary.usage.activeProjectsCount >= summary.usage.maxProjects) {
      return res.status(403).json({
        error: `Active project limit reached (${summary.usage.activeProjectsCount}/${summary.usage.maxProjects} projects). Upgrade to Pro or Business to create more projects, or archive an existing project.`,
        limitReached: 'max_projects',
      });
    }

    const project = await db.createProject(
      {
        userId: user.id,
        name: name.trim(),
        description: description || '',
        status: 'active',
        referenceUrl,
        referenceAnalysisId,
      },
      websiteDefinition ? { definition: websiteDefinition, config } : undefined
    );

    return res.status(201).json({ project });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create project.' });
  }
});

// GET /api/projects/:projectId - Get single project with ownership check
projectRouter.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    const project = await db.getProject(projectId, user.id);
    if (!project) {
      return res.status(404).json({ error: 'This project could not be found or you do not have access to it.' });
    }

    return res.json({ project });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:projectId - Update project (rename, description, status)
projectRouter.patch('/:projectId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const { name, description, status } = req.body;

    const updates: any = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Project name cannot be empty.' });
      updates.name = name.trim();
    }
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    const project = await db.updateProject(projectId, user.id, updates);
    return res.json({ project });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update project.' });
  }
});

// DELETE /api/projects/:projectId - Delete project
projectRouter.delete('/:projectId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    const success = await db.deleteProject(projectId, user.id);
    if (!success) {
      return res.status(404).json({ error: 'This project could not be found or you do not have access to it.' });
    }

    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'We could not delete this project. Please try again.' });
  }
});

// POST /api/projects/:projectId/duplicate - Duplicate project
projectRouter.post('/:projectId/duplicate', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    const summary = await entitlementService.getUserEntitlements(user.id);
    if (summary.usage.activeProjectsCount >= summary.usage.maxProjects) {
      return res.status(403).json({
        error: `Active project limit reached (${summary.usage.activeProjectsCount}/${summary.usage.maxProjects} projects). Upgrade to Pro or Business to duplicate or create more projects.`,
        limitReached: 'max_projects',
      });
    }

    const duplicated = await db.duplicateProject(projectId, user.id);
    return res.status(201).json({ project: duplicated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to duplicate project.' });
  }
});

// GET /api/projects/:projectId/versions - List project versions
projectRouter.get('/:projectId/versions', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    const versions = await db.listVersions(projectId, user.id);
    return res.json({ versions });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to load versions.' });
  }
});

// POST /api/projects/:projectId/restore/:versionId - Restore older version
projectRouter.post('/:projectId/restore/:versionId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId, versionId } = req.params;

    const updatedProject = await db.restoreVersion(projectId, versionId, user.id);
    return res.json({
      success: true,
      project: updatedProject,
      message: 'Version restored successfully.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to restore version.' });
  }
});
