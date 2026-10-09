import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Link, useRouter } from '../lib/router';
import { BRAND } from '../config/branding';
import { X } from 'lucide-react';

export const Footer: React.FC = () => {
  const { path, navigate } = useRouter();
  const [modalContent, setModalContent] = useState<{
    title: string;
    text: string;
  } | null>(null);

  const handleNav = (target: string) => {
    if (target.startsWith('#')) {
      if (path !== '/') {
        navigate(`/${target}`);
      } else {
        const el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(target);
    }
  };

  return (
    <>
      <footer className="w-full border-t border-zinc-200/80 bg-[#FAFAF8] py-14 sm:py-16 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
            {/* Brand identity */}
            <div className="max-w-sm">
              <BrandLogo size="lg" />
              <p className="mt-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                {BRAND.tagline}
              </p>
              <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
                Remix is an architectural inspiration and discovery engine for digital designers and engineers.
              </p>
            </div>

            {/* Navigation & Informational links */}
            <div className="flex flex-wrap items-start gap-x-12 gap-y-6 text-sm">
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Navigation
                </span>
                <Link
                  to="/explore"
                  className="text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  Explore
                </Link>
                <button
                  onClick={() => handleNav('#categories')}
                  className="text-left text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Categories
                </button>
                <button
                  onClick={() => handleNav('#how-it-works')}
                  className="text-left text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  How it works
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Platform
                </span>
                <button
                  onClick={() =>
                    setModalContent({
                      title: 'About Remix',
                      text: 'Remix is a curated design discovery platform created to elevate the state of software interfaces. Phase 1 provides an uncompromised inspiration library with high-fidelity archetypes. Future releases introduce intelligent structural decomposition and original codebase generation.',
                    })
                  }
                  className="text-left text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  About
                </button>
                <button
                  onClick={() =>
                    setModalContent({
                      title: 'Privacy Policy',
                      text: 'Remix respects your privacy. In Phase 1, all search queries, filter states, and bookmark preferences are processed locally within your browser session without third-party trackers or telemetry profiling.',
                    })
                  }
                  className="text-left text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Privacy
                </button>
                <button
                  onClick={() =>
                    setModalContent({
                      title: 'Terms of Service',
                      text: 'Remix is an architectural reference index. All mock websites, design systems, and archetypes presented in this gallery are curated for educational reference and creative inspiration. Remix emphasizes creating original work rather than duplicate clones.',
                    })
                  }
                  className="text-left text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Terms
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Zero-Telemetry notice */}
          <div className="mt-12 pt-6 border-t border-zinc-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-3">
            <div>
              &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              Curated for designers, engineers &amp; founders.
            </div>
          </div>
        </div>
      </footer>

      {/* Editorial Content Modal for About / Privacy / Terms */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 border border-zinc-200 shadow-xl">
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
              {modalContent.title}
            </h3>
            <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
              {modalContent.text}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalContent(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
