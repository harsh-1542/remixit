import React from 'react';
import { Website } from '../types';

interface WebsitePreviewProps {
  website: Website;
  className?: string;
  variant?: 'card' | 'hero' | 'detail';
  interactive?: boolean;
}

export const WebsitePreview: React.FC<WebsitePreviewProps> = ({
  website,
  className = '',
  variant = 'card',
}) => {
  const isDetail = variant === 'detail';
  const isHero = variant === 'hero';

  const renderContent = () => {
    switch (website.previewType) {
      case 'minimal-saas':
        return (
          <div className="h-full w-full bg-[#FFFFFF] text-zinc-900 p-4 sm:p-5 flex flex-col justify-between font-sans select-none overflow-hidden relative">
            {/* Mini Nav */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-zinc-900" />
                <span className="text-[11px] font-semibold tracking-tight text-zinc-900">{website.name}</span>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-400">
                <span>Product</span>
                <span>Changelog</span>
                <span>Docs</span>
              </div>
              <div className="text-[9px] font-medium bg-zinc-900 text-white px-2 py-0.5 rounded-sm">
                Get Started
              </div>
            </div>

            {/* Hero Section */}
            <div className="my-auto py-2">
              <div className="inline-flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>v2.4 Released · Systems Architecture</span>
              </div>
              <h4 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-zinc-950 leading-tight">
                Design infrastructure for precision software.
              </h4>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[280px] line-clamp-2">
                Unify components, design tokens, and engineering states with zero sync drift.
              </p>
            </div>

            {/* Product UI Mockup */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-md p-2.5 mt-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60 text-[9px] text-zinc-400 font-mono">
                <span className="text-zinc-700 font-medium">tokens.config.ts</span>
                <span>Live State: Synchronized</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded border border-zinc-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="text-[9px] text-zinc-400 block font-mono">Radius Scale</span>
                  <span className="text-[11px] font-semibold text-zinc-900 font-mono mt-0.5 block">0px · 2px · 6px</span>
                </div>
                <div className="bg-white p-2 rounded border border-zinc-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="text-[9px] text-zinc-400 block font-mono">Type Scale</span>
                  <span className="text-[11px] font-semibold text-zinc-900 font-mono mt-0.5 block">1.250 Major</span>
                </div>
                <div className="bg-white p-2 rounded border border-zinc-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="text-[9px] text-zinc-400 block font-mono">Latency</span>
                  <span className="text-[11px] font-semibold text-emerald-600 font-mono mt-0.5 block">&lt; 14ms</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'dark-ai':
        return (
          <div className="h-full w-full bg-[#09090B] text-zinc-100 p-4 sm:p-5 flex flex-col justify-between font-sans select-none overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-medium tracking-tight text-white font-mono">{website.name.toUpperCase()}</span>
              </div>
              <div className="text-[9px] font-mono text-zinc-400 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>ACTIVE CLUSTER</span>
              </div>
            </div>

            {/* Neural Matrix Display */}
            <div className="my-auto py-2 relative z-10">
              <div className="text-[9px] font-mono text-emerald-400 tracking-wider mb-1">
                AUTONOMOUS INFERENCE CLUSTER
              </div>
              <h4 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-tight font-sans">
                Real-time neural routing at planetary scale.
              </h4>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-[280px] line-clamp-2">
                Automated token dispatch across distributed edge clusters with zero fallback lag.
              </p>
            </div>

            {/* Telemetry Visualizer */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-md p-2.5 relative z-10">
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mb-2">
                <span>INFERENCE VELOCITY</span>
                <span className="text-emerald-400 font-semibold">99.98% OPTIMAL</span>
              </div>
              <div className="flex items-end gap-1.5 h-10 w-full pt-1">
                {[35, 60, 45, 80, 65, 90, 75, 95, 60, 85, 92, 100].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-emerald-950 to-emerald-400/80 rounded-xs"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'editorial-architecture':
        return (
          <div className="h-full w-full bg-[#F5F5F0] text-stone-900 p-4 sm:p-5 flex flex-col justify-between font-serif select-none overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-300 pb-2">
              <span className="text-[11px] font-medium tracking-widest uppercase font-sans text-stone-600">
                {website.name} · Monograph
              </span>
              <span className="text-[10px] italic font-serif text-stone-500">Edition MMXXVI</span>
            </div>

            {/* Asymmetrical Layout */}
            <div className="my-auto grid grid-cols-12 gap-3 items-center py-2">
              <div className="col-span-7">
                <span className="text-[9px] font-sans uppercase tracking-widest text-stone-500 block mb-1">
                  Spatial Study 08
                </span>
                <h4 className="text-base sm:text-lg lg:text-xl font-normal leading-tight text-stone-900">
                  Mass Timber &amp; Monolithic Stone.
                </h4>
                <p className="text-[10px] font-sans text-stone-600 mt-1.5 leading-relaxed line-clamp-2">
                  Quiet interventions grounded in alpine topography and tactile material silence.
                </p>
              </div>
              <div className="col-span-5 h-20 bg-stone-300/80 rounded-sm relative overflow-hidden border border-stone-400/40">
                <div className="absolute inset-0 bg-gradient-to-br from-stone-400/30 to-stone-600/40" />
                <div className="absolute bottom-1 right-1 text-[8px] font-mono text-stone-700 bg-white/70 px-1 py-0.5 rounded">
                  46.5° N
                </div>
              </div>
            </div>

            {/* Footer index */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-300 text-[9px] font-sans text-stone-500">
              <span>01 / Alpine Pavilion</span>
              <span>02 / Stone Vault</span>
              <span>03 / Lakehouse</span>
            </div>
          </div>
        );

      case 'luxury-agency':
        return (
          <div className="h-full w-full bg-[#141413] text-[#EFECE6] p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden relative">
            {/* Agency Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-semibold tracking-tighter uppercase font-sans text-white">
                {website.name}
              </span>
              <span className="text-[9px] font-mono text-amber-500/90 tracking-widest">
                PARIS / TOKYO
              </span>
            </div>

            {/* Editorial Showcase */}
            <div className="my-auto py-2">
              <div className="text-[9px] font-sans tracking-widest uppercase text-zinc-400 mb-1">
                SELECTED WORKS 2024–2026
              </div>
              <h4 className="text-base sm:text-lg lg:text-2xl font-serif italic text-amber-100/90 leading-tight">
                Art direction for contemporary culture.
              </h4>
              <p className="text-[10px] text-zinc-400 mt-1 max-w-[290px] font-sans line-clamp-2">
                Sculpting singular digital experiences for global luxury houses and independent visionaries.
              </p>
            </div>

            {/* Project List Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80">
              <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-sm">
                <div className="h-7 bg-zinc-800/80 mb-1 rounded-xs" />
                <span className="text-[8px] font-sans block text-zinc-300 truncate">Maison Verre</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-sm">
                <div className="h-7 bg-zinc-800/80 mb-1 rounded-xs" />
                <span className="text-[8px] font-sans block text-zinc-300 truncate">Solstice Edition</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-sm">
                <div className="h-7 bg-zinc-800/80 mb-1 rounded-xs" />
                <span className="text-[8px] font-sans block text-zinc-300 truncate">Aura Spatial</span>
              </div>
            </div>
          </div>
        );

      case 'modern-finance':
        return (
          <div className="h-full w-full bg-[#0F172A] text-slate-100 p-4 sm:p-5 flex flex-col justify-between font-sans select-none overflow-hidden relative">
            {/* Finance Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-sky-400 rounded-xs" />
                <span className="text-[11px] font-semibold text-white tracking-tight">{website.name}</span>
              </div>
              <span className="text-[9px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                SETTLEMENT: 100%
              </span>
            </div>

            {/* Metrics Bar */}
            <div className="my-auto py-2">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-0.5">
                Institutional Liquidity Ledger
              </span>
              <h4 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white leading-tight">
                Programmatic cross-border capital rails.
              </h4>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[8px]">DAILY VOLUME</span>
                  <span className="text-white font-semibold">$1.42B USD</span>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                  <span className="text-slate-500 block text-[8px]">FINALITY</span>
                  <span className="text-emerald-400 font-semibold">180ms</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-slate-900/80 border border-slate-800 rounded p-2">
              <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-1">
                <span>TREASURY YIELD SPREAD</span>
                <span className="text-sky-300 font-semibold">+4.82%</span>
              </div>
              <div className="h-8 flex items-end gap-1 w-full">
                {[40, 52, 48, 65, 58, 72, 80, 75, 88, 92].map((val, idx) => (
                  <div key={idx} className="flex-1 bg-sky-500/80 rounded-xs" style={{ height: `${val}%` }} />
                ))}
              </div>
            </div>
          </div>
        );

      case 'bento-portfolio':
        return (
          <div className="h-full w-full bg-[#18181B] text-zinc-100 p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-[11px] font-mono text-zinc-300 tracking-tight font-semibold">
                {website.name.toUpperCase()} / ARCHIVE
              </span>
              <span className="text-[9px] font-mono text-zinc-500">INDEX: 09</span>
            </div>

            <div className="my-auto grid grid-cols-3 gap-2 py-2">
              <div className="col-span-2 bg-zinc-900/90 border border-zinc-800 p-2.5 rounded">
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Featured Specimen</span>
                <h4 className="text-xs sm:text-sm font-semibold text-white mt-1 leading-tight">
                  Tactile optical instruments and machined brass dials.
                </h4>
              </div>
              <div className="col-span-1 bg-zinc-900/90 border border-zinc-800 p-2 rounded flex flex-col justify-between">
                <div className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                </div>
                <span className="text-[8px] font-mono text-zinc-400">ROTARY 01</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2">
              <span>INDUSTRIAL DESIGN</span>
              <span>COPENHAGEN</span>
            </div>
          </div>
        );

      case 'neo-brutalist':
        return (
          <div className="h-full w-full bg-black text-white p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden relative border-t-2 border-red-600">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800 text-[10px] font-mono">
              <span className="bg-red-600 text-white px-1.5 py-0.2 font-bold">{website.name}</span>
              <span className="text-zinc-500">TYPE SPECIMENS</span>
            </div>

            <div className="my-auto py-2">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tighter leading-none text-white uppercase">
                RADICAL GLYPHS
              </div>
              <p className="text-[10px] font-mono text-zinc-400 mt-2 leading-relaxed">
                High-density optical weights engineered for editorial confrontation.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px] border-t border-zinc-800 pt-2 text-zinc-400">
              <div className="border border-zinc-800 py-1">Aa</div>
              <div className="border border-zinc-800 py-1">Bb</div>
              <div className="border border-zinc-800 py-1">Cc</div>
              <div className="border border-red-600/60 text-red-500 py-1 font-bold">Zz</div>
            </div>
          </div>
        );

      case 'clean-health':
        return (
          <div className="h-full w-full bg-[#FAFAFA] text-zinc-900 p-4 sm:p-5 flex flex-col justify-between select-none overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span className="text-[11px] font-bold text-zinc-900">{website.name}</span>
              </div>
              <span className="text-[9px] text-zinc-400 font-mono">CLINICAL OS</span>
            </div>

            <div className="my-auto py-2">
              <span className="text-[9px] font-mono text-cyan-600 uppercase font-semibold">
                Longitudinal Metabolic Telemetry
              </span>
              <h4 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight leading-tight mt-0.5">
                Deciphering biological vitality.
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                Continuous cellular analysis synthesized into preventative lifestyle protocols.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/70 rounded p-2 flex items-center justify-between">
              <div>
                <span className="text-[8px] text-zinc-400 block font-mono">CELLULAR BIOMARKER</span>
                <span className="text-xs font-bold text-zinc-900 font-mono">98.4 / 100</span>
              </div>
              <div className="h-5 w-16 bg-cyan-100 rounded flex items-center px-1">
                <div className="h-1.5 w-full bg-cyan-500 rounded-full" />
              </div>
            </div>
          </div>
        );

      case 'culinary-craft':
        return (
          <div className="h-full w-full bg-[#F7F5F0] text-stone-900 p-4 sm:p-5 flex flex-col justify-between font-serif select-none overflow-hidden">
            <div className="text-center border-b border-stone-300 pb-1.5">
              <span className="text-[11px] uppercase tracking-widest font-sans font-medium text-stone-700">
                {website.name}
              </span>
              <span className="block text-[8px] italic text-stone-500 font-serif">Seasonal Residency · 2026</span>
            </div>

            <div className="my-auto py-2 text-center">
              <h4 className="text-base sm:text-lg italic font-normal text-stone-900 leading-tight">
                Heritage Grains &amp; Fire.
              </h4>
              <p className="text-[10px] font-sans text-stone-600 mt-1 max-w-[260px] mx-auto line-clamp-2">
                A seven-course agrarian exploration celebrating soil provenance and wild harvest.
              </p>
            </div>

            <div className="border-t border-stone-300 pt-2 flex justify-between text-[9px] font-sans text-stone-500 uppercase tracking-wider">
              <span>Tasting Menu</span>
              <span>Reserve Table</span>
            </div>
          </div>
        );

      case 'swiss-studio':
      default:
        return (
          <div className="h-full w-full bg-[#F8F9FA] text-zinc-950 p-4 sm:p-5 flex flex-col justify-between font-sans select-none overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-[11px] font-extrabold tracking-tight uppercase">
                {website.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-400">CH-8001 ZÜRICH</span>
            </div>

            <div className="my-auto py-2">
              <span className="text-[9px] font-mono text-rose-600 uppercase font-semibold">
                INTERNATIONAL SYSTEM
              </span>
              <h4 className="text-base sm:text-lg lg:text-xl font-bold tracking-tighter text-zinc-950 leading-tight">
                Objective typography &amp; modular grid balance.
              </h4>
              <p className="text-[10px] text-zinc-600 mt-1 line-clamp-2">
                Pure rational clarity for sovereign research institutes and publications.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-zinc-200 pt-2 text-[9px] font-mono text-zinc-500">
              <div>01 / GRID</div>
              <div>02 / TYPE</div>
              <div>03 / RATIO</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative w-full rounded-lg overflow-hidden border border-zinc-200/80 bg-zinc-100 flex flex-col transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] group-hover:border-zinc-300 ${
        isDetail
          ? 'aspect-[16/10] sm:aspect-[16/9]'
          : isHero
          ? 'aspect-[16/11]'
          : 'aspect-[16/10]'
      } ${className}`}
    >
      {/* Browser Chrome Header */}
      <div className="h-6 sm:h-7 bg-zinc-100/90 border-b border-zinc-200/80 px-2.5 sm:px-3 flex items-center justify-between select-none shrink-0 backdrop-blur-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-300/80" />
          <div className="w-2 h-2 rounded-full bg-zinc-300/80" />
          <div className="w-2 h-2 rounded-full bg-zinc-300/80" />
        </div>
        <div className="text-[9px] sm:text-[10px] font-mono text-zinc-500 truncate max-w-[140px] sm:max-w-[200px]">
          {website.slug}.remix.design
        </div>
        <div className="w-3 text-right text-zinc-400 text-[9px] font-mono">
          ↗
        </div>
      </div>

      {/* Viewport Content */}
      <div className="relative flex-1 w-full overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};
