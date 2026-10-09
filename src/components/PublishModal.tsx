import React, { useState, useEffect } from 'react';
import { WebsiteDefinition } from '../types/website-definition';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth-context';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  website: WebsiteDefinition;
  versionNumber: number;
  publishedUrl?: string;
  isUpdate?: boolean;
  onDeploymentSuccess?: (newDeploymentUrl: string) => void;
  onOpenDeployments?: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  projectId,
  website,
  versionNumber,
  publishedUrl: initialPublishedUrl,
  isUpdate = false,
  onDeploymentSuccess,
  onOpenDeployments,
}) => {
  const { navigate } = useRouter();
  const { token } = useAuth();

  // Step state: 'confirm' | 'deploying' | 'success' | 'error'
  const [step, setStep] = useState<'confirm' | 'deploying' | 'success' | 'error'>('confirm');
  const [provider, setProvider] = useState<'remix_managed' | 'vercel'>('remix_managed');
  const [description, setDescription] = useState(
    isUpdate ? `Update to Version ${versionNumber}` : `Initial publication of ${website.name}`
  );

  // Deployment progress
  const [jobId, setJobId] = useState<string | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('Initializing deployment');
  const [deploymentUrl, setDeploymentUrl] = useState<string>(initialPublishedUrl || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setProgress(0);
      setErrorMessage(null);
      setCopied(false);
      setDescription(
        isUpdate ? `Update to Version ${versionNumber}` : `Initial publication of ${website.name}`
      );
    }
  }, [isOpen, isUpdate, versionNumber, website.name]);

  if (!isOpen) return null;

  const handleStartPublish = async () => {
    setStep('deploying');
    setProgress(10);
    setCurrentStage('Validating project & version');
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/deployments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || localStorage.getItem('remix_auth_token')}`,
        },
        body: JSON.stringify({
          provider,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start deployment.');
      }

      setDeploymentId(data.deploymentId);
      setJobId(data.jobId);
      pollDeploymentStatus(data.deploymentId);
    } catch (err: any) {
      setStep('error');
      setErrorMessage(err.message || 'Deployment could not be initiated.');
    }
  };

  const pollDeploymentStatus = (depId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/deployments/${depId}/status`);
        if (!res.ok) throw new Error('Status poll failed');
        const data = await res.json();

        setProgress(data.progress || 20);
        if (data.currentStage) setCurrentStage(data.currentStage);

        if (data.status === 'ready') {
          clearInterval(interval);
          setDeploymentUrl(data.deploymentUrl);
          setStep('success');
          onDeploymentSuccess?.(data.deploymentUrl);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setStep('error');
          setErrorMessage(data.error || 'Deployment build failed.');
        }
      } catch (err: any) {
        clearInterval(interval);
        setStep('error');
        setErrorMessage(err.message || 'Error communicating with deployment server.');
      }
    }, 800);
  };

  const handleCopyUrl = () => {
    if (!deploymentUrl) return;
    const fullUrl = deploymentUrl.startsWith('http')
      ? deploymentUrl
      : `${window.location.origin}${deploymentUrl}`;

    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisitSite = () => {
    if (!deploymentUrl) return;
    const fullUrl = deploymentUrl.startsWith('http')
      ? deploymentUrl
      : `${window.location.origin}${deploymentUrl}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-950 font-sans">
                {step === 'success'
                  ? 'Website Published'
                  : step === 'deploying'
                  ? 'Publishing Website'
                  : isUpdate
                  ? 'Publish Website Updates'
                  : 'Publish Website'}
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                Project Version: v{versionNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={step === 'deploying'}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: CONFIRMATION DIALOG */}
        {step === 'confirm' && (
          <div className="p-6 space-y-5">
            {/* Visual thumbnail summary */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm text-zinc-900">{website.name}</p>
                <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                  {website.sections?.length || 4} sections · {website.theme.mode} theme
                </p>
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  Ready to deploy as Version {versionNumber}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs"
                style={{ backgroundColor: website.theme.accentColor }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Hosting Provider Selection */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-2">
                Deployment Target
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider('remix_managed')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    provider === 'remix_managed'
                      ? 'border-zinc-950 bg-zinc-900 text-white shadow-2xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Remix Edge</span>
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      Instant
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${provider === 'remix_managed' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    Native edge deployment with zero configuration.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvider('vercel')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    provider === 'vercel'
                      ? 'border-zinc-950 bg-zinc-900 text-white shadow-2xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Vercel</span>
                    <Server className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  <p className={`text-[11px] mt-1 ${provider === 'vercel' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    Deploy to Vercel cloud with global edge CDN.
                  </p>
                </button>
              </div>
            </div>

            {/* Optional Release Note */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1.5">
                Release Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Added pricing tier and updated accent color"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
              />
            </div>

            {/* Public Visibility Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Public Visibility Notice</span>
                <span className="text-[11px] text-blue-800 leading-relaxed block mt-0.5">
                  Publishing makes this version accessible to anyone with the public URL. Private notes, internal prompts, and edit histories are never exposed.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartPublish}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <span>{isUpdate ? 'Publish Updates Now' : 'Publish Website Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LIVE DEPLOYMENT PROGRESS */}
        {step === 'deploying' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto shadow-inner">
              <RefreshCw className="w-6 h-6 animate-spin text-zinc-950" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-zinc-950 font-sans">
                {currentStage}
              </h4>
              <p className="text-xs text-zinc-500">
                Packaging validated React components and compiling production bundle...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-950 h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>Deployment in progress</span>
                <span>{progress}%</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl text-[11px] font-mono text-zinc-500 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Zero-arbitrary script sandbox enforced</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Immutable version v{versionNumber} locked</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DEPLOYMENT SUCCESS SCREEN */}
        {step === 'success' && (
          <div className="p-7 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-2xl font-extrabold text-zinc-950 tracking-tight font-sans">
                Your website is live.
              </h4>
              <p className="text-xs text-zinc-500">
                Version {versionNumber} is published and publicly accessible across desktop, tablet, and mobile.
              </p>
            </div>

            {/* Public Link Box */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 space-y-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                Public Website Link
              </span>
              <div className="flex items-center justify-between gap-2 bg-white border border-zinc-200 rounded-lg p-2 pl-3">
                <span className="font-mono text-xs text-zinc-900 truncate">
                  {deploymentUrl.startsWith('http')
                    ? deploymentUrl
                    : `${window.location.origin}${deploymentUrl}`}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={handleVisitSite}
                className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Visit Live Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                {onOpenDeployments ? (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDeployments();
                    }}
                    className="text-zinc-600 hover:text-zinc-950 font-medium underline underline-offset-4 cursor-pointer"
                  >
                    View Deployments History
                  </button>
                ) : (
                  <span />
                )}
                <button
                  onClick={onClose}
                  className="text-zinc-600 hover:text-zinc-950 font-medium cursor-pointer"
                >
                  Back to Editor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ERROR STATE */}
        {step === 'error' && (
          <div className="p-7 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-zinc-950 font-sans">
                Deployment Failed
              </h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {errorMessage || 'An error occurred during build or upload. Your project source code is intact.'}
              </p>
            </div>

            {initialPublishedUrl && (
              <div className="p-3 bg-zinc-50 rounded-xl text-xs text-zinc-600 text-left">
                <strong>Previous site still available:</strong> Your previous live website was not affected and remains active.
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-100"
              >
                Close
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
