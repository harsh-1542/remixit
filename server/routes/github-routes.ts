import { Router } from 'express';
import { requireAuth } from '../auth/auth-service';
import { githubService } from '../github/github-service';
import { db } from '../db';

export const githubRouter = Router();

// GET /api/github/status - Current user GitHub connection status
githubRouter.get('/status', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const connection = await githubService.getAccount(user.id);
    const isConfigured = githubService.isOAuthConfigured();

    if (!connection) {
      return res.json({
        connected: false,
        isConfigured,
      });
    }

    return res.json({
      connected: true,
      isConfigured,
      account: {
        username: connection.githubUsername,
        avatarUrl: connection.githubAvatarUrl,
        scopes: connection.scopes,
        connectedAt: connection.connectedAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/github/auth-url - Generate OAuth authorization URL
githubRouter.get('/auth-url', requireAuth, (req, res) => {
  try {
    const user = (req as any).user;
    const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
    const origin = req.headers.origin || (appUrl || `${req.protocol}://${req.get('host')}`);
    const redirectUri = appUrl ? `${appUrl}/api/github/callback` : `${origin}/api/github/callback`;

    // State payload encodes user id and random salt
    const state = Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString('base64');
    const { url, isConfigured } = githubService.getOAuthUrl(redirectUri, state);

    return res.json({ url, isConfigured, redirectUri });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/github/callback - OAuth redirect callback with postMessage
githubRouter.get('/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <body style="font-family: system-ui, sans-serif; padding: 24px; text-align: center;">
          <h2 style="color: #DC2626;">GitHub Connection Failed</h2>
          <p>${escapeHtml(String(error_description || error))}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_AUTH_ERROR', error: '${escapeHtml(String(error_description || error))}' }, '*');
              setTimeout(function() { window.close(); }, 2500);
            }
          </script>
        </body>
        </html>
      `);
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state parameter.');
    }

    let parsedState: any = {};
    try {
      parsedState = JSON.parse(Buffer.from(String(state), 'base64').toString('utf-8'));
    } catch {
      return res.status(400).send('Invalid state parameter.');
    }

    const userId = parsedState.userId;
    if (!userId) {
      return res.status(400).send('Invalid user reference in state.');
    }

    const appUrl = (process.env.APP_URL || '').replace(/\/+$/, '');
    const origin = `${req.protocol}://${req.get('host')}`;
    const redirectUri = appUrl ? `${appUrl}/api/github/callback` : `${origin}/api/github/callback`;

    const token = await githubService.exchangeCode(String(code), redirectUri);
    await githubService.connectAccountWithToken(userId, token);

    return res.send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: system-ui, sans-serif; padding: 32px; text-align: center; background: #FAFAF8; color: #18181B;">
        <div style="max-width: 400px; margin: 40px auto; padding: 24px; border: 1px solid #E4E4E7; border-radius: 16px; background: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #DCFCE7; color: #16A34A; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 20px;">✓</div>
          <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">GitHub Account Connected</h2>
          <p style="font-size: 13px; color: #71717A; margin: 0;">Closing window and returning to Remix...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS' }, '*');
            setTimeout(function() { window.close(); }, 800);
          } else {
            window.location.href = '/dashboard';
          }
        </script>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[GitHub Callback Error]:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: system-ui, sans-serif; padding: 24px; text-align: center;">
        <h2 style="color: #DC2626;">GitHub Authorization Failed</h2>
        <p>${escapeHtml(err.message || 'Error communicating with GitHub')}</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GITHUB_AUTH_ERROR', error: '${escapeHtml(err.message)}' }, '*');
            setTimeout(function() { window.close(); }, 2500);
          }
        </script>
      </body>
      </html>
    `);
  }
});

// POST /api/github/connect-token - Connect account with Personal Access Token (PAT)
githubRouter.post('/connect-token', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Please enter a GitHub personal access token.' });
    }

    const connection = await githubService.connectAccountWithToken(user.id, token);
    return res.json({
      success: true,
      account: {
        username: connection.githubUsername,
        avatarUrl: connection.githubAvatarUrl,
        scopes: connection.scopes,
        connectedAt: connection.connectedAt,
      },
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Invalid GitHub token.' });
  }
});

// POST /api/github/disconnect - Disconnect account
githubRouter.post('/disconnect', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    await githubService.disconnectAccount(user.id);
    return res.json({ success: true, message: 'GitHub account disconnected successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/github/repos - List user's repositories
githubRouter.get('/repos', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const repos = await githubService.listUserRepositories(user.id);
    return res.json({ repos });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/github/repos/create - Create repository
githubRouter.post('/repos/create', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, description, isPrivate } = req.body;

    const repo = await githubService.createRepository(user.id, {
      name,
      description,
      isPrivate,
    });

    return res.status(201).json({ repo });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/projects/:projectId/github - Get project repository info
githubRouter.get('/projects/:projectId/github', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    const project = await db.getProject(projectId, user.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });

    const repo = await db.getProjectRepository(projectId, user.id);
    const connection = await db.getGitHubConnection(user.id);

    return res.json({
      connected: !!repo,
      repository: repo || null,
      accountConnected: !!connection,
      githubUsername: connection?.githubUsername,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/github/connect - Connect repository to project
githubRouter.post('/projects/:projectId/github/connect', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const { repoOwner, repoName, defaultBranch } = req.body;

    if (!repoOwner || !repoName) {
      return res.status(400).json({ error: 'Repository owner and name are required.' });
    }

    const record = await githubService.connectProjectRepository(user.id, projectId, {
      repoOwner,
      repoName,
      defaultBranch,
    });

    return res.json({ success: true, repository: record });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/github/disconnect - Disconnect repository from project
githubRouter.post('/projects/:projectId/github/disconnect', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;

    await githubService.disconnectProjectRepository(user.id, projectId);
    return res.json({ success: true, message: 'Repository disconnected from project.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/projects/:projectId/github/push - Push project to GitHub
githubRouter.post('/projects/:projectId/github/push', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { projectId } = req.params;
    const { commitMessage } = req.body;

    const result = await githubService.pushProjectToGitHub(user.id, projectId, commitMessage);
    return res.json({
      ...result,
      message: `Successfully pushed ${result.filesCount} project files to GitHub branch "${result.branch}".`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Push to GitHub failed.' });
  }
});

function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}
