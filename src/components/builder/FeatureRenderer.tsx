import React from 'react';
import {
  FeatureGridSection,
  BentoGridSection,
  WebsiteTheme,
} from '../../types/website-definition';
import { CheckCircle2, Zap, Shield, Cpu, Sparkles, Layers, Box } from 'lucide-react';

export const FeatureRenderer: React.FC<{
  section: FeatureGridSection | BentoGridSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  const isDark = theme.mode === 'dark';

  if (section.type === 'bento-grid') {
    return (
      <section
        className="w-full py-16 sm:py-24 border-b select-none"
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          color: theme.textColor,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            {section.badge && (
              <span
                className="text-xs font-mono uppercase tracking-widest block mb-2 font-semibold"
                style={{ color: theme.accentColor }}
              >
                {section.badge}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: theme.textColor }}>
              {section.heading}
            </h2>
            {section.description && (
              <p className="mt-3 text-base leading-relaxed" style={{ color: theme.mutedTextColor }}>
                {section.description}
              </p>
            )}
          </div>

          {/* Bento layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {section.items.map((item, idx) => {
              const isWide = item.size === 'wide' || idx === 0;
              return (
                <div
                  key={idx}
                  className={`p-6 sm:p-7 rounded-2xl border flex flex-col justify-between transition-all hover:shadow-md ${
                    isWide ? 'md:col-span-2' : 'md:col-span-1'
                  }`}
                  style={{
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.borderColor,
                  }}
                >
                  <div>
                    {item.tag && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded border inline-block mb-3 uppercase tracking-wider"
                        style={{
                          borderColor: theme.borderColor,
                          color: theme.mutedTextColor,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        {item.tag}
                      </span>
                    )}
                    <h3 className="text-xl font-bold tracking-tight mb-2" style={{ color: theme.textColor }}>
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.mutedTextColor }}>
                      {item.description}
                    </p>
                  </div>

                  {item.highlightMetric && (
                    <div className="mt-6 pt-4 border-t flex items-baseline justify-between" style={{ borderColor: theme.borderColor }}>
                      <span className="text-2xl font-black font-mono tracking-tight" style={{ color: theme.accentColor }}>
                        {item.highlightMetric}
                      </span>
                      <span className="text-xs font-mono" style={{ color: theme.mutedTextColor }}>
                        {item.highlightLabel || 'Benchmark metric'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Feature Grid
  const columnsClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }[section.columns || 3];

  return (
    <section
      className="w-full py-16 sm:py-24 border-b"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 sm:mb-16">
          {section.badge && (
            <span
              className="text-xs font-mono uppercase tracking-widest block mb-2 font-semibold"
              style={{ color: theme.accentColor }}
            >
              {section.badge}
            </span>
          )}
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: theme.textColor }}>
            {section.heading}
          </h2>
          {section.description && (
            <p className="mt-3 text-base leading-relaxed" style={{ color: theme.mutedTextColor }}>
              {section.description}
            </p>
          )}
        </div>

        <div className={`grid grid-cols-1 ${columnsClass} gap-6 sm:gap-8`}>
          {section.features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderColor,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: theme.accentColor,
                }}
              >
                <Cpu className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold tracking-tight mb-2" style={{ color: theme.textColor }}>
                {feat.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: theme.mutedTextColor }}>
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
