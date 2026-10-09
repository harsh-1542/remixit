import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { AnalysisProgress } from '../components/AnalysisProgress';
import {
  Sparkles,
  ArrowRight,
  Monitor,
  Smartphone,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface AnalysisPageProps {
  jobId: string;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ jobId }) => {
  const { navigate } = useRouter();
  const [job, setJob] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeViewport, setActiveViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timer: any = null;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/analyze/${jobId}`);
        if (!res.ok) {
          throw new Error('Analysis job could not be retrieved.');
        }
        const data = await res.json();
        if (!isMounted) return;

        setJob(data);

        if (data.status === 'completed') {
          // Fetch complete result
          const resultRes = await fetch(`/api/analyze/${jobId}/result`);
          if (resultRes.ok) {
            const resultData = await resultRes.json();
            if (isMounted) {
              setResult(resultData);
              // Save specification in localStorage so /generate/:jobId has offline persistence
              try {
                localStorage.setItem(`remix_spec_${jobId}`, JSON.stringify(resultData.designSpec));
              } catch {}
              setLoading(false);
            }
          }
        } else if (data.status === 'failed') {
          setLoading(false);
          setError(data.error || 'Website analysis failed.');
        } else {
          // Continue polling
          timer = setTimeout(pollStatus, 1200);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setLoading(false);
        setError(err.message || 'Network error checking analysis status.');
      }
    };

    pollStatus();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  const handleCopyColor = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1800);
  };

  const handleBuildSimilar = () => {
    navigate(`/generate/${jobId}`);
  };

  // If in progress
  if (loading && (!result || job?.status !== 'completed')) {
    return (
      <AnalysisProgress
        status={job?.status || 'loading'}
        progress={job?.progress || 15}
        currentStage={job?.currentStage || 'Connecting to website'}
        url={job?.url || 'https://...'}
      />
    );
  }

  // If failed
  if (error || job?.status === 'failed') {
    return (
      <div className="w-full max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
          Analysis Encountered an Issue
        </h2>
        <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto leading-relaxed">
          {error || job?.error || "We couldn't reach this website. Check the URL and try again."}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => navigate('/build')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <span>Browse Library</span>
          </button>
        </div>
      </div>
    );
  }

  const spec = result?.designSpec;
  const currentScreenshot =
    activeViewport === 'desktop'
      ? result?.desktopScreenshot
      : result?.mobileScreenshot;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 mb-8 border-b border-zinc-200/80 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ANALYSIS COMPLETE</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 font-sans">
            Reference analyzed.
          </h1>

          <p className="mt-2 text-sm sm:text-base text-zinc-600 max-w-2xl font-normal leading-relaxed">
            Extracted visual hierarchy, spatial rules, and design specifications for{' '}
            <strong className="text-zinc-900 font-semibold">{spec?.site?.title || result?.url}</strong>.
          </p>
        </div>

        {/* Primary Build Similar CTA Header Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleBuildSimilar}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-zinc-300" />
            <span>Build Similar</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Screenshot Preview + Design System Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* Left Column: Captured Screenshots Viewport (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Captured Reference Viewport
            </span>

            {/* Desktop / Mobile Switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200/80">
              <button
                onClick={() => setActiveViewport('desktop')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all ${
                  activeViewport === 'desktop'
                    ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>1440 × 900</span>
              </button>
              <button
                onClick={() => setActiveViewport('mobile')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all ${
                  activeViewport === 'mobile'
                    ? 'bg-white text-zinc-950 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>390 × 844</span>
              </button>
            </div>
          </div>

          {/* Screenshot Display Frame */}
          <div className="relative w-full rounded-2xl border border-zinc-200/90 bg-zinc-100 p-2 sm:p-3 shadow-sm overflow-hidden">
            {/* Browser top indicator */}
            <div className="h-7 bg-white rounded-t-lg border-b border-zinc-200 px-3 flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
                <div className="w-2 h-2 rounded-full bg-zinc-300" />
              </div>
              <div className="text-[11px] font-mono text-zinc-500 truncate max-w-[240px]">
                {result?.url}
              </div>
              <div className="w-3" />
            </div>

            <div
              className={`mx-auto overflow-hidden rounded-b-lg border border-zinc-200/60 bg-white transition-all ${
                activeViewport === 'desktop' ? 'w-full aspect-[16/10]' : 'max-w-[340px] aspect-[9/16]'
              }`}
            >
              {currentScreenshot ? (
                <img
                  src={currentScreenshot}
                  alt="Captured website preview"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">
                  Viewport preview unavailable
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-500 font-mono">
            Analyzed using controlled browser viewport sandboxing without executing external script downloads.
          </p>
        </div>

        {/* Right Column: Design Summary & Color Palette (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Design Summary Card */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-2">
              Design Summary
            </h3>

            <div className="text-2xl font-bold text-zinc-950 tracking-tight">
              {spec?.visualStyle?.primaryStyle || 'Modern SaaS'}
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 font-mono">
              <span className="capitalize">{spec?.visualStyle?.theme || 'Light'} Mode</span>
              <span>·</span>
              <span>{spec?.site?.category || 'SaaS'} Archetype</span>
            </div>

            <p className="text-xs text-zinc-600 mt-3 leading-relaxed">
              {spec?.visualStyle?.vibeDescription ||
                'Clean editorial layout with structured spacing and disciplined typographic scale.'}
            </p>

            <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap gap-1.5 text-xs font-mono text-zinc-600">
              {spec?.visualStyle?.secondaryStyles?.map((st: string) => (
                <span key={st} className="bg-zinc-100 px-2.5 py-1 rounded-md text-zinc-700">
                  {st}
                </span>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                Color Palette
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">Click to copy</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {[
                ...(spec?.colors?.primary || ['#09090B']),
                ...(spec?.colors?.backgrounds || ['#FAFAF8']),
                ...(spec?.colors?.accents || ['#3B82F6']),
                ...(spec?.colors?.text || ['#18181B']),
              ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .slice(0, 8)
                .map((hex: string) => (
                  <button
                    key={hex}
                    onClick={() => handleCopyColor(hex)}
                    className="group flex flex-col items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                    title={`Copy ${hex}`}
                  >
                    <div
                      className="w-full h-11 rounded-lg border border-black/10 shadow-2xs group-hover:scale-105 transition-transform relative flex items-center justify-center"
                      style={{ backgroundColor: hex }}
                    >
                      {copiedColor === hex && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-950 truncate max-w-full">
                      {copiedColor === hex ? 'Copied' : hex}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Detected Technologies */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3">
              Technology Detected
            </h3>

            <div className="space-y-2.5">
              {(spec?.technologies || []).map((tech: any) => (
                <div
                  key={tech.name}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60 text-xs"
                >
                  <div>
                    <span className="font-semibold text-zinc-900 block">{tech.name}</span>
                    <span className="text-zinc-400 text-[10px]">{tech.category}</span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                      tech.confidence === 'High'
                        ? 'bg-emerald-100 text-emerald-800 font-semibold'
                        : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {tech.confidence === 'High' ? 'Confirmed' : `Likely ${tech.name}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Structural Decomposition Sections: Typography, Layout, Sections Timeline, Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {/* Typography */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4">
              Typography System
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 font-mono block">Heading Scale</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {spec?.typography?.headingStyle || 'Large geometric display'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block">Body Copy</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {spec?.typography?.bodyStyle || 'Neutral sans-serif'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block">Hierarchy Rhythm</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {spec?.typography?.hierarchy || 'Dramatic contrast'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-mono text-zinc-400">
            {spec?.typography?.estimatedFontFamilies?.join(', ') || 'System Sans'}
          </div>
        </div>

        {/* Layout System */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4">
              Layout &amp; Grid System
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 font-mono block">Content Bounds</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {spec?.layout?.maxWidth || '1440px container'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block">Column Grid</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {spec?.layout?.grid || '12-column modular grid'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block">Vertical Spacing</span>
                <span className="text-zinc-900 font-medium mt-0.5 block">
                  {spec?.layout?.spacing || 'Large section margins'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-mono text-zinc-400">
            {spec?.layout?.alignment || 'Left-aligned content spine'}
          </div>
        </div>

        {/* Interactions & Animation */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200/90 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4">
              Interactions &amp; Motion
            </h3>
            <div className="space-y-2 text-xs">
              {(spec?.animation?.characteristics || [
                'Hover interactions on interactive cards',
                'Scroll-linked header blur',
                'Micro-motion button transitions',
              ]).map((anim: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-zinc-700">
                  <span className="text-zinc-300 font-mono">0{i + 1}</span>
                  <span>{anim}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-mono text-zinc-400">
            Motion status: {spec?.animation?.present ? 'Active' : 'Static'}
          </div>
        </div>
      </div>

      {/* Sections Visual Timeline */}
      <div className="mb-16 p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-6">
          Sections Timeline
        </h3>

        <div className="relative border-l-2 border-zinc-200 ml-3 sm:ml-4 space-y-6">
          {(spec?.sections || []).map((sec: any, idx: number) => (
            <div key={idx} className="relative pl-6 sm:pl-8">
              {/* Dot */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-zinc-950 flex items-center justify-center" />

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="text-base font-bold text-zinc-950 uppercase tracking-tight">
                  {sec.type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Section 0{idx + 1} · {sec.layout}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                {sec.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reusable Components Taxonomy */}
      <div className="mb-16 p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
        <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-4">
          Identified Components Taxonomy
        </h3>
        <div className="flex flex-wrap gap-2">
          {(spec?.components || ['Navbar', 'Hero', 'Cards', 'Bento Grid', 'Testimonials', 'CTA', 'Footer']).map(
            (comp: string) => (
              <span
                key={comp}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-800"
              >
                {comp}
              </span>
            )
          )}
        </div>
      </div>

      {/* FINAL BUILD SIMILAR CALL TO ACTION BAR */}
      <div className="rounded-3xl bg-zinc-950 text-white p-8 sm:p-12 text-center flex flex-col items-center">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3">
          Phase 3 Ready
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Ready to build an original site inspired by this reference?
        </h2>
        <p className="text-sm text-zinc-300 mt-2 max-w-lg leading-relaxed">
          Use this design specification as inspiration for your next website project.
        </p>
        <button
          onClick={handleBuildSimilar}
          className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-100 active:bg-zinc-200 transition-all shadow-md cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-zinc-800" />
          <span>Build Similar</span>
          <ArrowRight className="w-4 h-4 text-zinc-600" />
        </button>
      </div>
    </div>
  );
};
