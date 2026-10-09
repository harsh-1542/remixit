import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { WEBSITES } from '../data/websites';
import { WebsitePreview } from '../components/WebsitePreview';
import { WebsiteCard } from '../components/WebsiteCard';
import { useAuth } from '../lib/auth-context';
import { SignInModal } from '../components/SignInModal';
import {
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  Check,
  Info,
  X,
  Bookmark,
} from 'lucide-react';

interface WebsiteDetailPageProps {
  slug: string;
}

export const WebsiteDetailPage: React.FC<WebsiteDetailPageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { user, token } = useAuth();
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const website = WEBSITES.find((w) => w.slug === slug) || WEBSITES[0];

  useEffect(() => {
    if (token) {
      fetch(`/api/saved-websites/check/${website.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setIsSaved(!!data.isSaved))
        .catch(() => {});
    }
  }, [token, website.id]);

  const handleToggleBookmark = async () => {
    if (!user || !token) {
      setSignInOpen(true);
      return;
    }

    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/saved-websites/${website.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setIsSaved(false);
      } else {
        const res = await fetch('/api/saved-websites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ websiteId: website.id }),
        });
        if (res.ok) setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Find 3 related websites (same category or style, excluding current)
  const relatedWebsites = WEBSITES.filter(
    (w) =>
      w.id !== website.id &&
      (w.category === website.category || w.style === website.style)
  ).slice(0, 3);

  // If not enough related by category/style, pad with others
  const fallbackRelated =
    relatedWebsites.length < 3
      ? [
          ...relatedWebsites,
          ...WEBSITES.filter(
            (w) => w.id !== website.id && !relatedWebsites.includes(w)
          ),
        ].slice(0, 3)
      : relatedWebsites;

  const handleCopyColor = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const viewportWidthClass = {
    desktop: 'w-full',
    tablet: 'max-w-2xl mx-auto',
    mobile: 'max-w-sm mx-auto',
  }[viewportMode];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/explore')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explore</span>
        </button>

        {/* Viewport size switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200/80">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`p-1.5 rounded-md text-xs transition-all ${
              viewportMode === 'desktop'
                ? 'bg-white text-zinc-950 shadow-2xs font-medium'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            aria-label="Desktop preview"
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`p-1.5 rounded-md text-xs transition-all ${
              viewportMode === 'tablet'
                ? 'bg-white text-zinc-950 shadow-2xs font-medium'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            aria-label="Tablet preview"
            title="Tablet view"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`p-1.5 rounded-md text-xs transition-all ${
              viewportMode === 'mobile'
                ? 'bg-white text-zinc-950 shadow-2xs font-medium'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            aria-label="Mobile preview"
            title="Mobile view"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Preview Hero Display */}
      <div className="w-full bg-zinc-100/70 p-3 sm:p-6 lg:p-8 rounded-2xl border border-zinc-200/80 mb-10 transition-all">
        <div className={`transition-all duration-300 ${viewportWidthClass}`}>
          <WebsitePreview website={website} variant="detail" />
        </div>
      </div>

      {/* Website Meta & Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pb-16 border-b border-zinc-200/80">
        {/* Left Column: Title, Description, CTAs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
              <span>{website.category}</span>
              <span className="text-zinc-300">·</span>
              <span>{website.style} Style</span>
              <span className="text-zinc-300">·</span>
              <span>{website.year || 2026}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950">
              {website.name}
            </h1>

            <p className="mt-3 text-base sm:text-lg text-zinc-600 leading-relaxed">
              {website.description}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={() =>
                navigate(`/build?ref=${encodeURIComponent(website.slug)}`)
              }
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-zinc-300" />
              <span>Build Similar</span>
            </button>

            <button
              onClick={handleToggleBookmark}
              disabled={saveLoading}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                isSaved
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
              <span>{isSaved ? 'Saved Reference' : 'Bookmark Reference'}</span>
            </button>

            <button
              onClick={() => setShowDemoModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-all cursor-pointer"
            >
              <span>Visit Reference</span>
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Design Characteristics Breakdown */}
          <div className="mt-4 p-5 rounded-xl bg-white border border-zinc-200/80 flex flex-col gap-4">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              Design Characteristics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-400 font-mono block">Typography</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {website.designHighlights.typography}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block">Grid System</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {website.designHighlights.gridSystem}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block">Layout Flow</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {website.designHighlights.layout}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block">Aesthetic Mood</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {website.designHighlights.vibe}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Palette, Tags, Features, Tech (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Color Palette */}
          <div className="p-5 rounded-xl bg-white border border-zinc-200/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                Color Palette
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">
                Click swatch to copy
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {website.colors.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleCopyColor(hex)}
                  className="group flex flex-col items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                  title={`Copy ${hex}`}
                >
                  <div
                    className="w-full h-12 rounded-lg border border-black/10 shadow-2xs group-hover:scale-105 transition-transform relative flex items-center justify-center"
                    style={{ backgroundColor: hex }}
                  >
                    {copiedColor === hex && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-950">
                    {copiedColor === hex ? 'Copied' : hex}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Features & Technologies (Clean Typography, Zero-Pill Discipline) */}
          <div className="p-5 rounded-xl bg-white border border-zinc-200/80 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                Features &amp; Interactions
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-700">
                {website.features.map((feat, i) => (
                  <React.Fragment key={feat}>
                    {i > 0 && <span className="text-zinc-300">·</span>}
                    <span>{feat}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                Technologies
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-700">
                {website.technologies.map((tech, i) => (
                  <React.Fragment key={tech}>
                    {i > 0 && <span className="text-zinc-300">·</span>}
                    <span>{tech}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
                Index Tags
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-zinc-500">
                {website.tags.map((tag, i) => (
                  <React.Fragment key={tag}>
                    {i > 0 && <span className="text-zinc-300">/</span>}
                    <span>#{tag}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MORE LIKE THIS SECTION */}
      <section className="py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-1">
              Curated Kinship
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
              More like this.
            </h2>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
          >
            Explore all references ↗
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fallbackRelated.map((related) => (
            <WebsiteCard key={related.id} website={related} />
          ))}
        </div>
      </section>

      {/* Fictional Reference Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 border border-zinc-200 shadow-2xl">
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4">
              <Info className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
              Reference unavailable in demo
            </h3>

            <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
              <strong>{website.name}</strong> is a high-fidelity fictional design created specifically for Remix Phase 1 to illustrate architectural possibilities without relying on external third-party servers.
            </p>

            <div className="mt-5 p-3 bg-zinc-50 rounded-xl text-xs text-zinc-500 font-mono">
              STATUS: DEMO REFERENCE ARCHETYPE
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowDemoModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SignInModal
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
        message="Sign in to save design references to your workspace."
      />
    </div>
  );
};
