import React from 'react';
import {
  StatsSection,
  LogoCloudSection,
  WebsiteTheme,
} from '../../types/website-definition';

export const StatsRenderer: React.FC<{
  section: StatsSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  return (
    <section
      className="w-full py-12 sm:py-16 border-b"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.heading && (
          <div className="text-center mb-8">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: theme.mutedTextColor }}>
              {section.heading}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {section.stats.map((st, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderColor,
              }}
            >
              <div
                className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono"
                style={{ color: theme.textColor }}
              >
                {st.value}
              </div>
              <div className="text-xs font-medium mt-1 uppercase tracking-wider" style={{ color: theme.mutedTextColor }}>
                {st.label}
              </div>
              {st.change && (
                <div className="text-[11px] font-mono mt-1 text-emerald-500 font-semibold">
                  {st.change}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const LogoCloudRenderer: React.FC<{
  section: LogoCloudSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  return (
    <section
      className="w-full py-10 sm:py-12 border-b select-none"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {section.heading && (
          <p className="text-xs font-mono uppercase tracking-widest mb-6" style={{ color: theme.mutedTextColor }}>
            {section.heading}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {section.logos.map((logo, idx) => (
            <div
              key={idx}
              className="px-4 py-2 rounded-lg border font-mono font-semibold text-xs tracking-wider opacity-75 hover:opacity-100 transition-opacity"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
            >
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
