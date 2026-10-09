import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../lib/router';
import { useAuth } from '../lib/auth-context';
import { WEBSITES } from '../data/websites';
import { Website } from '../types';
import { WebsitePreview } from '../components/WebsitePreview';
import { BrandLogo } from '../components/BrandLogo';
import { SignInModal } from '../components/SignInModal';
import { GitHubModal } from '../components/GitHubModal';
import { CustomDomainsModal } from '../components/CustomDomainsModal';
import {
  LayoutDashboard,
  Bookmark,
  Settings,
  Plus,
  Search,
  MoreVertical,
  ExternalLink,
  Download,
  Copy,
  Trash2,
  Edit2,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowUpRight,
  Globe,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  referenceUrl?: string;
  referenceAnalysisId?: string;
  currentVersionId?: string;
  currentDeploymentId?: string;
  publishedUrl?: string;
  publishedVersionId?: string;
  publishedAt?: string;
  deploymentStatus?: 'ready' | 'queued' | 'preparing' | 'building' | 'deploying' | 'failed' | 'unpublished';
  createdAt: string;
  updatedAt: string;
  currentVersion?: {
    id: string;
    versionNumber: number;
    websiteDefinition: any;
    editPrompt?: string;
    createdAt: string;
  };
  versionsCount?: number;
}

export const DashboardPage: React.FC = () => {
  const { navigate, searchParams } = useRouter();
  const { user, token, loading: authLoading, signOut, updateProfile } = useAuth();

  const initialTab = searchParams.get('tab') || 'projects';
  const [activeTab, setActiveTab] = useState<'projects' | 'saved' | 'settings'>(
    initialTab as any
  );

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [savedWebsiteIds, setSavedWebsiteIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'name'>('updated_at');

  // Modals & Action States
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<ProjectItem | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  // Phase 6 Integrations & Modals state
  const [activeGitHubProject, setActiveGitHubProject] = useState<ProjectItem | null>(null);
  const [activeDomainsProject, setActiveDomainsProject] = useState<ProjectItem | null>(null);
  const [githubAccount, setGithubAccount] = useState<{
    connected: boolean;
    username?: string;
    avatarUrl?: string;
    connectedAt?: string;
  } | null>(null);

  // Settings state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Settings GitHub integration state
  const [ghPatInput, setGhPatInput] = useState('');
  const [ghConnecting, setGhConnecting] = useState(false);
  const [ghDisconnecting, setGhDisconnecting] = useState(false);
  const [ghError, setGhError] = useState<string | null>(null);
  const [ghSuccess, setGhSuccess] = useState<string | null>(null);

  const handleDisconnectGitHub = async () => {
    if (!token) return;
    setGhDisconnecting(true);
    setGhError(null);
    try {
      const res = await fetch('/api/github/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setGithubAccount(null);
        setGhSuccess('GitHub account disconnected.');
        setTimeout(() => setGhSuccess(null), 3000);
      }
    } catch (err: any) {
      setGhError(err.message || 'Failed to disconnect GitHub.');
    } finally {
      setGhDisconnecting(false);
    }
  };

  const handleConnectGitHubPAT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !ghPatInput.trim()) return;
    setGhConnecting(true);
    setGhError(null);
    try {
      const res = await fetch('/api/github/connect-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: ghPatInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect GitHub token.');
      setGithubAccount(data.account);
      setGhPatInput('');
      setGhSuccess('GitHub account connected successfully!');
      setTimeout(() => setGhSuccess(null), 3000);
    } catch (err: any) {
      setGhError(err.message || 'Connection failed.');
    } finally {
      setGhConnecting(false);
    }
  };

  const handleStartOAuth = async () => {
    if (!token) return;
    setGhError(null);
    try {
      const res = await fetch('/api/github/auth-url', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'GitHub OAuth is not configured on the server. Please connect using a Personal Access Token below.');
      }
      window.open(data.url, 'github_oauth', 'width=600,height=700');
      const handleMessage = (evt: MessageEvent) => {
        if (evt.data?.type === 'GITHUB_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          fetchGitHubAccount();
          setGhSuccess('GitHub account connected!');
          setTimeout(() => setGhSuccess(null), 3000);
        } else if (evt.data?.type === 'GITHUB_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          setGhError(evt.data.error || 'Authorization failed.');
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err: any) {
      setGhError(err.message || 'OAuth initialization failed.');
    }
  };

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
    }
  }, [user]);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'saved' || tabParam === 'settings' || tabParam === 'projects') {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Load Projects
  const fetchProjects = async () => {
    if (!token) {
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    try {
      const res = await fetch(`/api/projects?search=${encodeURIComponent(searchQuery)}&sortBy=${sortBy}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load Saved Websites
  const fetchSavedWebsites = async () => {
    if (!token) {
      setLoadingSaved(false);
      return;
    }
    setLoadingSaved(true);
    try {
      const res = await fetch('/api/saved-websites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const ids = (data.savedWebsites || []).map((s: any) => s.websiteId);
        setSavedWebsiteIds(ids);
      }
    } catch (err) {
      console.error('Failed to fetch saved websites:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // Fetch GitHub integration account
  const fetchGitHubAccount = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/github/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGithubAccount(data.connected ? data.account : null);
      }
    } catch (err) {
      console.warn('Failed to fetch github status:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchSavedWebsites();
      fetchGitHubAccount();
    } else if (!authLoading) {
      setLoadingProjects(false);
      setLoadingSaved(false);
    }
  }, [token, authLoading, searchQuery, sortBy]);

  // Handle Project Actions
  const handleOpenRename = (project: ProjectItem) => {
    setProjectToRename(project);
    setNewName(project.name);
    setNewDescription(project.description || '');
    setRenameModalOpen(true);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToRename || !token || !newName.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectToRename.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update project.');
      }

      setRenameModalOpen(false);
      setProjectToRename(null);
      setActionSuccessMessage('Project updated successfully.');
      setTimeout(() => setActionSuccessMessage(null), 3000);
      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async (projectId: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to duplicate project.');
      }

      setActionSuccessMessage('Project duplicated successfully.');
      setTimeout(() => setActionSuccessMessage(null), 3000);
      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project.');
      }

      setDeleteModalOpen(false);
      setProjectToDelete(null);
      setActionSuccessMessage('Project removed.');
      setTimeout(() => setActionSuccessMessage(null), 3000);
      fetchProjects();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveSaved = async (websiteId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/saved-websites/${websiteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSavedWebsiteIds((prev) => prev.filter((id) => id !== websiteId));
      }
    } catch (err) {
      console.error('Failed to remove saved website:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) return;
    setProfileSaving(true);
    try {
      await updateProfile(editDisplayName.trim());
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Filter saved websites from mock dataset
  const savedWebsites: Website[] = WEBSITES.filter((w) =>
    savedWebsiteIds.includes(w.id) || savedWebsiteIds.includes(w.slug)
  );

  // Time formatting helper
  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  // If user is not authenticated, show welcoming invitation
  if (!authLoading && !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-md">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 font-sans">
            Personal Workspace
          </h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            Sign in to access your saved website projects, manage version history, and view bookmarked reference designs across devices.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setSignInModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
          >
            Sign in / Create Account
          </button>
          <Link
            to="/explore"
            className="px-5 py-2.5 rounded-xl text-xs font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Explore Library
          </Link>
        </div>

        <SignInModal
          isOpen={signInModalOpen}
          onClose={() => setSignInModalOpen(false)}
          onSuccess={() => {
            fetchProjects();
            fetchSavedWebsites();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full flex flex-col gap-8">
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-1">
            <span>Workspace</span>
            <span>·</span>
            <span className="text-emerald-700 flex items-center gap-1 font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Connected
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 font-sans">
            Welcome back, {user?.displayName || 'Creator'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your generated websites, track version history, and curate your design reference bookmarks.
          </p>
        </div>

        {/* Primary Workspace CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/build"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Website</span>
          </Link>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-500" />
            <span>Explore Inspiration</span>
          </Link>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-medium">Total Projects</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-sans">{projects.length}</p>
          <p className="text-[11px] text-zinc-400 truncate">Generated original web apps</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-medium">Live Published</span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-sans">
            {projects.filter((p) => p.publishedUrl && p.deploymentStatus === 'ready').length}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">Public edge deployments</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-medium">Saved References</span>
            <Bookmark className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-sans">{savedWebsiteIds.length}</p>
          <p className="text-[11px] text-zinc-400 truncate">Bookmarked references</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-mono uppercase tracking-wider text-[11px] font-medium">Project Versions</span>
            <Sparkles className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-950 font-sans">
            {projects.reduce((acc, p) => acc + (p.versionsCount || 1), 0)}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">AI design states recorded</p>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        <button
          onClick={() => {
            setActiveTab('projects');
            navigate('/dashboard?tab=projects');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>My Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('saved');
            navigate('/dashboard?tab=saved');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved References ({savedWebsiteIds.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            navigate('/dashboard?tab=settings');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Profile & Settings</span>
        </button>
      </div>

      {/* 4. TAB CONTENT: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Search and Sort Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs"
              >
                <option value="updated_at">Recently modified</option>
                <option value="created_at">Newest created</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Project Grid */}
          {loadingProjects ? (
            <div className="py-16 text-center text-xs font-mono text-zinc-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Loading workspace projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 px-6 text-center border border-dashed border-zinc-200 rounded-2xl bg-white space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-zinc-950 font-sans">
                  {searchQuery ? 'No matching projects found' : 'No projects generated yet'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {searchQuery
                    ? 'Try adjusting your search query or clear the filter.'
                    : 'Paste any public URL to extract its design language and generate an original website, or start from scratch.'}
                </p>
              </div>
              <div>
                <Link
                  to="/build"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Project</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const currentVer = project.currentVersion;
                const def = currentVer?.websiteDefinition;
                const themeMode = def?.theme?.mode || 'light';
                const accentColor = def?.theme?.accentColor || '#3B82F6';
                const sectionsCount = def?.sections?.length || 4;

                return (
                  <div
                    key={project.id}
                    className="group rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-md transition-all flex flex-col overflow-hidden"
                  >
                    {/* Visual Preview Header (Mini Mockup) */}
                    <div
                      onClick={() => navigate(`/editor/${project.id}`)}
                      className={`h-40 w-full relative p-4 flex flex-col justify-between cursor-pointer border-b border-zinc-100 transition-colors ${
                        themeMode === 'dark' ? 'bg-[#0F0F12] text-white' : 'bg-[#F9F9F8] text-zinc-900'
                      }`}
                    >
                      {/* Mockup browser bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-400/80" />
                          <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                          <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                        </div>
                        <span className="text-[10px] font-mono opacity-60 truncate max-w-[140px]">
                          {project.referenceUrl || 'remix.local'}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full border border-black/10"
                          style={{ backgroundColor: accentColor }}
                        />
                      </div>

                      {/* Mockup content snippet */}
                      <div className="space-y-1.5 my-auto">
                        <div
                          className="h-2 w-12 rounded"
                          style={{ backgroundColor: accentColor }}
                        />
                        <p className="font-bold text-sm tracking-tight truncate font-sans">
                          {def?.name || project.name}
                        </p>
                        <p className="text-[10px] opacity-60 line-clamp-1">
                          {def?.sections?.[1]?.content?.headline || project.description || 'Modern interface blueprint'}
                        </p>
                      </div>

                      {/* Bottom info */}
                      <div className="flex items-center justify-between text-[10px] font-mono opacity-50">
                        <span>{sectionsCount} sections</span>
                        <span>v{currentVer?.versionNumber || 1}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => navigate(`/editor/${project.id}`)}
                            className="font-bold text-sm text-zinc-950 truncate hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {project.publishedUrl && project.deploymentStatus === 'ready' && (
                              <a
                                href={project.publishedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                                title="Open Live Website"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Live</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                              v{currentVer?.versionNumber || 1}
                            </span>
                          </div>
                        </div>
                        {project.description && (
                          <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2.5 text-[11px] text-zinc-400 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(project.updatedAt)}</span>
                          {project.referenceUrl && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[120px] text-zinc-600">
                                {project.referenceUrl.replace(/^https?:\/\//, '')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Action Bar */}
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/editor/${project.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-950 hover:underline"
                          >
                            <span>Open in Editor</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          {project.publishedUrl && (
                            <a
                              href={project.publishedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-700 hover:underline font-mono flex items-center gap-1"
                            >
                              <span>Visit</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveGitHubProject(project)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="GitHub Repository & Code Sync"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setActiveDomainsProject(project)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Custom Domains & DNS"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => (window.location.href = `/api/generate/${project.id}/export`)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Download Code ZIP"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(project.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRename(project)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Rename Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setProjectToDelete(project);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: SAVED REFERENCES */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 font-sans">
                Bookmarked Reference Designs
              </h2>
              <p className="text-xs text-zinc-500">
                Websites you've saved from the Remix library to inspire future generation projects.
              </p>
            </div>
            <Link
              to="/explore"
              className="text-xs font-semibold text-zinc-950 hover:underline flex items-center gap-1"
            >
              <span>Explore more references</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingSaved ? (
            <div className="py-16 text-center text-xs font-mono text-zinc-400">
              Loading saved references...
            </div>
          ) : savedWebsites.length === 0 ? (
            <div className="py-16 px-6 text-center border border-dashed border-zinc-200 rounded-2xl bg-white space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-zinc-950 font-sans">
                  No saved reference websites yet
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Browse the curated website library and click the bookmark icon on any design you'd like to remember or remix later.
                </p>
              </div>
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-xs"
              >
                <span>Browse Website Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedWebsites.map((site) => (
                <div
                  key={site.id}
                  className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => navigate(`/website/${site.slug}`)}
                    className="h-44 w-full cursor-pointer relative overflow-hidden bg-zinc-100"
                  >
                    <WebsitePreview website={site} variant="card" />
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4
                          onClick={() => navigate(`/website/${site.slug}`)}
                          className="font-bold text-sm text-zinc-950 hover:underline cursor-pointer"
                        >
                          {site.name}
                        </h4>
                        <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
                          {site.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveSaved(site.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                      <span>{site.category}</span>
                      <span>·</span>
                      <span>{site.style}</span>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/website/${site.slug}`}
                        className="text-xs font-medium text-zinc-600 hover:text-zinc-950"
                      >
                        Inspect details
                      </Link>

                      <Link
                        to={`/build?ref=${site.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Build Similar</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="max-w-2xl bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 font-sans">Account Settings</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage your personal credentials and workspace profile.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-950 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-500 bg-zinc-50 font-mono"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Primary authentication identifier cannot be modified.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {profileSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>

              <button
                type="button"
                onClick={signOut}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
              >
                Sign out of workspace
              </button>
            </div>
          </form>

          <div className="pt-6 border-t border-zinc-100 text-[11px] font-mono text-zinc-400 space-y-1">
            <p>User ID: {user?.id}</p>
            <p>Database Provider: Persistent Storage</p>
          </div>
        </div>

        {/* GitHub Integration Card in Settings */}
        <div className="max-w-2xl bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 fill-zinc-950" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <h2 className="text-lg font-bold text-zinc-950 font-sans">GitHub Integration</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Connect your GitHub account to sync generated websites, push clean repository commits, and manage versions.
              </p>
            </div>
            {githubAccount?.connected && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            )}
          </div>

          {ghSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{ghSuccess}</span>
            </div>
          )}

          {ghError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{ghError}</span>
            </div>
          )}

          {githubAccount?.connected ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {githubAccount.avatarUrl ? (
                    <img
                      src={githubAccount.avatarUrl}
                      alt={githubAccount.username}
                      className="w-10 h-10 rounded-full border border-zinc-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-700">
                      {githubAccount.username?.[0]?.toUpperCase() || 'G'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 font-mono">
                      @{githubAccount.username}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Connected {githubAccount.connectedAt ? new Date(githubAccount.connectedAt).toLocaleDateString() : 'Active'} · Minimum scope: repo, read:user
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnectGitHub}
                  disabled={ghDisconnecting}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {ghDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>

              <p className="text-xs text-zinc-500">
                You can push and sync repositories from each project's card or editor toolbar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 font-sans">Connect with OAuth</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Authorize Remix using official GitHub OAuth application flow.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartOAuth}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                  >
                    Authorize GitHub
                  </button>
                </div>

                <div className="border-t border-zinc-200 pt-4">
                  <h4 className="text-xs font-bold text-zinc-900 font-sans mb-1">
                    Or Connect via Personal Access Token (PAT)
                  </h4>
                  <p className="text-xs text-zinc-500 mb-3">
                    Generate a token in GitHub (Settings &gt; Developer Settings &gt; Personal access tokens) with <code className="px-1 py-0.5 bg-zinc-200 rounded font-mono text-[11px]">repo</code> permissions.
                  </p>

                  <form onSubmit={handleConnectGitHubPAT} className="flex gap-2">
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={ghPatInput}
                      onChange={(e) => setGhPatInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 text-xs text-zinc-950 font-mono bg-white focus:outline-none focus:border-zinc-900"
                    />
                    <button
                      type="submit"
                      disabled={ghConnecting || !ghPatInput.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {ghConnecting ? 'Connecting...' : 'Connect Token'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* 7. RENAME PROJECT MODAL */}
      {renameModalOpen && projectToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-zinc-200 shadow-xl space-y-4 text-left">
            <div>
              <h3 className="text-base font-bold text-zinc-950 font-sans">Rename Project</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Update the title and description for this generated website.
              </p>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-medium mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-zinc-200 shadow-xl space-y-4 text-left">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-950 font-sans">
                Delete Project?
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-zinc-900">{projectToDelete.name}</span>? This will permanently remove all {projectToDelete.versionsCount || 1} saved versions and cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                Keep Project
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-xs"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. GITHUB INTEGRATION MODAL */}
      {activeGitHubProject && (
        <GitHubModal
          isOpen={!!activeGitHubProject}
          onClose={() => setActiveGitHubProject(null)}
          projectId={activeGitHubProject.id}
          projectName={activeGitHubProject.name}
        />
      )}

      {/* 10. CUSTOM DOMAINS MODAL */}
      {activeDomainsProject && (
        <CustomDomainsModal
          isOpen={!!activeDomainsProject}
          onClose={() => setActiveDomainsProject(null)}
          projectId={activeDomainsProject.id}
          projectName={activeDomainsProject.name}
          publishedUrl={activeDomainsProject.publishedUrl}
        />
      )}
    </div>
  );
};
