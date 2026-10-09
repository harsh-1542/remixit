import React, { useState } from 'react';
import {
  ProductShowcaseSection,
  ImageTextSection,
  WebsiteTheme,
} from '../../types/website-definition';
import { Check, ArrowRight, Layers, Sparkles } from 'lucide-react';

export const ProductShowcaseRenderer: React.FC<{
  section: ProductShowcaseSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  const [activeTabId, setActiveTabId] = useState(
    section.tabs && section.tabs.length > 0 ? section.tabs[0].id : '0'
  );

  const activeTab = section.tabs?.find((t) => t.id === activeTabId) || section.tabs?.[0];

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
        <div className="max-w-3xl mx-auto text-center mb-12">
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

        {/* Tab switcher */}
        {section.tabs && section.tabs.length > 0 && (
          <div className="flex justify-center mb-8 overflow-x-auto pb-2 scrollbar-none">
            <div
              className="p-1 rounded-xl border flex gap-1"
              style={{ backgroundColor: theme.cardBackground, borderColor: theme.borderColor }}
            >
              {section.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTabId === tab.id ? 'shadow-xs font-semibold' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: activeTabId === tab.id ? theme.primaryColor : 'transparent',
                    color: activeTabId === tab.id ? '#FFFFFF' : theme.textColor,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Showcase Stage */}
        <div
          className="rounded-2xl border p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          style={{
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5 space-y-4 text-left">
              <span className="text-xs font-mono uppercase tracking-wider" style={{ color: theme.accentColor }}>
                Capability View
              </span>
              <h3 className="text-2xl font-bold tracking-tight" style={{ color: theme.textColor }}>
                {activeTab?.label || 'Modular Architecture'}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: theme.mutedTextColor }}>
                {activeTab?.description || 'Built for mission-critical software teams requiring rapid composability.'}
              </p>
              <div className="pt-2 text-xs font-mono" style={{ color: theme.mutedTextColor }}>
                {activeTab?.previewNote || 'Verified standard execution'}
              </div>
            </div>

            <div className="md:col-span-7">
              <div
                className="h-64 sm:h-80 rounded-xl border p-5 flex flex-col justify-between"
                style={{
                  backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.02)',
                  borderColor: theme.borderColor,
                }}
              >
                <div className="flex justify-between items-center text-xs font-mono" style={{ color: theme.mutedTextColor }}>
                  <span>interface.runtime.tsx</span>
                  <span className="text-emerald-500 font-bold">STATE: 200 OK</span>
                </div>

                <div className="space-y-2.5">
                  <div className="h-3 rounded-full w-3/4 opacity-30" style={{ backgroundColor: theme.accentColor }} />
                  <div className="h-3 rounded-full w-1/2 opacity-20" style={{ backgroundColor: theme.accentColor }} />
                  <div className="h-3 rounded-full w-5/6 opacity-25" style={{ backgroundColor: theme.accentColor }} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded border text-center text-xs font-mono" style={{ borderColor: theme.borderColor, color: theme.textColor }}>
                    Module A
                  </div>
                  <div className="p-2 rounded border text-center text-xs font-mono" style={{ borderColor: theme.borderColor, color: theme.textColor }}>
                    Module B
                  </div>
                  <div className="p-2 rounded border text-center text-xs font-mono font-bold" style={{ borderColor: theme.accentColor, color: theme.accentColor }}>
                    Active Token
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ImageTextRenderer: React.FC<{
  section: ImageTextSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
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
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-center ${section.reversed ? 'lg:flex-row-reverse' : ''}`}>
          <div className="lg:col-span-6 space-y-5 text-left">
            {section.badge && (
              <span className="text-xs font-mono uppercase tracking-widest block font-semibold" style={{ color: theme.accentColor }}>
                {section.badge}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: theme.textColor }}>
              {section.heading}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: theme.mutedTextColor }}>
              {section.description}
            </p>

            <div className="space-y-3 pt-2">
              {section.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: theme.accentColor, color: '#FFFFFF' }}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: theme.textColor }}>
                    {pt}
                  </span>
                </div>
              ))}
            </div>

            {section.ctaLabel && (
              <div className="pt-3">
                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                  style={{ backgroundColor: theme.primaryColor, color: '#FFFFFF' }}
                >
                  <span>{section.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-6">
            <div
              className="rounded-2xl border p-8 aspect-video flex items-center justify-center relative shadow-lg"
              style={{ backgroundColor: theme.cardBackground, borderColor: theme.borderColor }}
            >
              <div className="text-center space-y-2">
                <Layers className="w-10 h-10 mx-auto" style={{ color: theme.accentColor }} />
                <span className="text-sm font-bold block" style={{ color: theme.textColor }}>
                  Visual Design Integrity
                </span>
                <span className="text-xs font-mono block" style={{ color: theme.mutedTextColor }}>
                  Zero pixel drift across devices
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
