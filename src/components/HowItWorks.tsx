import React from 'react';
import { Compass, BookmarkCheck, Sparkles, Code2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Discover',
      description: 'Explore a curated library of exceptional websites.',
      detail:
        'Browse high-fidelity design archetypes filtered by industry, layout style, and interaction features.',
      icon: Compass,
      status: 'Live in Phase 1',
    },
    {
      num: '02',
      title: 'Choose a reference',
      description: 'Find a design, layout, or interaction you want to build from.',
      detail:
        'Inspect architectural grids, typographic scales, and color systems that define the site’s character.',
      icon: BookmarkCheck,
      status: 'Live in Phase 1',
    },
    {
      num: '03',
      title: 'Remix',
      description: 'Use the reference as inspiration for an original design.',
      detail:
        'Extract core spatial rhythms and motifs without cloning, preserving originality while elevating quality.',
      icon: Sparkles,
      status: 'Roadmap (Phase 2)',
    },
    {
      num: '04',
      title: 'Build',
      description: 'Customize and eventually generate production-ready code.',
      detail:
        'Upcoming AI synthesis will transform referenced structures into clean React and Tailwind codebases.',
      icon: Code2,
      status: 'Roadmap (Phase 2)',
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-zinc-200/80">
      <div className="max-w-2xl mb-12 sm:mb-16">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">
          Methodology
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 font-sans">
          How Remix works.
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 mt-3 leading-relaxed">
          From finding inspiring digital craft to turning structural references into original, production-ready interfaces.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
        {steps.map((step) => {
          const IconComponent = step.icon;
          return (
            <div
              key={step.num}
              className="relative p-6 rounded-xl border border-zinc-200/80 bg-white/50 hover:bg-white hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xl font-bold font-mono text-zinc-950">
                    {step.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800">
                    <IconComponent className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-950 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm font-medium text-zinc-800 mt-2 leading-snug">
                  {step.description}
                </p>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {step.detail}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Phase</span>
                <span
                  className={
                    step.status.includes('Live')
                      ? 'text-zinc-900 font-semibold'
                      : 'text-zinc-500'
                  }
                >
                  {step.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
