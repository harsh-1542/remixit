import React, { useState } from 'react';
import { Website } from '../types';
import { WebsitePreview } from './WebsitePreview';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth-context';
import { SignInModal } from './SignInModal';
import { ArrowUpRight, Sparkles, Bookmark } from 'lucide-react';

interface WebsiteCardProps {
  website: Website;
  featuredSpan?: boolean;
}

export const WebsiteCard: React.FC<WebsiteCardProps> = ({
  website,
  featuredSpan = false,
}) => {
  const { navigate } = useRouter();
  const { user, token } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Check initial saved status if token exists
  React.useEffect(() => {
    if (token) {
      fetch(`/api/saved-websites/check/${website.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setIsSaved(!!data.isSaved))
        .catch(() => {});
    }
  }, [token, website.id]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    navigate(`/website/${website.slug}`);
  };

  const handleBuildSimilar = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/build?ref=${encodeURIComponent(website.slug)}`);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/website/${website.slug}`);
  };

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <>
      <article
        onClick={handleCardClick}
        className={`group cursor-pointer flex flex-col justify-between rounded-xl p-3 sm:p-3.5 transition-all duration-300 border border-zinc-200/70 bg-white/70 hover:bg-white hover:border-zinc-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] ${
          featuredSpan ? 'lg:col-span-2' : ''
        }`}
      >
        {/* Top Preview Wrapper */}
        <div className="relative overflow-hidden rounded-lg bg-zinc-100">
          <div className="transition-transform duration-500 ease-out group-hover:scale-[1.015]">
            <WebsitePreview website={website} variant="card" />
          </div>

          {/* Quick Bookmark overlay button */}
          <button
            onClick={handleToggleBookmark}
            disabled={saveLoading}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
              isSaved
                ? 'bg-zinc-950 text-white shadow-xs opacity-100'
                : 'bg-white/80 hover:bg-white text-zinc-600 hover:text-zinc-950 opacity-0 group-hover:opacity-100 shadow-2xs'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save reference'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Card Content Details */}
        <div className="mt-3.5 flex flex-col gap-2">
          {/* Name and Category · Style */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-zinc-950 tracking-tight group-hover:text-zinc-900 transition-colors">
                {website.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5 font-normal">
                <span>{website.category}</span>
                <span className="text-zinc-300" aria-hidden="true">·</span>
                <span>{website.style}</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-400 group-hover:text-zinc-600 transition-colors pt-0.5 shrink-0">
              {website.year || 2026}
            </div>
          </div>

          {/* Short description */}
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {website.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-100">
            {website.tags.slice(0, 3).map((tag, idx) => (
              <React.Fragment key={tag}>
                {idx > 0 && <span className="text-zinc-300">/</span>}
                <span className="text-zinc-600 hover:text-zinc-900 transition-colors">#{tag}</span>
              </React.Fragment>
            ))}
            {website.tags.length > 3 && (
              <span className="text-zinc-400 text-[10px]">+{website.tags.length - 3}</span>
            )}
          </div>

          {/* Actions Bar */}
          <div className="pt-2 mt-1 flex items-center justify-between gap-2 border-t border-zinc-100">
            <button
              onClick={handleBuildSimilar}
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>Build Similar</span>
            </button>

            <button
              onClick={handleView}
              type="button"
              className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-md text-xs font-medium text-zinc-700 bg-zinc-100/80 hover:bg-zinc-200/80 hover:text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
            >
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>
      </article>

      <SignInModal
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
        message="Sign in to save design references to your workspace."
      />
    </>
  );
};
