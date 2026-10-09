import React from 'react';
import { useRouter } from '../lib/router';
import { BRAND } from '../config/branding';
import { Sparkles, ArrowRight } from 'lucide-react';

export const CTASection: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 border-t border-zinc-200/80">
      <div className="relative rounded-3xl bg-zinc-950 text-white p-8 sm:p-14 lg:p-20 overflow-hidden shadow-xl">
        {/* Subtle geometric background line */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-4">
            Next Project
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            {BRAND.ctaHeadline}
          </h2>

          <p className="text-base sm:text-lg text-zinc-300 mt-4 max-w-lg leading-relaxed">
            {BRAND.ctaSubtext}
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={() => navigate('/explore')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-100 active:bg-zinc-200 transition-all cursor-pointer shadow-sm"
            >
              <span>Explore the Library</span>
              <ArrowRight className="w-4 h-4 text-zinc-800" />
            </button>

            <button
              onClick={() => navigate('/build')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-700/80 text-white hover:bg-zinc-800 active:bg-zinc-900 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span>Build from a URL</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
