import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import { UserGenerationConfig, GenerationJob } from '../types/website-definition';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Palette,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Compass,
  Cpu,
} from 'lucide-react';

interface GeneratePageProps {
  jobId: string;
}

export const GeneratePage: React.FC<GeneratePageProps> = ({ jobId }) => {
  const { navigate } = useRouter();
  const [spec, setSpec] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [loadingSpec, setLoadingSpec] = useState(true);

  // Form state
  const [config, setConfig] = useState<UserGenerationConfig>({
    name: '',
    description: '',
    industry: 'AI',
    websiteType: 'SaaS marketing website',
    colorPreference: 'reference',
    customColors: {
      primary: '#09090B',
      accent: '#3B82F6',
      background: '#FAFAF8',
    },
    additionalInstructions: '',
  });

  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [genJob, setGenJob] = useState<GenerationJob | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Load Phase 2 Design Specification
  useEffect(() => {
    // 1. Check local storage cache
    const cached = localStorage.getItem(`remix_spec_${jobId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSpec(parsed);
        // Pre-populate sensible defaults from analysis
        setConfig((prev) => ({
          ...prev,
          industry: parsed.site?.category || 'SaaS',
        }));
      } catch {}
    }

    // 2. Fetch from backend API
    fetch(`/api/analyze/${jobId}/result`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setAnalysisResult(data);
        if (data.designSpec) {
          setSpec(data.designSpec);
          setConfig((prev) => ({
            ...prev,
            industry: data.designSpec.site?.category || prev.industry,
          }));
        }
        setLoadingSpec(false);
      })
      .catch(() => {
        setLoadingSpec(false);
      });
  }, [jobId]);

  // Validation
  const validateForm = () => {
    const errors: { name?: string; description?: string } = {};
    if (!config.name.trim()) {
      errors.name = 'Please provide a website or product name.';
    }
    if (!config.description.trim()) {
      errors.description = 'Please describe your product or business.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Generation
  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const token = localStorage.getItem('remix_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          config,
          referenceJobId: jobId !== 'new' ? jobId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start generation.');
      }

      // Poll progress until completion
      pollGenerationStatus(data.jobId, data.projectId);
    } catch (err: any) {
      setIsGenerating(false);
      setGenError(err.message || 'Generation request failed.');
    }
  };

  const pollGenerationStatus = (genJobId: string, projectId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/${genJobId}`);
        if (!res.ok) throw new Error('Status poll failed');
        const data = await res.json();
        setGenJob(data);

        if (data.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => {
            navigate(`/editor/${projectId}`);
          }, 600);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setIsGenerating(false);
          setGenError(data.error || 'Website generation failed.');
        }
      } catch (err: any) {
        clearInterval(interval);
        setIsGenerating(false);
        setGenError(err.message || 'Error communicating with generation engine.');
      }
    }, 900);
  };

  const industries = [
    'SaaS',
    'AI',
    'Finance',
    'Agency',
    'E-commerce',
    'Real Estate',
    'Healthcare',
    'Education',
    'Restaurant',
    'Portfolio',
    'Architecture',
    'Other',
  ];

  const websiteTypes = [
    'Landing page',
    'SaaS marketing website',
    'Business website',
    'Agency portfolio',
    'Personal portfolio',
    'E-commerce storefront',
    'Product launch page',
    'Restaurant website',
    'Real estate website',
  ];

  const stages = [
    { num: '01', title: 'Preparing design specification', min: 15 },
    { num: '02', title: 'Planning page structure', min: 35 },
    { num: '03', title: 'Generating website sections', min: 65 },
    { num: '04', title: 'Validating components', min: 85 },
    { num: '05', title: 'Rendering preview', min: 95 },
    { num: '06', title: 'Preparing the editor', min: 100 },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Top back navigation */}
      <div className="mb-6">
        <button
          onClick={() => (jobId !== 'new' ? navigate(`/analyze/${jobId}`) : navigate('/build'))}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{jobId !== 'new' ? 'Back to Reference Analysis' : 'Back to URL Input'}</span>
        </button>
      </div>

      {/* Main Header */}
      <div className="mb-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono text-zinc-600 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
          <span>PHASE 3 · AI SYNTHESIS ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 font-sans">
          Configure your new website.
        </h1>
        <p className="mt-2 text-base text-zinc-600 max-w-2xl leading-relaxed">
          Remix transforms the reference's spatial ratios, visual hierarchy, and component patterns into an original, working React website.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Reference Summary (4 cols) */}
        {spec && (
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                  Reference Blueprint
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                  Inspiration Only
                </span>
              </div>

              {/* Reference Title & Archetype */}
              <div>
                <h3 className="text-base font-bold text-zinc-950 truncate">
                  {spec.site?.title || 'Analyzed Reference'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                  {spec.visualStyle?.primaryStyle} ({spec.visualStyle?.theme} mode)
                </p>
              </div>

              {/* Screenshot thumbnail if available */}
              {analysisResult?.desktopScreenshot && (
                <div className="rounded-xl overflow-hidden border border-zinc-200 aspect-[16/10] bg-zinc-100">
                  <img
                    src={analysisResult.desktopScreenshot}
                    alt="Reference preview"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              )}

              {/* Color Palette preview */}
              <div>
                <span className="text-xs font-mono text-zinc-400 block mb-2">Palette Harmonies</span>
                <div className="flex items-center gap-1.5">
                  {[
                    ...(spec.colors?.primary || []),
                    ...(spec.colors?.accents || []),
                    ...(spec.colors?.backgrounds || []),
                  ]
                    .slice(0, 5)
                    .map((hex: string, i: number) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-md border border-black/10 shadow-2xs"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                </div>
              </div>

              {/* Detected Sections */}
              <div>
                <span className="text-xs font-mono text-zinc-400 block mb-2">Detected Flow</span>
                <div className="flex flex-wrap gap-1 text-[11px] font-mono text-zinc-600">
                  {(spec.sections || []).slice(0, 5).map((s: any, idx: number) => (
                    <span key={idx} className="bg-zinc-100 px-2 py-0.5 rounded">
                      {s.type.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {(spec.sections || []).length > 5 && (
                    <span className="text-zinc-400 px-1">+{spec.sections.length - 5}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Configuration Form (8 cols if spec exists, 12 otherwise) */}
        <div className={spec ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <form
            onSubmit={handleStartGeneration}
            className="p-6 sm:p-8 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-6"
          >
            {/* Field 1: Website / Product Name */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1.5">
                Website or Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="e.g. Nova AI, Meridian Architecture, Vertex Treasury"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-zinc-950 focus:outline-none transition-all ${
                  formErrors.name
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
                }`}
              />
              {formErrors.name && (
                <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Field 2: Website Description */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1.5">
                Website Description &amp; Value Proposition <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe what your product does, who it serves, and what makes it distinctive..."
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-zinc-950 focus:outline-none transition-all ${
                  formErrors.description
                    ? 'border-red-400 ring-2 ring-red-100'
                    : 'border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
                }`}
              />
              {formErrors.description && (
                <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
              )}
            </div>

            {/* Field 3 & 4: Industry & Website Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1.5">
                  Industry
                </label>
                <select
                  value={config.industry}
                  onChange={(e) => setConfig({ ...config, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer"
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1.5">
                  Website Type
                </label>
                <select
                  value={config.websiteType}
                  onChange={(e) => setConfig({ ...config, websiteType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer"
                >
                  {websiteTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field 5: Preferred Colors */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-2">
                Preferred Color Treatment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'reference', label: 'Use Reference Colors' },
                  { id: 'light', label: 'Light Theme' },
                  { id: 'dark', label: 'Dark Theme' },
                  { id: 'custom', label: 'Custom Palette' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setConfig({ ...config, colorPreference: opt.id as any })}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer ${
                      config.colorPreference === opt.id
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom color picker row if custom is selected */}
              {config.colorPreference === 'custom' && (
                <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-wrap gap-4 items-center animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">Accent:</span>
                    <input
                      type="color"
                      value={config.customColors?.accent || '#3B82F6'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          customColors: { ...config.customColors, accent: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">Primary:</span>
                    <input
                      type="color"
                      value={config.customColors?.primary || '#09090B'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          customColors: { ...config.customColors, primary: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Field 6: Additional Instructions */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-700 font-semibold mb-1.5">
                Additional Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={config.additionalInstructions}
                onChange={(e) => setConfig({ ...config, additionalInstructions: e.target.value })}
                placeholder="e.g. Include pricing table, keep layout minimal, make hero high-contrast, include FAQ..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-sm text-zinc-950 focus:outline-none focus:border-zinc-900"
              />
            </div>

            {/* Error banner */}
            {genError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold bg-zinc-950 text-white hover:bg-zinc-800 active:bg-black transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-zinc-300" />
                <span>Generate Website</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Generation Progress Modal / Screen */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-5 h-5 text-zinc-300 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950">Synthesizing Original Website</h3>
              <p className="text-xs text-zinc-500 font-mono">
                Transforming {spec?.site?.title || 'reference'} architectural patterns for {config.name}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200">
              <div
                className="bg-zinc-950 h-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(15, genJob?.progress || 20)}%` }}
              />
            </div>

            {/* Stages list */}
            <div className="space-y-2.5">
              {stages.map((st) => {
                const isDone = (genJob?.progress || 10) >= st.min;
                const isCurrent =
                  !isDone && ((genJob?.progress || 10) >= st.min - 25 || st.num === '01');
                return (
                  <div
                    key={st.num}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                      isDone
                        ? 'bg-emerald-50/50 border-emerald-200 text-zinc-900'
                        : isCurrent
                        ? 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                        : 'bg-zinc-50 border-zinc-200/60 text-zinc-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px]">{st.num}</span>
                      <span>{st.title}</span>
                    </div>
                    <span>{isDone ? '✓' : isCurrent ? 'Active...' : 'Pending'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
