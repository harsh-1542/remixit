import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  X,
  ExternalLink,
  GitBranch,
  GitCommit,
  Check,
  Copy,
  AlertCircle,
  RefreshCw,
  Plus,
  Lock,
  Globe,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Key,
} from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

interface RepositoryItem {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  htmlUrl: string;
  defaultBranch: string;
  description: string | null;
  updatedAt: string;
}

interface ProjectRepoRecord {
  id: string;
  projectId: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  visibility: 'public' | 'private';
  defaultBranch: string;
  lastSyncCommitSha?: string;
  lastSyncCommitMessage?: string;
  lastSyncAt?: string;
  syncStatus: 'synced' | 'pending' | 'syncing' | 'failed' | 'conflict';
  syncError?: string;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { token } = useAuth();

  // Tab: 'overview' | 'select_repo' | 'create_repo' | 'connect_token'
  const [view, setView] = useState<'overview' | 'select_repo' | 'create_repo' | 'connect_token'>('overview');

  // Account state
  const [loading, setLoading] = useState(true);
  const [accountConnected, setAccountConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [githubAvatar, setGithubAvatar] = useState<string | null>(null);
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(false);

  // Project repo state
  const [projectRepo, setProjectRepo] = useState<ProjectRepoRecord | null>(null);

  // Repos list state
  const [repos, setRepos] = useState<RepositoryItem[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [searchRepo, setSearchRepo] = useState('');

  // Create repo state
  const [newRepoName, setNewRepoName] = useState(
    projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-')
  );
  const [newRepoDesc, setNewRepoDesc] = useState(`Source code for ${projectName}, built with Remix.`);
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);

  // Direct Token state
  const [patToken, setPatToken] = useState('');
  const [isConnectingToken, setIsConnectingToken] = useState(false);

  // Push state
  const [isPushing, setIsPushing] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [pushSuccess, setPushSuccess] = useState<{
    commitSha: string;
    commitUrl: string;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getHeaders = (hasBody = false) => {
    const headers: Record<string, string> = {};
    if (hasBody) headers['Content-Type'] = 'application/json';
    const currentToken = token || localStorage.getItem('remix_auth_token');
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    return headers;
  };

  // Fetch initial status
  const loadStatus = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Account status
      const accRes = await fetch('/api/github/status', { headers: getHeaders() });
      if (accRes.ok) {
        const accData = await accRes.json();
        setAccountConnected(accData.connected);
        setIsOAuthConfigured(accData.isConfigured);
        if (accData.account) {
          setGithubUsername(accData.account.username);
          setGithubAvatar(accData.account.avatarUrl);
        } else {
          setGithubUsername(null);
          setGithubAvatar(null);
        }
      }

      // 2. Project repo status
      const projRes = await fetch(`/api/projects/${projectId}/github`, { headers: getHeaders() });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjectRepo(projData.repository || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to check GitHub integration status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setView('overview');
      setPushSuccess(null);
      setErrorMessage(null);
      setCommitMessage('');
    }
  }, [isOpen, projectId]);

  // Listen for OAuth completion via postMessage from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        loadStatus();
        setView('overview');
      } else if (event.data?.type === 'GITHUB_AUTH_ERROR') {
        setErrorMessage(event.data.error || 'GitHub authorization failed.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // OAuth Popup Handler
  const handleConnectOAuth = async () => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/github/auth-url', { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start GitHub authorization.');

      if (!data.url) {
        // Fallback to token connect view
        setView('connect_token');
        return;
      }

      // Open OAuth provider URL directly in popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.url,
        'github_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
      );

      if (!popup) {
        alert('Please allow popups for this site to complete GitHub authorization.');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Connect via Personal Access Token
  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patToken.trim()) return;

    setIsConnectingToken(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/github/connect-token', {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ token: patToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect token.');

      setAccountConnected(true);
      setGithubUsername(data.account.username);
      setGithubAvatar(data.account.avatarUrl);
      setPatToken('');
      setView('overview');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsConnectingToken(false);
    }
  };

  // Disconnect GitHub account
  const handleDisconnectAccount = async () => {
    if (!window.confirm('Disconnect your GitHub account from Remix?')) return;
    try {
      const res = await fetch('/api/github/disconnect', {
        method: 'POST',
        headers: getHeaders(true),
      });
      if (res.ok) {
        setAccountConnected(false);
        setGithubUsername(null);
        setGithubAvatar(null);
        setProjectRepo(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Fetch repositories
  const handleOpenSelectRepo = async () => {
    setView('select_repo');
    setLoadingRepos(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/github/repos', { headers: getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load repositories.');
      setRepos(data.repos || []);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoadingRepos(false);
    }
  };

  // Connect selected repository
  const handleConfirmSelectRepo = async () => {
    const selected = repos.find((r) => r.id === selectedRepoId);
    if (!selected) return;

    const [owner, name] = selected.fullName.split('/');
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/github/connect`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          repoOwner: owner,
          repoName: name,
          defaultBranch: selected.defaultBranch || 'main',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect repository.');

      setProjectRepo(data.repository);
      setView('overview');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create and connect new repository
  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;

    setIsCreatingRepo(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/github/repos/create', {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          name: newRepoName.trim(),
          description: newRepoDesc.trim(),
          isPrivate: newRepoPrivate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create repository.');

      const [owner, name] = data.repo.fullName.split('/');
      // Connect to project
      const connRes = await fetch(`/api/projects/${projectId}/github/connect`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          repoOwner: owner,
          repoName: name,
          defaultBranch: data.repo.defaultBranch || 'main',
        }),
      });
      const connData = await connRes.json();
      if (!connRes.ok) throw new Error(connData.error || 'Failed to connect newly created repository.');

      setProjectRepo(connData.repository);
      setView('overview');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsCreatingRepo(false);
    }
  };

  // Disconnect repository from project
  const handleDisconnectRepo = async () => {
    if (!window.confirm('Disconnect this repository from this project? The repository on GitHub will remain untouched.')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/github/disconnect`, {
        method: 'POST',
        headers: getHeaders(true),
      });
      if (res.ok) {
        setProjectRepo(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Push project code to GitHub
  const handlePush = async () => {
    setIsPushing(true);
    setErrorMessage(null);
    setPushSuccess(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/github/push`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({
          commitMessage: commitMessage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Push to GitHub failed.');

      setPushSuccess({
        commitSha: data.commitSha,
        commitUrl: data.commitUrl,
        message: data.message,
      });
      setCommitMessage('');
      loadStatus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Push failed.');
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-950 font-sans">GitHub Synchronization</h3>
              <p className="text-[11px] font-mono text-zinc-400">
                {projectRepo ? `${projectRepo.repoOwner}/${projectRepo.repoName}` : 'Connect Repository'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Notice</span>
              <span className="text-[11px] leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-zinc-900" />
              <span>Checking GitHub connection...</span>
            </div>
          ) : view === 'connect_token' ? (
            /* VIEW: Connect with Personal Access Token */
            <form onSubmit={handleConnectToken} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold font-sans">Connect with GitHub Personal Access Token</span>
                <button
                  type="button"
                  onClick={() => setView('overview')}
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Back
                </button>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                If GitHub OAuth is not registered on your domain, connect instantly using a classic or fine-grained token with <strong>repo</strong> and <strong>read:user</strong> permissions.
              </p>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1.5">
                  GitHub Token
                </label>
                <input
                  type="password"
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 text-[11px] text-zinc-500 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Your token is stored safely on the server and never exposed in browser storage or logs.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setView('overview')}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnectingToken || !patToken.trim()}
                  className="px-5 py-2 text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 rounded-xl cursor-pointer"
                >
                  {isConnectingToken ? 'Verifying Token...' : 'Connect GitHub Account'}
                </button>
              </div>
            </form>
          ) : view === 'select_repo' ? (
            /* VIEW: Select Existing Repo */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold font-sans">Choose Existing Repository</span>
                <button
                  type="button"
                  onClick={() => setView('overview')}
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={searchRepo}
                onChange={(e) => setSearchRepo(e.target.value)}
                placeholder="Filter repositories..."
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
              />

              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-zinc-200 rounded-xl p-2 bg-zinc-50/50">
                {loadingRepos ? (
                  <div className="py-8 text-center text-xs font-mono text-zinc-400">Loading repositories...</div>
                ) : repos.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">No repositories found.</div>
                ) : (
                  repos
                    .filter((r) => r.fullName.toLowerCase().includes(searchRepo.toLowerCase()))
                    .map((repo) => (
                      <div
                        key={repo.id}
                        onClick={() => setSelectedRepoId(repo.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          selectedRepoId === repo.id
                            ? 'border-zinc-950 bg-white shadow-2xs font-semibold text-zinc-950'
                            : 'border-transparent hover:border-zinc-200 bg-white text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {repo.isPrivate ? <Lock className="w-3 h-3 text-zinc-400 shrink-0" /> : <Globe className="w-3 h-3 text-zinc-400 shrink-0" />}
                          <span className="truncate">{repo.fullName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">{repo.defaultBranch}</span>
                      </div>
                    ))
                )}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setView('create_repo')}
                  className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create new repository instead</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelectRepo}
                  disabled={!selectedRepoId}
                  className="px-5 py-2 text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 rounded-xl cursor-pointer"
                >
                  Connect Repository
                </button>
              </div>
            </div>
          ) : view === 'create_repo' ? (
            /* VIEW: Create New Repository */
            <form onSubmit={handleCreateRepo} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold font-sans">Create Repository on GitHub</span>
                <button
                  type="button"
                  onClick={() => setView('overview')}
                  className="text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRepoPrivate(false)}
                    className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                      !newRepoPrivate ? 'border-zinc-950 bg-zinc-900 text-white font-semibold' : 'border-zinc-200 text-zinc-700'
                    }`}
                  >
                    Public (Anyone can view)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRepoPrivate(true)}
                    className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all ${
                      newRepoPrivate ? 'border-zinc-950 bg-zinc-900 text-white font-semibold' : 'border-zinc-200 text-zinc-700'
                    }`}
                  >
                    Private (Restricted)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setView('select_repo')}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRepo || !newRepoName.trim()}
                  className="px-5 py-2 text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 rounded-xl cursor-pointer"
                >
                  {isCreatingRepo ? 'Creating on GitHub...' : 'Create & Connect'}
                </button>
              </div>
            </form>
          ) : (
            /* VIEW: Main Overview */
            <div className="space-y-6">
              {/* Account Connection State */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {githubAvatar ? (
                    <img src={githubAvatar} alt="GitHub" className="w-10 h-10 rounded-full border border-zinc-300" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold">
                      GH
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-950">
                        {accountConnected ? githubUsername : 'GitHub Account'}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          accountConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {accountConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {accountConnected
                        ? 'Authorized to read/write repositories on your behalf.'
                        : 'Connect your GitHub account to sync website source code.'}
                    </p>
                  </div>
                </div>

                <div>
                  {accountConnected ? (
                    <button
                      onClick={handleDisconnectAccount}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isOAuthConfigured ? (
                        <button
                          onClick={handleConnectOAuth}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
                        >
                          Connect GitHub
                        </button>
                      ) : (
                        <button
                          onClick={() => setView('connect_token')}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Key className="w-3 h-3" />
                          <span>Connect with Token</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Connected Repository Section */}
              {accountConnected && (
                <div className="space-y-4">
                  {projectRepo ? (
                    /* Repo Connected Card */
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-950">
                              {projectRepo.repoOwner}/{projectRepo.repoName}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 uppercase">
                              {projectRepo.visibility}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono mt-1">
                            <GitBranch className="w-3 h-3 text-zinc-400" />
                            <span>branch: {projectRepo.defaultBranch}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={projectRepo.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 text-xs flex items-center gap-1"
                            title="Open repository on GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={handleDisconnectRepo}
                            className="p-1.5 rounded-lg border border-zinc-200 text-red-600 hover:bg-red-50 text-xs"
                            title="Disconnect repository"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sync Status / Latest Commit info */}
                      <div className="p-3 rounded-lg bg-zinc-50 text-xs space-y-1.5 border border-zinc-100">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-400">Last Synchronization</span>
                          <span className="text-zinc-700 font-medium">
                            {projectRepo.lastSyncAt ? new Date(projectRepo.lastSyncAt).toLocaleString() : 'Never synced'}
                          </span>
                        </div>
                        {projectRepo.lastSyncCommitSha && (
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-zinc-400">Latest Commit</span>
                            <a
                              href={`${projectRepo.repoUrl}/commit/${projectRepo.lastSyncCommitSha}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <GitCommit className="w-3 h-3" />
                              <span>{projectRepo.lastSyncCommitSha.slice(0, 7)}</span>
                            </a>
                          </div>
                        )}
                        {projectRepo.lastSyncCommitMessage && (
                          <p className="text-[11px] text-zinc-600 italic">"{projectRepo.lastSyncCommitMessage}"</p>
                        )}
                      </div>

                      {/* Push Success Toast */}
                      {pushSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                          <div className="flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{pushSuccess.message}</span>
                          </div>
                          <a
                            href={pushSuccess.commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-900 underline underline-offset-2 ml-6"
                          >
                            <span>View commit {pushSuccess.commitSha.slice(0, 7)} on GitHub →</span>
                          </a>
                        </div>
                      )}

                      {/* Push Form */}
                      <div className="pt-2 border-t border-zinc-100 space-y-2">
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold">
                          Commit Message (Optional)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder={`Update ${projectName} via Remix`}
                            className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                          />
                          <button
                            onClick={handlePush}
                            disabled={isPushing}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isPushing ? 'animate-spin' : ''}`} />
                            <span>{isPushing ? 'Pushing...' : 'Push to GitHub'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Repo Not Connected: Actions to Select or Create */
                    <div className="p-6 border border-dashed border-zinc-300 rounded-xl text-center space-y-3 bg-zinc-50/50">
                      <GitBranch className="w-8 h-8 text-zinc-400 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 font-sans">No Repository Connected</h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                          Connect this project to a GitHub repository to push your React + Tailwind source code.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          onClick={handleOpenSelectRepo}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 cursor-pointer"
                        >
                          Choose Repository
                        </button>
                        <button
                          onClick={() => setView('create_repo')}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                        >
                          Create New
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
