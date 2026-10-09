import { Router } from 'express';
import { requireAuth } from '../auth/auth-service';
import { db } from '../db';

export const savedWebsiteRouter = Router();

// GET /api/saved-websites - List saved websites
savedWebsiteRouter.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const saved = await db.listSavedWebsites(user.id);
    return res.json({ savedWebsites: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/saved-websites - Save/bookmark a website
savedWebsiteRouter.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { websiteId } = req.body;
    if (!websiteId) {
      return res.status(400).json({ error: 'websiteId is required.' });
    }

    const saved = await db.saveWebsite(user.id, websiteId);
    return res.status(201).json({ savedWebsite: saved });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE /api/saved-websites/:websiteId - Remove saved website
savedWebsiteRouter.delete('/:websiteId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { websiteId } = req.params;

    const removed = await db.removeSavedWebsite(user.id, websiteId);
    return res.json({ success: removed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/saved-websites/check/:websiteId - Check if saved
savedWebsiteRouter.get('/check/:websiteId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { websiteId } = req.params;

    const isSaved = await db.isWebsiteSaved(user.id, websiteId);
    return res.json({ isSaved });
  } catch (err: any) {
    return res.json({ isSaved: false });
  }
});
