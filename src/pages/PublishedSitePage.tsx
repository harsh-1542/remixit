import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../lib/router';
import {
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  X,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

interface PublishedSitePageProps {
  deploymentId: string;
}

export const PublishedSitePage: React.FC<PublishedSitePageProps> = ({ deploymentId }) => {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteData, setSiteData] = useState<any>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    fetch(`/api/public/site/${deploymentId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('This website is not published or has been removed.');
        }
        return res.json();
      })
      .then((data) => {
        setSiteData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load website.');
        setLoading(false);
      });
  }, [deploymentId]);

  const rawSiteUrl = `/sites/${deploymentId}`;
  const absoluteLiveUrl = typeof window !== 'undefined' ? `${window.location.origin}${rawSiteUrl}` : rawSiteUrl;
  const sharePageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Check out "${siteData?.websiteDefinition?.name || 'this website'}" created with Remix:`);
    const url = encodeURIComponent(absoluteLiveUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(absoluteLiveUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-zinc-950 font-sans">Loading published website...</h2>
        <p className="text-xs text-zinc-500 font-mono mt-1">Connecting to Remix Edge...</p>
      </div>
    );
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-950 font-sans">Website Unavailable</h2>
        <p className="text-sm text-zinc-600 max-w-md mt-2">
          {error || 'This website has not been published or has been unpublished by the creator.'}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 transition-colors"
          >
            Explore Remix Showcase
          </Link>
          <Link
            to="/build"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            Build Your Own
          </Link>
        </div>
      </div>
    );
  }

  const websiteName = siteData.websiteDefinition?.name || 'Published Site';

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F12] text-zinc-100">
      {/* 1. TOP REMIX SHOWCASE BAR */}
      <header className="h-14 bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Branding & Site info */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BrandLogo size="sm" />
          </Link>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-white truncate max-w-[160px] sm:max-w-[240px]">
              {websiteName}
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live v{siteData.versionNumber || 1}</span>
            </span>
          </div>
        </div>

        {/* Center: Viewport Switcher */}
        <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Desktop 100%"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Tablet 768px"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Mobile 390px"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Copy Live Link */}
          <button
            onClick={() => handleCopy(absoluteLiveUrl)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy Public URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline font-mono text-[11px]">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {/* QR Code */}
          <button
            onClick={() => setShowQr(!showQr)}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Show QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>

          {/* Social Share Menu */}
          <button
            onClick={handleShareTwitter}
            className="hidden sm:flex p-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Share on X / Twitter"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Direct Raw Site */}
          <a
            href={rawSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Open pure standalone website without Remix bar"
          >
            <span>Open Standalone</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>

          {/* Remix CTA */}
          <Link
            to={`/build?remix_source=${encodeURIComponent(absoluteLiveUrl)}&prompt=${encodeURIComponent(`Remix inspired by ${websiteName}`)}`}
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Remix This Site</span>
          </Link>
        </div>
      </header>

      {/* QR Code Popover */}
      {showQr && (
        <div className="absolute top-16 right-6 z-50 p-4 bg-white text-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
            <span className="text-xs font-bold font-sans">Mobile QR Code</span>
            <button onClick={() => setShowQr(false)} className="text-zinc-400 hover:text-zinc-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-zinc-50 p-3 rounded-xl flex items-center justify-center">
            {/* Simple high-contrast SVG QR-code placeholder pattern */}
            <div className="w-36 h-36 flex flex-col items-center justify-center text-center p-2 border-2 border-dashed border-zinc-300 rounded-lg">
              <QrCode className="w-16 h-16 text-zinc-800 mb-1" />
              <p className="text-[10px] text-zinc-500 font-mono truncate w-full">{absoluteLiveUrl}</p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 text-center">Scan with smartphone camera to view</p>
        </div>
      )}

      {/* 2. IFRAME PREVIEW CONTAINER */}
      <main className="flex-1 w-full bg-[#1A1A1E] flex items-center justify-center overflow-auto p-2 sm:p-4">
        <div
          className={`h-full transition-all duration-300 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 bg-white ${
            viewport === 'desktop'
              ? 'w-full max-w-full'
              : viewport === 'tablet'
              ? 'w-[768px] max-w-full'
              : 'w-[390px] max-w-full'
          }`}
          style={{ minHeight: 'calc(100vh - 5rem)' }}
        >
          <iframe
            src={rawSiteUrl}
            title={websiteName}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 5rem)' }}
          />
        </div>
      </main>
    </div>
  );
};
