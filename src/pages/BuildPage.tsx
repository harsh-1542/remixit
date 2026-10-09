import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { WEBSITES } from '../data/websites';
import { ReferenceInput } from '../components/ReferenceInput';
import {
  Sparkles,
  Layers,
  Code2,
  Globe,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const BuildPage: React.FC = () => {
  const { searchParams, navigate } = useRouter();
  const urlParam = searchParams.get('url') || '';
  const refParam = searchParams.get('ref') || '';

  const matchedRefSite = refParam
    ? WEBSITES.find((w) => w.slug === refParam || w.id === refParam)
    : null;

  const defaultUrl = matchedRefSite
    ? `https://${matchedRefSite.slug}.remix.design`
    : urlParam;

  const [inputUrl, setInputUrl] = useState(defaultUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultUrl) {
      setInputUrl(defaultUrl);
    }
  }, [defaultUrl]);

  const handleStartAnalysis = async (submittedUrl: string) => {
    if (!submittedUrl || !submittedUrl.trim()) {
      setError('Please enter a website URL.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittedUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate website analysis.');
      }

      // Navigate to the live analysis & progress route
      navigate(`/analyze/${data.jobId}`);
    } catch (err: any) {
      setError(err.message || 'We could not connect to this website. Check the URL and try again.');
      setSubmitting(false);
    }
  };

  const steps = [
    {
      step: '01',
      title: 'Paste a reference',
      subtitle: 'URL ingestion & structure breakdown',
      description:
        'Remix analyzes the DOM hierarchy, spatial rhythms, font pairings, and responsive breakpoints of any public reference.',
      icon: Globe,
    },
    {
      step: '02',
      title: 'Remix the design',
      subtitle: 'Originality engine without cloning',
      description:
        'Transform the architectural foundation with your domain copy, distinct color palette, and bespoke layout variations.',
      icon: Layers,
    },
    {
      step: '03',
      title: 'Build your website',
      subtitle: 'Clean production-ready code',
      description:
        'Export idiomatic React, Tailwind CSS, or Next.js components ready to deploy to production with zero bloat.',
      icon: Code2,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
          <span>PHASE 2 · REFERENCE ANALYZER ACTIVE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 font-sans leading-tight">
          Build from a reference.
        </h1>

        <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
          Paste a website you love and turn its design language into an original website.
        </p>
      </div>

      {/* Main Input Box */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl border border-zinc-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.03)] mb-10">
        <ReferenceInput
          initialValue={inputUrl}
          onAnalyze={handleStartAnalysis}
          buttonLabel={submitting ? 'Connecting...' : 'Analyze Website'}
          variant="build"
        />

        {/* Validation or API error display */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sample preset links */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-zinc-400 font-mono">Sample references:</span>
          {['https://linear.app', 'https://stripe.com', 'https://vercel.com', 'https://github.com'].map(
            (sample) => (
              <button
                key={sample}
                onClick={() => {
                  setInputUrl(sample);
                  handleStartAnalysis(sample);
                }}
                className="text-zinc-600 hover:text-zinc-950 underline underline-offset-2 font-mono transition-colors cursor-pointer"
              >
                {sample.replace('https://', '')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Visual 3-Step Preview: Future Workflow */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-1">
            Product Architecture
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
            The Remix Workflow
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="p-6 rounded-xl border border-zinc-200/80 bg-white/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-mono font-bold text-zinc-950">
                      {st.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-800">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-zinc-950 tracking-tight">
                    {st.title}
                  </h3>
                  <span className="text-xs font-mono text-zinc-400 block mt-0.5">
                    {st.subtitle}
                  </span>
                  <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">
                    {st.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 text-[11px] font-mono text-zinc-400">
                  Step {st.step} of 03
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
