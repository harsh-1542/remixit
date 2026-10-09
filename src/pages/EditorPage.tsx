import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { WebsiteDefinition } from '../types/website-definition';
import { BrandLogo } from '../components/BrandLogo';
import { WebsiteCanvas } from '../components/builder/WebsiteCanvas';
import { PublishModal } from '../components/PublishModal';
import { GitHubModal } from '../components/GitHubModal';
import { CustomDomainsModal } from '../components/CustomDomainsModal';
import { useAuth } from '../lib/auth-context';
import {
  Monitor,
  Tablet,
  Smartphone,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
  ChevronDown,
  Trash2,
  MoveUp,
  MoveDown,
  RefreshCw,
  Sliders,
  PanelLeftClose,
  PanelRightClose,
  History,
  LayoutDashboard,
  Edit2,
  X,
  Clock,
  RotateCw,
  Globe,
  ExternalLink,
  Copy,
  Share2,
  Server,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

interface EditorPageProps {
  projectId: string;
}

interface VersionItem {
  id: string;
  versionNumber: number;
  editPrompt?: string;
  createdAt: string;
}

interface DeploymentItem {
  id: string;
  projectId: string;
  versionNumber: number;
  provider: string;
  deploymentUrl: string;
  status: string;
  description?: string;
  createdAt: string;
  publishedAt?: string;
  buildLogSummary?: string;
}

export const EditorPage: React.FC<EditorPageProps> = ({ projectId }) => {
  const { navigate } = useRouter();
  const { token, user } = useAuth();
  const [website, setWebsite] = useState<WebsiteDefinition | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workspace controls
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(undefined);
  const [editPrompt, setEditPrompt] = useState('');
  const [isApplyingEdit, setIsApplyingEdit] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  // Version History & Deployments Drawer
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState<'revisions' | 'deployments'>('revisions');
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  // Publishing & Deployment state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isDomainsModalOpen, setIsDomainsModalOpen] = useState(false);
  const [hasGitHubRepo, setHasGitHubRepo] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<string | null>(null);
  const [publishedVersionNumber, setPublishedVersionNumber] = useState<number | null>(null);
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [loadingDeployments, setLoadingDeployments] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Responsive sidebar toggles
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  // Helper for auth headers
  const getHeaders = (hasBody = false) => {
    const headers: Record<string, string> = {};
    if (hasBody) headers['Content-Type'] = 'application/json';
    const currentToken = token || localStorage.getItem('remix_auth_token');
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
    return headers;
  };

  // Fetch project definition
  const fetchProjectData = () => {
    fetch(`/api/generate/${projectId}/result`, {
      headers: getHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load project.');
        return res.json();
      })
      .then((data) => {
        setWebsite(data.websiteDefinition);
        setProjectName(data.websiteDefinition?.name || 'My Website');
        setVersion(data.version || 1);
        if (data.websiteDefinition?.sections?.[0]) {
          setSelectedSectionId(data.websiteDefinition.sections[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load generated website.');
        setLoading(false);
      });
  };

  // Fetch project deployments
  const loadDeployments = async () => {
    setLoadingDeployments(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deployments`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const deps = data.deployments || [];
        setDeployments(deps);

        const active = deps.find((d: any) => d.status === 'ready');
        if (active) {
          setPublishedUrl(active.deploymentUrl);
          setCurrentDeploymentId(active.id);
          setDeploymentStatus('ready');
          setPublishedVersionNumber(active.versionNumber);
        } else {
          setPublishedUrl(null);
          setCurrentDeploymentId(null);
          setDeploymentStatus(null);
          setPublishedVersionNumber(null);
        }
      }
    } catch (err) {
      console.error('Failed to load deployments:', err);
    } finally {
      setLoadingDeployments(false);
    }
  };

  // Fetch project repository integration
  const loadProjectIntegrations = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/github`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHasGitHubRepo(data.connected);
      }
    } catch (err) {
      console.warn('Failed to fetch github status:', err);
    }
  };

  useEffect(() => {
    fetchProjectData();
    loadDeployments();
    loadProjectIntegrations();
  }, [projectId]);

  // Republish earlier version
  const handleRepublish = async (versionId: string) => {
    setActionInProgress(`republish_${versionId}`);
    try {
      const res = await fetch(`/api/projects/${projectId}/deployments/republish`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ versionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Republish failed.');
      }
      await loadDeployments();
      setEditSuccessMessage('Website republished successfully.');
      setTimeout(() => setEditSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to republish version.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Unpublish live deployment
  const handleUnpublish = async (depId: string) => {
    if (!window.confirm('Are you sure you want to unpublish this website? It will no longer be publicly accessible.')) {
      return;
    }

    setActionInProgress(`unpublish_${depId}`);
    try {
      const res = await fetch(`/api/deployments/${depId}/unpublish`, {
        method: 'POST',
        headers: getHeaders(true),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Unpublish failed.');
      }
      setPublishedUrl(null);
      setCurrentDeploymentId(null);
      setDeploymentStatus('unpublished');
      await loadDeployments();
      setEditSuccessMessage('Website unpublished successfully.');
      setTimeout(() => setEditSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to unpublish website.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Load versions history
  const loadVersionHistory = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // AI Edit submission
  const handleApplyEdit = async (customPrompt?: string) => {
    const instruction = customPrompt || editPrompt;
    if (!instruction.trim()) return;

    setIsApplyingEdit(true);
    setEditSuccessMessage(null);

    try {
      const res = await fetch(`/api/generate/${projectId}/edit`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ instruction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Edit could not be applied.');

      setWebsite(data.websiteDefinition);
      setVersion(data.version);
      setEditPrompt('');
      setEditSuccessMessage('Changes applied successfully.');
      setTimeout(() => setEditSuccessMessage(null), 3000);

      // Refresh version list if open
      if (showVersionHistory) {
        loadVersionHistory();
      }
    } catch (err: any) {
      alert(err.message || 'Edit failed. Try another instruction.');
    } finally {
      setIsApplyingEdit(false);
    }
  };

  // Undo Version
  const handleUndo = async () => {
    try {
      const res = await fetch(`/api/generate/${projectId}/undo`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cannot undo further.');

      setWebsite(data.websiteDefinition);
      setVersion(data.version);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Restore specific version from history
  const handleRestoreVersion = async (verId: string) => {
    setRestoringVersionId(verId);
    try {
      const res = await fetch(`/api/projects/${projectId}/restore/${verId}`, {
        method: 'POST',
        headers: getHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to restore version.');
      }

      const data = await res.json();
      if (data.project?.currentVersion?.websiteDefinition) {
        setWebsite(data.project.currentVersion.websiteDefinition);
        setVersion(data.project.currentVersion.versionNumber);
        setEditSuccessMessage(`Restored to Version ${data.project.currentVersion.versionNumber}`);
        setTimeout(() => setEditSuccessMessage(null), 3000);
      } else {
        fetchProjectData();
      }
      setShowVersionHistory(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRestoringVersionId(null);
    }
  };

  // Inline project renaming
  const handleSaveProjectName = async () => {
    if (!projectName.trim() || !token) {
      setIsEditingName(false);
      return;
    }
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ name: projectName.trim() }),
      });
    } catch {}
    setIsEditingName(false);
  };

  // Download ZIP
  const handleDownloadCode = () => {
    setIsDownloading(true);
    window.location.href = `/api/generate/${projectId}/export`;
    setTimeout(() => setIsDownloading(false), 2000);
  };

  // Reorder sections
  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (!website) return;
    const newSections = [...website.sections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[idx];
    newSections[idx] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    setWebsite({ ...website, sections: newSections });
  };

  // Remove section
  const handleRemoveSection = (id: string) => {
    if (!website) return;
    if (website.sections.length <= 2) {
      alert('A minimum of two sections must remain.');
      return;
    }
    const newSections = website.sections.filter((s) => s.id !== id);
    setWebsite({ ...website, sections: newSections });
  };

  // Quick edit chip suggestions
  const suggestedEdits = [
    'Make the hero more minimal',
    'Change accent color to violet',
    'Replace feature grid with bento grid',
    'Add a pricing section',
    'Switch to dark mode',
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-zinc-900 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-zinc-950" />
          <span>Opening visual builder workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-zinc-900">Project Not Found</h2>
        <p className="text-sm text-zinc-500 mt-2">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 px-4 py-2 rounded-lg bg-zinc-950 text-white text-xs font-semibold cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#FAFAF8] overflow-hidden select-none">
      {/* 1. TOP TOOLBAR */}
      <header className="h-14 border-b border-zinc-200 bg-white px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Brand and Project Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
            title="Return to Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>

          <BrandLogo size="sm" />
          <div className="h-4 w-px bg-zinc-200" />

          {/* Project Title (Editable) */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                autoFocus
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={handleSaveProjectName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveProjectName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="font-semibold text-xs text-zinc-900 border-b border-zinc-900 focus:outline-none px-1 py-0.5 bg-zinc-50 rounded"
              />
            ) : (
              <div
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-1.5 group cursor-pointer"
                title="Click to rename"
              >
                <span className="font-semibold text-xs text-zinc-900 truncate max-w-[140px] sm:max-w-[200px]">
                  {projectName || website.name}
                </span>
                <Edit2 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* Version & History trigger */}
            <button
              onClick={() => {
                setShowVersionHistory(true);
                loadVersionHistory();
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
              title="View version history"
            >
              <span>v{version}</span>
              <History className="w-2.5 h-2.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Center: Viewport Mode Switcher */}
        <div className="hidden sm:flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            title="Desktop 1440px"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            title="Mobile 390px"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Live Status Pill */}
          {publishedUrl && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live v{publishedVersionNumber || version}</span>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-950 transition-colors ml-0.5"
                title="Open live website"
              >
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </div>
          )}

          {/* GitHub Integration Button */}
          <button
            onClick={() => setIsGitHubModalOpen(true)}
            className={`p-1.5 px-2.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              hasGitHubRepo
                ? 'border-zinc-950 bg-zinc-900 text-white'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
            title="GitHub Repository & Sync"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden md:inline font-mono text-[11px]">{hasGitHubRepo ? 'GitHub' : 'Git'}</span>
          </button>

          {/* Custom Domains Button */}
          <button
            onClick={() => setIsDomainsModalOpen(true)}
            className="p-1.5 px-2.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Custom Domains & DNS Configuration"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline font-mono text-[11px]">Domains</span>
          </button>

          {/* Version History & Deployments Button */}
          <button
            onClick={() => {
              setShowVersionHistory(!showVersionHistory);
              if (!showVersionHistory) {
                loadVersionHistory();
                loadDeployments();
              }
            }}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              showVersionHistory
                ? 'border-zinc-950 bg-zinc-900 text-white'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
            title="Open Version History & Deployments"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[11px]">History</span>
          </button>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={version <= 1}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 disabled:opacity-40 transition-colors cursor-pointer"
            title="Undo previous edit"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Download Code */}
          <button
            onClick={handleDownloadCode}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-all shadow-2xs cursor-pointer"
            title="Download Standalone ZIP"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">{isDownloading ? 'Exporting...' : 'Export ZIP'}</span>
          </button>

          {/* Primary Action: Publish Website */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all shadow-xs cursor-pointer group"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span>{publishedUrl ? 'Update Published Site' : 'Publish Website'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: Page Structure */}
        {showLeftSidebar && (
          <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col shrink-0 z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Page Structure</span>
              </span>
              <button
                onClick={() => setShowLeftSidebar(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {website.sections.map((section, idx) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`group p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    selectedSectionId === section.id
                      ? 'border-zinc-900 bg-zinc-50 font-semibold text-zinc-950 shadow-2xs'
                      : 'border-transparent hover:bg-zinc-100/70 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-zinc-400">0{idx + 1}</span>
                    <span className="truncate capitalize">{section.type.replace(/_/g, ' ')}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(idx, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-0.5 hover:text-black disabled:opacity-20 cursor-pointer"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(idx, 'down');
                      }}
                      disabled={idx === website.sections.length - 1}
                      className="p-0.5 hover:text-black disabled:opacity-20 cursor-pointer"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSection(section.id);
                      }}
                      className="p-0.5 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Design tokens footer */}
            <div className="p-3 border-t border-zinc-100 text-[11px] font-mono text-zinc-500 space-y-1 bg-zinc-50/50">
              <div className="flex justify-between">
                <span>Theme:</span>
                <span className="capitalize text-zinc-900">{website.theme.mode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Accent:</span>
                <span
                  className="w-3.5 h-3.5 rounded border"
                  style={{ backgroundColor: website.theme.accentColor }}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Reopen left button if collapsed */}
        {!showLeftSidebar && (
          <button
            onClick={() => setShowLeftSidebar(true)}
            className="absolute left-2 top-2 z-10 p-2 bg-white border border-zinc-200 rounded-lg shadow-sm text-zinc-600 hover:text-zinc-900 cursor-pointer"
            title="Open structure sidebar"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {/* CENTER: Live Interactive Website Canvas */}
        <main className="flex-1 h-full overflow-hidden flex flex-col">
          <WebsiteCanvas
            website={website}
            viewport={viewport}
            selectedSectionId={selectedSectionId}
            onSelectSection={(id) => setSelectedSectionId(id)}
          />
        </main>

        {/* RIGHT SIDEBAR: AI Editor */}
        {showRightSidebar && (
          <aside className="w-80 border-l border-zinc-200 bg-white flex flex-col shrink-0 z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-900" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-900 font-bold">
                  Edit with AI
                </h3>
              </div>
              <button
                onClick={() => setShowRightSidebar(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                title="Collapse AI editor"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Describe any change. The AI updates the layout and theme while preserving unaffected sections.
                </p>

                {/* Edit Input */}
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe what you want to change..."
                    className="w-full p-3 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                  />
                  <button
                    onClick={() => handleApplyEdit()}
                    disabled={isApplyingEdit || !editPrompt.trim()}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isApplyingEdit ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying Changes...</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Changes</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                      </>
                    )}
                  </button>
                </div>

                {editSuccessMessage && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" />
                    <span>{editSuccessMessage}</span>
                  </div>
                )}

                {/* Suggested Chips */}
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2 font-semibold">
                    Suggested Refinements
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {suggestedEdits.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleApplyEdit(chip)}
                        disabled={isApplyingEdit}
                        className="text-left text-xs p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{chip}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-900 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Guardrail notice */}
              <div className="pt-4 border-t border-zinc-100 text-[10px] font-mono text-zinc-400 leading-normal">
                Persistent project state · Auto-versioned on every change
              </div>
            </div>
          </aside>
        )}

        {/* Reopen right button if collapsed */}
        {!showRightSidebar && (
          <button
            onClick={() => setShowRightSidebar(true)}
            className="absolute right-2 top-2 z-10 p-2 bg-white border border-zinc-200 rounded-lg shadow-sm text-zinc-600 hover:text-zinc-900 cursor-pointer"
            title="Open AI editor"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* 3. VERSION HISTORY & DEPLOYMENTS OVERLAY DRAWER */}
        {showVersionHistory && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-zinc-200 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-900" />
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-900">
                  Project History
                </h3>
              </div>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="p-1 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs: Revisions vs Deployments */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/50 p-1 gap-1">
              <button
                onClick={() => setHistoryTab('revisions')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  historyTab === 'revisions'
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Revisions ({versions.length})</span>
              </button>
              <button
                onClick={() => {
                  setHistoryTab('deployments');
                  loadDeployments();
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  historyTab === 'deployments'
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Deployments ({deployments.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: REVISIONS */}
            {historyTab === 'revisions' && (
              <>
                <div className="p-3 bg-zinc-50/70 border-b border-zinc-100 text-[11px] text-zinc-500">
                  Recover any previous valid design state. Restoring creates a new revision without destroying past edits.
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingVersions ? (
                    <div className="py-12 text-center text-xs font-mono text-zinc-400">
                      Loading version timeline...
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-400">
                      <p>Current version is v{version}</p>
                    </div>
                  ) : (
                    versions.map((ver) => {
                      const isCurrent = ver.versionNumber === version;

                      return (
                        <div
                          key={ver.id}
                          className={`p-3.5 rounded-xl border text-xs transition-all ${
                            isCurrent
                              ? 'border-zinc-950 bg-zinc-50 shadow-2xs'
                              : 'border-zinc-200 hover:border-zinc-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-950">v{ver.versionNumber}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-zinc-600 mt-1.5 text-[11px] font-medium leading-relaxed">
                            {ver.editPrompt || 'Automated update'}
                          </p>

                          {!isCurrent && (
                            <div className="mt-3 pt-2.5 border-t border-zinc-100 flex justify-end">
                              <button
                                onClick={() => handleRestoreVersion(ver.id)}
                                disabled={restoringVersionId === ver.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <RotateCw className="w-3 h-3" />
                                <span>{restoringVersionId === ver.id ? 'Restoring...' : 'Restore This Version'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* TAB CONTENT: DEPLOYMENTS */}
            {historyTab === 'deployments' && (
              <>
                <div className="p-3 bg-zinc-50/70 border-b border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Manage live deployments & rollbacks.</span>
                  <button
                    onClick={() => setIsPublishModalOpen(true)}
                    className="font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    + New Deploy
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingDeployments ? (
                    <div className="py-12 text-center text-xs font-mono text-zinc-400">
                      Loading deployment logs...
                    </div>
                  ) : deployments.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <Globe className="w-8 h-8 text-zinc-300 mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Not Published Yet</p>
                        <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">
                          Publish version {version} to receive an instant public URL.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsPublishModalOpen(true)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Publish Website
                      </button>
                    </div>
                  ) : (
                    deployments.map((dep) => {
                      const isLive = dep.status === 'ready';
                      const isUnpublished = dep.status === 'unpublished';

                      return (
                        <div
                          key={dep.id}
                          className={`p-3.5 rounded-xl border text-xs transition-all space-y-2.5 ${
                            isLive
                              ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs'
                              : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-950 font-mono">v{dep.versionNumber}</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                                  isLive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isUnpublished
                                    ? 'bg-zinc-100 text-zinc-600'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                <span>{isLive ? 'Live' : dep.status}</span>
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {new Date(dep.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          <p className="text-zinc-600 text-[11px]">
                            {dep.description || `Version ${dep.versionNumber} build`}
                          </p>

                          {/* Deployment URL row */}
                          {dep.deploymentUrl && (
                            <div className="p-2 rounded-lg bg-white border border-zinc-200 flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-zinc-700 truncate max-w-[200px]">
                                {dep.deploymentUrl}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    const full = dep.deploymentUrl.startsWith('http')
                                      ? dep.deploymentUrl
                                      : `${window.location.origin}${dep.deploymentUrl}`;
                                    navigator.clipboard?.writeText(full);
                                    setCopiedLink(true);
                                    setTimeout(() => setCopiedLink(false), 2000);
                                  }}
                                  className="p-1 rounded text-zinc-500 hover:text-zinc-900 cursor-pointer"
                                  title="Copy URL"
                                >
                                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                                <a
                                  href={dep.deploymentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded text-zinc-500 hover:text-zinc-900"
                                  title="Open in new window"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Action controls */}
                          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-400 capitalize">
                              {dep.provider === 'remix_managed' ? 'Remix Edge' : dep.provider}
                            </span>

                            <div className="flex items-center gap-2">
                              {isLive ? (
                                <button
                                  onClick={() => handleUnpublish(dep.id)}
                                  disabled={actionInProgress === `unpublish_${dep.id}`}
                                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
                                >
                                  {actionInProgress === `unpublish_${dep.id}` ? 'Unpublishing...' : 'Unpublish'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRepublish(dep.versionNumber.toString())}
                                  disabled={actionInProgress === `republish_${dep.versionNumber}`}
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                >
                                  <RotateCw className="w-2.5 h-2.5" />
                                  <span>{actionInProgress === `republish_${dep.versionNumber}` ? 'Republishing...' : 'Republish'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 4. PUBLISHING MODAL */}
      {website && (
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          projectId={projectId}
          website={website}
          versionNumber={version}
          publishedUrl={publishedUrl || undefined}
          isUpdate={!!publishedUrl}
          onOpenDeployments={() => {
            setShowVersionHistory(true);
            setHistoryTab('deployments');
            loadDeployments();
          }}
          onDeploymentSuccess={(newDeploymentUrl) => {
            setPublishedUrl(newDeploymentUrl);
            setDeploymentStatus('ready');
            loadDeployments();
            setEditSuccessMessage('Website successfully published and live on the web!');
            setTimeout(() => setEditSuccessMessage(null), 4000);
          }}
        />
      )}

      {/* 5. GITHUB INTEGRATION MODAL */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => {
          setIsGitHubModalOpen(false);
          loadProjectIntegrations();
        }}
        projectId={projectId}
        projectName={projectName || website?.name || 'Website'}
      />

      {/* 6. CUSTOM DOMAINS MODAL */}
      <CustomDomainsModal
        isOpen={isDomainsModalOpen}
        onClose={() => setIsDomainsModalOpen(false)}
        projectId={projectId}
        projectName={projectName || website?.name || 'Website'}
        publishedUrl={publishedUrl || undefined}
      />
    </div>
  );
};
