import React, { useState } from 'react';
import { WEBSITES } from '../data/websites';
import { WebsitePreview } from './WebsitePreview';
import { useRouter } from '../lib/router';
import { Sparkles, ArrowRight } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  const { navigate } = useRouter();
  const [activePreviewId, setActivePreviewId] = useState<string>('forma');

  // Select 5 varied fictional sites for the hero showcase
  const previewSites = [
    WEBSITES.find((w) => w.id === 'forma')!, // minimal SaaS
    WEBSITES.find((w) => w.id === 'meridian')!, // editorial architecture
    WEBSITES.find((w) => w.id === 'orbit')!, // dark AI
    WEBSITES.find((w) => w.id === 'atelier')!, // luxury agency
    WEBSITES.find((w) => w.id === 'vertex')!, // modern finance
  ].filter(Boolean);

  const activeSite = previewSites.find((w) => w.id === activePreviewId) || previewSites[0];

  return (
    <div className="relative w-full max-w-7xl mx-auto mt-10 lg:mt-14 select-none">
      {/* Editorial gallery header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-zinc-200/80 gap-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-zinc-900" />
          <span className="font-semibold text-zinc-900">CURATED REFERENCES</span>
          <span className="text-zinc-300">/</span>
          <span>5 ARCHITECTURAL ARCHETYPES</span>
        </div>

        {/* Tab switcher for direct focus */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {previewSites.map((site) => (
            <button
              key={site.id}
              onClick={() => setActivePreviewId(site.id)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium shrink-0 cursor-pointer ${
                activePreviewId === site.id
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {site.name} · {site.style}
            </button>
          ))}
        </div>
      </div>

      {/* Layered Showcase Canvas */}
      <div className="relative min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] rounded-2xl bg-gradient-to-b from-zinc-100/70 to-zinc-200/40 border border-zinc-200/80 p-3 sm:p-6 lg:p-8 flex items-center justify-center overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Desktop Cascading Editorial Composition */}
        <div className="hidden lg:grid grid-cols-12 gap-5 w-full items-center relative z-10">
          {/* Main Primary Stage (Takes 7 cols) */}
          <div className="col-span-7 transition-all duration-500 ease-out">
            <div
              onClick={() => navigate(`/website/${activeSite.slug}`)}
              className="cursor-pointer group relative bg-white p-2.5 rounded-xl border border-zinc-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.12)] transition-all"
            >
              <WebsitePreview website={activeSite} variant="hero" />

              <div className="mt-3 px-1.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-950 text-sm">{activeSite.name}</span>
                    <span className="text-zinc-300">·</span>
                    <span className="text-xs text-zinc-500">{activeSite.category} ({activeSite.style})</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{activeSite.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/build?ref=${encodeURIComponent(activeSite.slug)}`);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3 h-3 text-zinc-300" />
                    <span>Remix This</span>
                  </button>
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-900 flex items-center gap-0.5 transition-colors">
                    Explore <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Stack (Takes 5 cols, showing 2 staggered companions) */}
          <div className="col-span-5 flex flex-col gap-4">
            {previewSites
              .filter((site) => site.id !== activePreviewId)
              .slice(0, 2)
              .map((companion) => (
                <div
                  key={companion.id}
                  onClick={() => setActivePreviewId(companion.id)}
                  className="group cursor-pointer bg-white/90 p-2.5 rounded-xl border border-zinc-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-zinc-300 hover:bg-white hover:scale-[1.01] transition-all"
                >
                  <div className="h-32 sm:h-36 overflow-hidden rounded-lg">
                    <WebsitePreview website={companion} variant="card" />
                  </div>
                  <div className="mt-2 px-1 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900">{companion.name}</span>
                      <span className="text-zinc-400 ml-1.5 font-mono text-[11px]">{companion.style}</span>
                    </div>
                    <span className="text-zinc-400 font-mono text-[10px] group-hover:text-zinc-900 transition-colors">
                      Switch Focus ↗
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Mobile / Tablet Composition (Swipeable / Stacked View) */}
        <div className="lg:hidden w-full relative z-10">
          <div
            onClick={() => navigate(`/website/${activeSite.slug}`)}
            className="cursor-pointer bg-white p-2.5 sm:p-3 rounded-xl border border-zinc-200 shadow-md"
          >
            <WebsitePreview website={activeSite} variant="hero" />

            <div className="mt-3 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-zinc-900 text-sm">{activeSite.name}</span>
                <span className="text-xs text-zinc-500 ml-2 font-mono">
                  {activeSite.category} · {activeSite.style}
                </span>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{activeSite.description}</p>
              </div>

              <div className="flex items-center gap-2 pt-1 sm:pt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/build?ref=${encodeURIComponent(activeSite.slug)}`);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-900 text-white px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-zinc-300" />
                  <span>Build Similar</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/website/${activeSite.slug}`);
                  }}
                  className="text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Quick thumbnails selector for mobile */}
          <div className="grid grid-cols-5 gap-1.5 mt-3">
            {previewSites.map((site) => (
              <button
                key={site.id}
                onClick={() => setActivePreviewId(site.id)}
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  activePreviewId === site.id
                    ? 'border-zinc-900 bg-white font-semibold text-zinc-950 shadow-xs'
                    : 'border-zinc-200 bg-zinc-100/80 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <span className="block text-[11px] truncate">{site.name}</span>
                <span className="block text-[9px] text-zinc-400 font-mono truncate">{site.style}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
