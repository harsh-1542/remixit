import React, { useState } from 'react';
import {
  FaqSection,
  ContactSection,
  CtaSection,
  FooterSection,
  WebsiteTheme,
} from '../../types/website-definition';
import { ChevronDown, ArrowRight, Mail, Sparkles } from 'lucide-react';

export const FaqRenderer: React.FC<{
  section: FaqSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      className="w-full py-16 sm:py-24 border-b select-none"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {section.badge && (
            <span className="text-xs font-mono uppercase tracking-widest block mb-2 font-semibold" style={{ color: theme.accentColor }}>
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

        <div className="space-y-3">
          {section.items.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border transition-colors overflow-hidden"
                style={{
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderColor,
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm cursor-pointer"
                  style={{ color: theme.textColor }}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: theme.mutedTextColor }}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs leading-relaxed border-t" style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}>
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const ContactRenderer: React.FC<{
  section: ContactSection;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {section.badge && (
          <span className="text-xs font-mono uppercase tracking-widest block mb-2 font-semibold" style={{ color: theme.accentColor }}>
            {section.badge}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: theme.textColor }}>
          {section.heading}
        </h2>
        <p className="mt-3 text-base leading-relaxed max-w-xl mx-auto" style={{ color: theme.mutedTextColor }}>
          {section.description}
        </p>

        <div className="mt-8 max-w-md mx-auto p-6 rounded-2xl border text-left shadow-sm" style={{ backgroundColor: theme.cardBackground, borderColor: theme.borderColor }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono mb-1" style={{ color: theme.mutedTextColor }}>
                Your Email
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none"
                style={{ borderColor: theme.borderColor, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs font-mono mb-1" style={{ color: theme.mutedTextColor }}>
                Inquiry Message
              </label>
              <textarea
                rows={3}
                placeholder="Describe your project requirements..."
                className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none"
                style={{ borderColor: theme.borderColor, backgroundColor: theme.backgroundColor, color: theme.textColor }}
                readOnly
              />
            </div>
            <button
              className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              style={{ backgroundColor: theme.primaryColor, color: '#FFFFFF' }}
            >
              Send Direct Message
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export const CtaRenderer: React.FC<{
  section: CtaSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  return (
    <section
      className="w-full py-20 sm:py-28 border-b text-center relative overflow-hidden"
      style={{
        backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.02)' : theme.cardBackground,
        borderColor: theme.borderColor,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {section.badge && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border mb-4"
            style={{
              backgroundColor: theme.backgroundColor,
              borderColor: theme.borderColor,
              color: theme.accentColor,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{section.badge}</span>
          </div>
        )}

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: theme.textColor }}>
          {section.heading}
        </h2>

        <p className="mt-4 text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: theme.mutedTextColor }}>
          {section.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-transform active:scale-95 shadow-md cursor-pointer"
            style={{ backgroundColor: theme.primaryColor, color: '#FFFFFF' }}
          >
            <span>{section.primaryCta.label}</span>
            <ArrowRight className="w-4 h-4 opacity-80" />
          </button>
          {section.secondaryCta && (
            <button
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold border transition-colors cursor-pointer"
              style={{
                backgroundColor: theme.backgroundColor,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
            >
              <span>{section.secondaryCta.label}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export const FooterRenderer: React.FC<{
  section: FooterSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
  return (
    <footer
      className="w-full py-14 border-t select-none"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand info (2 cols) */}
          <div className="col-span-2 space-y-3">
            <span className="text-lg font-bold font-sans tracking-tight block" style={{ color: theme.textColor }}>
              {section.brandName}
            </span>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: theme.mutedTextColor }}>
              {section.tagline}
            </p>
          </div>

          {/* Columns */}
          {section.columns.map((col, idx) => (
            <div key={idx} className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider block font-semibold" style={{ color: theme.textColor }}>
                {col.title}
              </span>
              <ul className="space-y-2">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a
                      href={link.href}
                      onClick={(e) => e.preventDefault()}
                      className="text-xs transition-opacity hover:opacity-100 opacity-70"
                      style={{ color: theme.mutedTextColor }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between text-xs font-mono gap-3" style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}>
          <div>{section.copyright}</div>
          <div>Synthesized with Remix Architecture Engine</div>
        </div>
      </div>
    </footer>
  );
};
