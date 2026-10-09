import { Router } from 'express';
import { authService, requireAuth } from '../auth/auth-service';
import { db } from '../db';

export const authRouter = Router();

// POST /api/auth/signup
authRouter.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const session = await authService.signUp(email, password, displayName);
    return res.status(201).json(session);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Signup failed.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const session = await authService.signIn(email, password);
    return res.json(session);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Login failed.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-session-token'] as string);
    if (token) {
      await authService.signOut(token);
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const profile = await db.getProfile(user.id);
  return res.json({ user: profile || user });
});

// PATCH /api/auth/profile
authRouter.patch('/profile', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { displayName } = req.body;
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ error: 'Display name cannot be empty.' });
    }
    const updated = await db.updateProfile(user.id, { displayName: displayName.trim() });
    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
