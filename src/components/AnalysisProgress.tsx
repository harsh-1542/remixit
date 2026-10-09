import React from 'react';
import { Globe, Eye, Layers, Compass, Palette, CheckCircle2 } from 'lucide-react';

interface AnalysisProgressProps {
  status: string;
  progress: number;
  currentStage: string;
  url: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  status,
  progress,
  currentStage,
  url,
}) => {
  const stages = [
    { num: '01', title: 'Connecting to website', icon: Globe, statusKey: 'loading', minProgress: 20 },
    { num: '02', title: 'Rendering page', icon: Eye, statusKey: 'loading', minProgress: 35 },
    { num: '03', title: 'Capturing visual structure', icon: Layers, statusKey: 'capturing', minProgress: 50 },
    { num: '04', title: 'Analyzing layout', icon: Compass, statusKey: 'extracting', minProgress: 70 },
    { num: '05', title: 'Understanding design system', icon: Palette, statusKey: 'analyzing', minProgress: 88 },
    { num: '06', title: 'Preparing results', icon: CheckCircle2, statusKey: 'completed', minProgress: 100 },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>ANALYZING REFERENCE</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
          Deconstructing Design Architecture
        </h2>

        <p className="mt-2 text-sm font-mono text-zinc-500 truncate max-w-md mx-auto">
          {url}
        </p>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-10 overflow-hidden border border-zinc-200/60">
        <div
          className="bg-zinc-950 h-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, progress)}%` }}
        />
      </div>

      {/* 6 Sequential Stages List */}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isDone = progress >= stage.minProgress;
          const isCurrent = !isDone && (idx === 0 || progress >= stages[idx - 1].minProgress);

          return (
            <div
              key={stage.num}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
                isDone
                  ? 'border-zinc-200 bg-white text-zinc-900 shadow-2xs'
                  : isCurrent
                  ? 'border-zinc-950 bg-white ring-1 ring-zinc-950 text-zinc-950 shadow-xs'
                  : 'border-zinc-200/60 bg-zinc-50/50 text-zinc-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className="font-mono text-xs font-semibold text-zinc-400">
                  {stage.num}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-600'
                      : isCurrent
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium tracking-tight">
                  {stage.title}
                </span>
              </div>

              <div className="text-xs font-mono">
                {isDone ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    Done
                  </span>
                ) : isCurrent ? (
                  <span className="text-blue-600 font-semibold animate-pulse">
                    Active...
                  </span>
                ) : (
                  <span className="text-zinc-400">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
