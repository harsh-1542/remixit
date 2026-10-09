import React from 'react';
import {
  TestimonialGridSection,
  PricingSection,
  WebsiteTheme,
} from '../../types/website-definition';
import { Check, Star, ArrowRight } from 'lucide-react';

export const TestimonialsRenderer: React.FC<{
  section: TestimonialGridSection;
  theme: WebsiteTheme;
}> = ({ section, theme }) => {
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
        <div className="max-w-3xl mb-12 text-center mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {section.testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-2xl border flex flex-col justify-between"
              style={{
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderColor,
              }}
            >
              <div>
                <div className="flex items-center gap-1 mb-4" style={{ color: theme.accentColor }}>
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-sm italic leading-relaxed mb-6" style={{ color: theme.textColor }}>
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: theme.borderColor }}>
                <div>
                  <div className="font-bold font-sans" style={{ color: theme.textColor }}>
                    {t.author}
                  </div>
                  <div className="text-[11px]" style={{ color: theme.mutedTextColor }}>
                    {t.role}
                  </div>
                </div>
                <span className="font-mono text-[11px] font-semibold" style={{ color: theme.mutedTextColor }}>
                  {t.company}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const PricingRenderer: React.FC<{
  section: PricingSection;
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
        <div className="max-w-3xl mb-12 text-center mx-auto">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {section.plans.map((plan, idx) => {
            const isPopular = plan.isPopular || idx === 1;
            return (
              <div
                key={idx}
                className={`p-7 rounded-2xl border flex flex-col justify-between transition-all relative ${
                  isPopular ? 'ring-2 shadow-xl scale-[1.02]' : 'shadow-xs'
                }`}
                style={{
                  backgroundColor: theme.cardBackground,
                  borderColor: isPopular ? theme.accentColor : theme.borderColor,
                }}
              >
                {isPopular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    Recommended
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold tracking-tight" style={{ color: theme.textColor }}>
                    {plan.name}
                  </h3>
                  <p className="text-xs mt-1 mb-4" style={{ color: theme.mutedTextColor }}>
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl font-black font-mono tracking-tight" style={{ color: theme.textColor }}>
                      {plan.price}
                    </span>
                    <span className="text-xs font-mono" style={{ color: theme.mutedTextColor }}>
                      {plan.cadence}
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t" style={{ borderColor: theme.borderColor }}>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                        <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.accentColor }} />
                        <span style={{ color: theme.textColor }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6">
                  <button
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isPopular ? 'text-white' : 'border'
                    }`}
                    style={{
                      backgroundColor: isPopular ? theme.primaryColor : 'transparent',
                      borderColor: theme.borderColor,
                      color: isPopular ? '#FFFFFF' : theme.textColor,
                    }}
                  >
                    <span>{plan.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
