import React from 'react';
import {
  CenteredHeroSection,
  SplitHeroSection,
  ImageHeroSection,
  WebsiteTheme,
} from '../../types/website-definition';
import { ArrowRight, Sparkles, Terminal, Activity } from 'lucide-react';

export const HeroRenderer: React.FC<{
  section: CenteredHeroSection | SplitHeroSection | ImageHeroSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  const isDark = theme.mode === 'dark';

  if (section.type === 'split-hero') {
    return (
      <section
        className="w-full py-16 sm:py-24 border-b overflow-hidden"
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          color: theme.textColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text Left (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {section.badge && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border"
                  style={{
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.borderColor,
                    color: theme.accentColor,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span>{section.badge}</span>
                </div>
              )}

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]"
                style={{ color: theme.textColor }}
              >
                {section.heading}
              </h1>

              <p
                className="text-base sm:text-lg max-w-xl leading-relaxed"
                style={{ color: theme.mutedTextColor }}
              >
                {section.description}
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {section.primaryCta && (
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-transform active:scale-95 shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: '#FFFFFF',
                    }}
                  >
                    <span>{section.primaryCta.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-80" />
                  </button>
                )}
                {section.secondaryCta && (
                  <button
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-colors cursor-pointer"
                    style={{
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.borderColor,
                      color: theme.textColor,
                    }}
                  >
                    <span>{section.secondaryCta.label}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Preview Card Right (5 cols) */}
            <div className="lg:col-span-5">
              <div
                className="rounded-2xl border p-5 sm:p-6 shadow-xl relative overflow-hidden"
                style={{
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderColor,
                }}
              >
                {/* Header mock */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200/40">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" style={{ color: theme.accentColor }} />
                    <span className="text-xs font-mono font-bold" style={{ color: theme.textColor }}>
                      {section.previewTitle || 'SYSTEM CONSOLE'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Metrics / details */}
                <div className="space-y-3">
                  {(section.previewDetails || [
                    { label: 'Latency', value: '4.2ms' },
                    { label: 'Throughput', value: '1.4M req/s' },
                    { label: 'Reliability', value: '99.99%' },
                  ]).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border flex items-center justify-between"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderColor: theme.borderColor,
                      }}
                    >
                      <span className="text-xs font-mono" style={{ color: theme.mutedTextColor }}>
                        {item.label}
                      </span>
                      <span className="text-sm font-bold font-mono" style={{ color: theme.textColor }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Visual bar graph */}
                <div className="mt-4 pt-3 border-t border-zinc-200/40 flex items-end gap-1.5 h-12">
                  {[40, 65, 55, 80, 70, 95, 85, 100].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-xs"
                      style={{
                        height: `${v}%`,
                        backgroundColor: theme.accentColor,
                        opacity: 0.3 + (i * 0.1),
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Centered Hero (default)
  return (
    <section
      className="w-full py-20 sm:py-28 border-b text-center relative overflow-hidden"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {section.badge && (
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium border mb-6"
            style={{
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              color: theme.accentColor,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
            <span>{section.badge}</span>
          </div>
        )}

        <h1
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06]"
          style={{ color: theme.textColor }}
        >
          {section.heading}
        </h1>

        <p
          className="mt-6 text-base sm:text-xl max-w-2xl leading-relaxed"
          style={{ color: theme.mutedTextColor }}
        >
          {section.description}
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {section.primaryCta && (
            <button
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-transform active:scale-95 shadow-sm cursor-pointer"
              style={{
                backgroundColor: theme.primaryColor,
                color: '#FFFFFF',
              }}
            >
              <span>{section.primaryCta.label}</span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </button>
          )}

          {section.secondaryCta && (
            <button
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
            >
              <span>{section.secondaryCta.label}</span>
            </button>
          )}
        </div>

        {'microCopy' in section && section.microCopy && (
          <p className="mt-4 text-xs font-mono" style={{ color: theme.mutedTextColor }}>
            {section.microCopy}
          </p>
        )}
      </div>
    </section>
  );
};
