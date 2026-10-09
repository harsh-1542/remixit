import React from 'react';
import { SectionDefinition, WebsiteTheme } from '../../types/website-definition';
import { NavbarRenderer } from './NavbarRenderer';
import { HeroRenderer } from './HeroRenderer';
import { FeatureRenderer } from './FeatureRenderer';
import { StatsRenderer, LogoCloudRenderer } from './StatsAndLogosRenderer';
import { ProductShowcaseRenderer, ImageTextRenderer } from './ShowcaseAndTextRenderer';
import { TestimonialsRenderer, PricingRenderer } from './SocialProofAndPricingRenderer';
import { FaqRenderer, ContactRenderer, CtaRenderer, FooterRenderer } from './UtilitySectionsRenderer';

export const SectionDispatcher: React.FC<{
  section: SectionDefinition;
  theme: WebsiteTheme;
  isSelected?: boolean;
}> = ({ section, theme, isSelected }) => {
  const renderContent = () => {
    switch (section.type) {
      case 'navbar':
        return <NavbarRenderer section={section} theme={theme} />;
      case 'centered-hero':
      case 'split-hero':
      case 'image-hero':
        return <HeroRenderer section={section} theme={theme} />;
      case 'feature-grid':
      case 'bento-grid':
        return <FeatureRenderer section={section} theme={theme} />;
      case 'stats-section':
        return <StatsRenderer section={section} theme={theme} />;
      case 'logo-cloud':
        return <LogoCloudRenderer section={section} theme={theme} />;
      case 'product-showcase':
        return <ProductShowcaseRenderer section={section} theme={theme} />;
      case 'image-text':
        return <ImageTextRenderer section={section} theme={theme} />;
      case 'testimonials':
        return <TestimonialsRenderer section={section} theme={theme} />;
      case 'pricing':
        return <PricingRenderer section={section} theme={theme} />;
      case 'faq':
        return <FaqRenderer section={section} theme={theme} />;
      case 'contact':
        return <ContactRenderer section={section} theme={theme} />;
      case 'cta':
        return <CtaRenderer section={section} theme={theme} />;
      case 'footer':
        return <FooterRenderer section={section} theme={theme} />;
      default:
        return (
          <div className="p-8 text-center text-xs font-mono text-zinc-400 border-b border-dashed">
            Supported component placeholder: {(section as any).type}
          </div>
        );
    }
  };

  return (
    <div
      id={`section-${section.id}`}
      className={`relative transition-all ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : ''
      }`}
    >
      {renderContent()}
    </div>
  );
};
