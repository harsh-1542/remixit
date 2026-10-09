import { InferredSection } from '../types';

export function analyzeDomStructure(html: string): InferredSection[] {
  const sections: InferredSection[] = [];
  let order = 1;

  const lower = html.toLowerCase();

  // 1. Navigation
  if (lower.includes('<nav') || lower.includes('header') || lower.includes('navbar')) {
    sections.push({
      type: 'navigation',
      order: order++,
      layout: 'Fixed top bar with logo, menu links, and primary CTA',
      description: 'Sticky header providing site navigation and access actions',
      confidence: 'High',
    });
  }

  // 2. Hero Section
  if (
    lower.includes('hero') ||
    lower.includes('<h1') ||
    lower.includes('headline') ||
    lower.includes('intro')
  ) {
    const isAsymmetric = lower.includes('grid-cols-12') || lower.includes('col-span') || lower.includes('flex-col lg:flex-row');
    sections.push({
      type: 'hero',
      order: order++,
      layout: isAsymmetric ? 'Asymmetrical split layout with media showcase' : 'Centered typographic hero with dual call-to-actions',
      description: 'Primary value proposition, headline, and prominent conversion trigger',
      confidence: 'High',
    });
  }

  // 3. Features or Bento Grid
  if (
    lower.includes('feature') ||
    lower.includes('bento') ||
    lower.includes('service') ||
    lower.includes('benefit') ||
    lower.includes('solution')
  ) {
    const isBento = lower.includes('bento') || lower.includes('col-span-2');
    sections.push({
      type: isBento ? 'bento_grid' : 'feature_grid',
      order: order++,
      layout: isBento ? 'Modular bento box matrix' : '3-column structured feature matrix with icons',
      description: 'Capabilities breakdown highlighting core architectural differentiators',
      confidence: 'Likely',
    });
  }

  // 4. Product Showcase / Media
  if (
    lower.includes('preview') ||
    lower.includes('showcase') ||
    lower.includes('screenshot') ||
    lower.includes('demo') ||
    lower.includes('mockup')
  ) {
    sections.push({
      type: 'product_showcase',
      order: order++,
      layout: 'Full-bleed interactive media frame with subtle shadow depth',
      description: 'Visual evidence of software interface or physical catalog items',
      confidence: 'Likely',
    });
  }

  // 5. Statistics / Metrics
  if (
    lower.includes('stat') ||
    lower.includes('metric') ||
    lower.includes('counter') ||
    lower.includes('numbers')
  ) {
    sections.push({
      type: 'metrics_bar',
      order: order++,
      layout: 'Horizontal tabular row with highlighted numerals and micro-labels',
      description: 'Quantitative credibility indicators and performance telemetry',
      confidence: 'Likely',
    });
  }

  // 6. Testimonials / Social Proof
  if (
    lower.includes('testimonial') ||
    lower.includes('review') ||
    lower.includes('quote') ||
    lower.includes('customer') ||
    lower.includes('trusted by')
  ) {
    sections.push({
      type: 'testimonials',
      order: order++,
      layout: 'Multi-column quote cards or customer endorsement carousel',
      description: 'Third-party validation and peer proof points',
      confidence: 'Likely',
    });
  }

  // 7. Pricing
  if (
    lower.includes('pricing') ||
    lower.includes('tier') ||
    lower.includes('plan') ||
    lower.includes('monthly') ||
    lower.includes('annual')
  ) {
    sections.push({
      type: 'pricing_table',
      order: order++,
      layout: 'Tiered comparative card deck with featured plan highlight',
      description: 'Subscription options, feature comparison, and upgrade triggers',
      confidence: 'Likely',
    });
  }

  // 8. FAQ
  if (lower.includes('faq') || lower.includes('accordion') || lower.includes('frequently asked')) {
    sections.push({
      type: 'faq',
      order: order++,
      layout: 'Collapsible accordion list with clean border dividers',
      description: 'Answers addressing pre-purchase friction points',
      confidence: 'Likely',
    });
  }

  // 9. Call to Action (CTA)
  if (
    lower.includes('cta') ||
    lower.includes('get started') ||
    lower.includes('join') ||
    lower.includes('signup') ||
    lower.includes('contact')
  ) {
    sections.push({
      type: 'cta',
      order: order++,
      layout: 'High-contrast focused banner with prominent conversion buttons',
      description: 'Final prompt compelling visitor action before footer',
      confidence: 'High',
    });
  }

  // 10. Footer
  if (lower.includes('<footer') || lower.includes('footer')) {
    sections.push({
      type: 'footer',
      order: order++,
      layout: 'Multi-column site index with legal credentials and copyright',
      description: 'Comprehensive directory and sovereign brand identifiers',
      confidence: 'High',
    });
  }

  // If no sections could be identified, fallback to standard modern web anatomy
  if (sections.length === 0) {
    return [
      {
        type: 'navigation',
        order: 1,
        layout: 'Header bar with site branding',
        description: 'Global navigation',
        confidence: 'Possible',
      },
      {
        type: 'hero',
        order: 2,
        layout: 'Primary landing viewport',
        description: 'Main introduction',
        confidence: 'Possible',
      },
      {
        type: 'content_body',
        order: 3,
        layout: 'Editorial content container',
        description: 'Core page content',
        confidence: 'Possible',
      },
      {
        type: 'footer',
        order: 4,
        layout: 'Bottom index',
        description: 'Footer links',
        confidence: 'Possible',
      },
    ];
  }

  return sections;
}
