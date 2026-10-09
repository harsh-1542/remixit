import { Router } from 'express';
import { requireAuth } from '../auth/auth-service';
import { domainService } from '../domains/domain-service';
import { db } from '../db';

export const domainRouter = Router();

// GET /api/projects/:projectId/domains - List all domains for a project
domainRouter.get('/projects/:projectId/domains', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    const domains = await domainService.listProjectDomains(user.id, projectId);
    return res.json({ domains });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/domains/check - Check domain syntax and availability
domainRouter.get('/domains/check', requireAuth, async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Please enter a domain name.' });
    }

    const validation = domainService.validateDomain(domain);
    if (!validation.valid) {
      return res.status(400).json({ valid: false, error: validation.error });
    }

    const existing = await db.findDomainByName(validation.normalized);
    if (existing) {
      return res.json({
        valid: true,
        available: false,
        normalized: validation.normalized,
        isApex: validation.isApex,
        error: 'This domain is already in use by another project.',
      });
    }

    return res.json({
      valid: true,
      available: true,
      normalized: validation.normalized,
      isApex: validation.isApex,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/domains - Add custom domain
domainRouter.post('/projects/:projectId/domains', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain name is required.' });
    }

    const record = await domainService.addDomain(user.id, projectId, domain);
    return res.status(201).json({ success: true, domain: record });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/domains/:domainId/verify - Verify DNS configuration
domainRouter.post('/projects/:projectId/domains/:domainId/verify', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { domainId } = req.params;

    const updated = await domainService.verifyDomain(user.id, domainId);
    return res.json({
      success: true,
      domain: updated,
      message:
        updated.verificationStatus === 'active'
          ? 'Domain verified successfully and SSL is active!'
          : updated.errorMessage || 'DNS records are still propagating.',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/domains/:domainId/primary - Set as primary domain
domainRouter.post('/projects/:projectId/domains/:domainId/primary', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId, domainId } = req.params;

    const domains = await domainService.setPrimaryDomain(user.id, projectId, domainId);
    return res.json({ success: true, domains });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/projects/:projectId/domains/:domainId - Remove custom domain
domainRouter.delete('/projects/:projectId/domains/:domainId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { domainId } = req.params;

    const success = await domainService.removeDomain(user.id, domainId);
    if (!success) {
      return res.status(404).json({ error: 'Domain not found or unauthorized.' });
    }

    return res.json({ success: true, message: 'Custom domain removed successfully.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
