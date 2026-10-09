import { WebsiteDefinition, SectionDefinition, WebsiteTheme } from '../../src/types/website-definition';

export function validateAndSanitizeWebsiteDefinition(
  raw: any,
  fallbackName: string
): WebsiteDefinition {
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fallbackName;
  const tagline = typeof raw.tagline === 'string' ? raw.tagline : 'Modern Software Architecture';
  const description =
    typeof raw.description === 'string'
      ? raw.description
      : 'Original website inspired by digital craft.';
  const industry = typeof raw.industry === 'string' ? raw.industry : 'SaaS';
  const websiteType = typeof raw.websiteType === 'string' ? raw.websiteType : 'Landing page';

  const theme: WebsiteTheme = {
    primaryColor: raw.theme?.primaryColor || '#09090B',
    secondaryColor: raw.theme?.secondaryColor || '#27272A',
    accentColor: raw.theme?.accentColor || '#3B82F6',
    backgroundColor: raw.theme?.backgroundColor || '#FAFAF8',
    cardBackground: raw.theme?.cardBackground || '#FFFFFF',
    textColor: raw.theme?.textColor || '#09090B',
    mutedTextColor: raw.theme?.mutedTextColor || '#71717A',
    borderColor: raw.theme?.borderColor || 'rgba(0,0,0,0.08)',
    fontHeading: raw.theme?.fontHeading || 'Plus Jakarta Sans',
    fontBody: raw.theme?.fontBody || 'Plus Jakarta Sans',
    radius: (raw.theme?.radius || 'md') as 'none' | 'sm' | 'md' | 'lg' | 'full',
    mode: raw.theme?.mode === 'dark' ? 'dark' : 'light',
  };

  const sections: SectionDefinition[] = Array.isArray(raw.sections)
    ? raw.sections.map((s: any, idx: number) => ({
        ...s,
        id: s.id || `section_${idx + 1}_${Math.random().toString(36).substr(2, 5)}`,
      }))
    : [];

  // Ensure navbar exists at top
  if (!sections.some((s) => s.type === 'navbar')) {
    sections.unshift({
      id: `navbar_${Date.now()}`,
      type: 'navbar',
      brandName: name,
      links: [
        { label: 'Capabilities', href: '#features' },
        { label: 'Architecture', href: '#showcase' },
        { label: 'Pricing', href: '#pricing' },
      ],
      primaryCta: { label: 'Get Started', href: '#cta' },
      isSticky: true,
    });
  }

  // Ensure footer exists at bottom
  if (!sections.some((s) => s.type === 'footer')) {
    sections.push({
      id: `footer_${Date.now()}`,
      type: 'footer',
      brandName: name,
      tagline,
      columns: [
        {
          title: 'Product',
          links: [
            { label: 'Features', href: '#' },
            { label: 'Roadmap', href: '#' },
            { label: 'Security', href: '#' },
          ],
        },
        {
          title: 'Company',
          links: [
            { label: 'About', href: '#' },
            { label: 'Careers', href: '#' },
            { label: 'Contact', href: '#' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} ${name}. All rights reserved.`,
    });
  }

  return {
    id: raw.id || `proj_${Date.now()}`,
    name,
    tagline,
    description,
    industry,
    websiteType,
    theme,
    sections,
    meta: {
      title: raw.meta?.title || `${name} — ${tagline}`,
      description: raw.meta?.description || description,
      keywords: Array.isArray(raw.meta?.keywords) ? raw.meta.keywords : [industry, 'Platform', 'Modern'],
    },
  };
}
