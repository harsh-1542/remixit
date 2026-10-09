import React from 'react';
import { useRouter } from '../lib/router';
import { BRAND } from '../config/branding';
import { ReferenceInput } from '../components/ReferenceInput';
import { HeroVisual } from '../components/HeroVisual';
import { WebsiteGrid } from '../components/WebsiteGrid';
import { CategoryGrid } from '../components/CategoryGrid';
import { HowItWorks } from '../components/HowItWorks';
import { CTASection } from '../components/CTASection';
import { WEBSITES } from '../data/websites';
import { ArrowRight, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();

  // Featured 6 websites for the featured section
  const featuredWebsites = WEBSITES.filter((w) => w.featured).slice(0, 6);

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative w-full pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Eyebrow kicker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-[11px] font-mono text-zinc-600 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
            <span>PHASE 1 · INSPIRATION &amp; DISCOVERY ENGINE</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-950 font-sans max-w-4xl leading-[1.08]">
            {BRAND.heroHeadline}
          </h1>

          {/* Hero Supporting Text */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-zinc-600 max-w-2xl leading-relaxed font-normal">
            {BRAND.heroSubheadline}
          </p>

          {/* Hero Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/explore')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all cursor-pointer shadow-sm"
            >
              <span>Explore Websites</span>
              <ArrowRight className="w-4 h-4 text-zinc-400" />
            </button>

            <button
              onClick={() => navigate('/build')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200/90 hover:bg-zinc-200/70 active:bg-zinc-200 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-zinc-500" />
              <span>Build from a Reference</span>
            </button>
          </div>

          {/* Prominent URL Reference Input */}
          <div className="w-full mt-10">
            <ReferenceInput variant="hero" />
          </div>

          {/* Hero Visual: Editorial Layered Website Showcase */}
          <HeroVisual />
        </div>
      </section>

      {/* FEATURED SECTION */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-zinc-200/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">
              Curated Selection
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 font-sans">
              Websites worth remixing.
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 mt-2 max-w-xl leading-relaxed">
              A curated collection of interfaces, layouts, and ideas worth exploring.
            </p>
          </div>

          <button
            onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-700 hover:text-zinc-950 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Browse all 15 references</span>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* 6 Featured Cards */}
        <WebsiteGrid websites={featuredWebsites} allowFeaturedSpans={true} />
      </section>

      {/* CATEGORY EXPLORATION SECTION */}
      <CategoryGrid />

      {/* HOW IT WORKS (4-STEP EDITORIAL) */}
      <HowItWorks />

      {/* FINAL CTA */}
      <CTASection />
    </div>
  );
};
