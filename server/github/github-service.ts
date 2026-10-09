import { db } from '../db';
import { GitHubConnectionRecord, ProjectRepositoryRecord } from '../db/types';
import { generateProjectFileMap } from '../generation/export-service';

export interface GitHubRepoItem {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  htmlUrl: string;
  defaultBranch: string;
  description: string | null;
  updatedAt: string;
}

export class GitHubService {
  private clientId: string | undefined;
  private clientSecret: string | undefined;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
  }

  isOAuthConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.clientId.trim() !== '' && this.clientSecret.trim() !== '');
  }

  getOAuthUrl(redirectUri: string, state: string): { url: string; isConfigured: boolean } {
    if (!this.clientId) {
      return {
        url: '',
        isConfigured: false,
      };
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'repo,read:user',
      state,
      allow_signup: 'true',
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      isConfigured: true,
    };
  }

  async exchangeCode(code: string, redirectUri: string): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth is not configured on the server. Please provide GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
    }

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error_description || data.error || 'Failed to exchange GitHub authorization code.');
    }

    if (!data.access_token) {
      throw new Error('No access token returned by GitHub.');
    }

    return data.access_token;
  }

  async fetchGitHubUser(accessToken: string): Promise<{
    id: string;
    login: string;
    name: string;
    avatar_url: string;
  }> {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Remix-Design-Engine',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Invalid or expired GitHub access token.');
      }
      if (res.status === 403) {
        throw new Error('GitHub API rate limit exceeded or access forbidden.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch GitHub profile.');
    }

    const data = await res.json();
    return {
      id: String(data.id),
      login: data.login,
      name: data.name || data.login,
      avatar_url: data.avatar_url || '',
    };
  }

  async connectAccountWithToken(
    userId: string,
    token: string,
    scopes: string[] = ['repo', 'read:user']
  ): Promise<GitHubConnectionRecord> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('Please provide a valid GitHub token.');
    }

    const userProfile = await this.fetchGitHubUser(cleanToken);

    const record: GitHubConnectionRecord = {
      id: `gh_conn_${userId}`,
      userId,
      githubUserId: userProfile.id,
      githubUsername: userProfile.login,
      githubAvatarUrl: userProfile.avatar_url,
      accessToken: cleanToken,
      scopes,
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return db.saveGitHubConnection(record);
  }

  async getAccount(userId: string): Promise<GitHubConnectionRecord | null> {
    return db.getGitHubConnection(userId);
  }

  async disconnectAccount(userId: string): Promise<boolean> {
    return db.deleteGitHubConnection(userId);
  }

  async listUserRepositories(userId: string): Promise<GitHubRepoItem[]> {
    const conn = await db.getGitHubConnection(userId);
    if (!conn) {
      throw new Error('No GitHub account connected. Please connect your GitHub account first.');
    }

    const res = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator',
      {
        headers: {
          Authorization: `Bearer ${conn.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Remix-Design-Engine',
        },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        await db.deleteGitHubConnection(userId);
        throw new Error('GitHub authorization expired or revoked. Please reconnect your account.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load GitHub repositories.');
    }

    const repos = await res.json();
    return repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      isPrivate: Boolean(r.private),
      htmlUrl: r.html_url,
      defaultBranch: r.default_branch || 'main',
      description: r.description,
      updatedAt: r.updated_at,
    }));
  }

  async createRepository(
    userId: string,
    params: { name: string; description?: string; isPrivate?: boolean }
  ): Promise<GitHubRepoItem> {
    const conn = await db.getGitHubConnection(userId);
    if (!conn) {
      throw new Error('No GitHub account connected.');
    }

    const cleanName = params.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '-')
      .replace(/-+/g, '-');

    if (!cleanName) {
      throw new Error('Repository name is required.');
    }

    const res = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Remix-Design-Engine',
      },
      body: JSON.stringify({
        name: cleanName,
        description: params.description || 'Generated with Remix (Find it. Remix it. Build it.)',
        private: params.isPrivate ?? false,
        auto_init: true, // initializes with README so git ref exists immediately
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create GitHub repository.');
    }

    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      isPrivate: Boolean(data.private),
      htmlUrl: data.html_url,
      defaultBranch: data.default_branch || 'main',
      description: data.description,
      updatedAt: data.updated_at,
    };
  }

  async connectProjectRepository(
    userId: string,
    projectId: string,
    params: {
      repoOwner: string;
      repoName: string;
      defaultBranch?: string;
    }
  ): Promise<ProjectRepositoryRecord> {
    const project = await db.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found or unauthorized.');
    }

    const conn = await db.getGitHubConnection(userId);
    if (!conn) {
      throw new Error('Please connect your GitHub account first.');
    }

    const owner = params.repoOwner.trim();
    const repo = params.repoName.trim();
    const branch = params.defaultBranch?.trim() || 'main';

    // Verify repository exists and user has push access
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${conn.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Remix-Design-Engine',
      },
    });

    if (!checkRes.ok) {
      if (checkRes.status === 404) {
        throw new Error(`Repository ${owner}/${repo} was not found or your GitHub account does not have access.`);
      }
      throw new Error(`Could not access repository: HTTP ${checkRes.status}`);
    }

    const repoData = await checkRes.json();
    if (repoData.permissions && repoData.permissions.push === false) {
      throw new Error(`Your GitHub account does not have write (push) permission to ${owner}/${repo}.`);
    }

    const record: ProjectRepositoryRecord = {
      id: `repo_conn_${projectId}`,
      projectId,
      userId,
      githubConnectionId: conn.id,
      repoOwner: owner,
      repoName: repo,
      repoUrl: repoData.html_url,
      visibility: repoData.private ? 'private' : 'public',
      defaultBranch: branch,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return db.saveProjectRepository(record);
  }

  async disconnectProjectRepository(userId: string, projectId: string): Promise<boolean> {
    const project = await db.getProject(projectId, userId);
    if (!project) throw new Error('Project not found or unauthorized.');
    return db.deleteProjectRepository(projectId, userId);
  }

  async pushProjectToGitHub(
    userId: string,
    projectId: string,
    commitMessage?: string
  ): Promise<{
    success: boolean;
    commitSha: string;
    commitUrl: string;
    repoUrl: string;
    filesCount: number;
    branch: string;
  }> {
    // 1. Validate ownership & project
    const project = await db.getProject(projectId, userId);
    if (!project) {
      throw new Error('Project not found or unauthorized.');
    }

    const currentVersion = project.currentVersion;
    if (!currentVersion || !currentVersion.websiteDefinition) {
      throw new Error('No valid website definition found to push.');
    }

    // 2. Validate repo connection
    const repoConn = await db.getProjectRepository(projectId, userId);
    if (!repoConn) {
      throw new Error('This project is not connected to a GitHub repository.');
    }

    // 3. Validate user token
    const conn = await db.getGitHubConnection(userId);
    if (!conn) {
      throw new Error('GitHub account disconnected. Please reconnect your account.');
    }

    const owner = repoConn.repoOwner;
    const repo = repoConn.repoName;
    const branch = repoConn.defaultBranch || 'main';
    const token = conn.accessToken;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Remix-Design-Engine',
    };

    // Update status to syncing
    await db.saveProjectRepository({
      ...repoConn,
      syncStatus: 'syncing',
      syncError: undefined,
    });

    try {
      // 4. Generate all project files (React, Vite, TS, Tailwind, configs)
      const fileMap = generateProjectFileMap(currentVersion.websiteDefinition);
      const fileEntries = Object.entries(fileMap);

      // 5. Get current branch reference
      let latestCommitSha: string | null = null;
      let refExists = true;

      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
        { headers }
      );

      if (refRes.ok) {
        const refData = await refRes.json();
        latestCommitSha = refData.object.sha;
      } else if (refRes.status === 404) {
        refExists = false;
        // Check default branch as base if different
        const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (repoMetaRes.ok) {
          const repoMeta = await repoMetaRes.json();
          const defBranch = repoMeta.default_branch || 'main';
          if (defBranch !== branch) {
            const defRefRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${defBranch}`,
              { headers }
            );
            if (defRefRes.ok) {
              const defRefData = await defRefRes.json();
              latestCommitSha = defRefData.object.sha;
            }
          }
        }
      } else {
        const err = await refRes.json().catch(() => ({}));
        throw new Error(`Failed to query branch reference: ${err.message || refRes.status}`);
      }

      // 6. Get base tree SHA if latest commit exists
      let baseTreeSha: string | undefined = undefined;
      if (latestCommitSha) {
        const commitRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
          { headers }
        );
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          baseTreeSha = commitData.tree.sha;
        }
      }

      // 7. Create tree with all project files
      const treePayload: any = {
        tree: fileEntries.map(([path, content]) => ({
          path,
          mode: '100644',
          type: 'blob',
          content,
        })),
      };

      if (baseTreeSha) {
        treePayload.base_tree = baseTreeSha;
      }

      const createTreeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(treePayload),
        }
      );

      if (!createTreeRes.ok) {
        const err = await createTreeRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create Git tree on GitHub.');
      }

      const treeData = await createTreeRes.json();
      const newTreeSha = treeData.sha;

      // 8. Create Commit
      const msg =
        commitMessage?.trim() ||
        `Update ${project.name} to v${currentVersion.versionNumber} via Remix`;

      const commitPayload: any = {
        message: msg,
        tree: newTreeSha,
        parents: latestCommitSha ? [latestCommitSha] : [],
      };

      const createCommitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(commitPayload),
        }
      );

      if (!createCommitRes.ok) {
        const err = await createCommitRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create Git commit on GitHub.');
      }

      const commitData = await createCommitRes.json();
      const newCommitSha = commitData.sha;

      // 9. Update / Create branch reference
      if (refExists) {
        const updateRefRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              sha: newCommitSha,
              force: false,
            }),
          }
        );

        if (!updateRefRes.ok) {
          if (updateRefRes.status === 422) {
            throw new Error(
              'Non-fast-forward conflict detected: the remote GitHub branch has new commits. Please pull or synchronize.'
            );
          }
          const err = await updateRefRes.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to update branch reference.');
        }
      } else {
        const createRefRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ref: `refs/heads/${branch}`,
              sha: newCommitSha,
            }),
          }
        );

        if (!createRefRes.ok) {
          const err = await createRefRes.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create branch on GitHub.');
        }
      }

      const now = new Date().toISOString();
      const commitUrl = `https://github.com/${owner}/${repo}/commit/${newCommitSha}`;

      // 10. Update DB record
      await db.saveProjectRepository({
        ...repoConn,
        lastSyncCommitSha: newCommitSha,
        lastSyncCommitMessage: msg,
        lastSyncAt: now,
        syncStatus: 'synced',
        syncError: undefined,
        updatedAt: now,
      });

      return {
        success: true,
        commitSha: newCommitSha,
        commitUrl,
        repoUrl: repoConn.repoUrl,
        filesCount: fileEntries.length,
        branch,
      };
    } catch (err: any) {
      console.error('[GitHubService] Push failed:', err);
      await db.saveProjectRepository({
        ...repoConn,
        syncStatus: 'failed',
        syncError: err.message || 'Push failed',
      });
      throw err;
    }
  }
}

export const githubService = new GitHubService();
