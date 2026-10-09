import { VisionProvider } from './provider';
import { WebsiteAnalysisInput, DesignSpecification } from '../types';

export class MockVisionProvider implements VisionProvider {
  name = 'MockVisionProvider';

  async analyzeWebsite(input: WebsiteAnalysisInput): Promise<DesignSpecification> {
    const { url, metadata, sections, technologies } = input;
    const hostname = new URL(url).hostname.replace(/^www\./, '');

    // Context-sensitive archetype detection based on words in title/description/url
    const fullText = `${url} ${metadata.title} ${metadata.description}`.toLowerCase();

    let primaryStyle = 'Minimal SaaS';
    let theme: 'light' | 'dark' | 'mixed' = 'light';
    let colors = {
      primary: ['#09090B', '#18181B'],
      backgrounds: ['#FAFAF8', '#FFFFFF'],
      text: ['#09090B', '#71717A'],
      accents: ['#3B82F6', '#22C55E'],
    };
    let vibeDescription = 'Disciplined, high-velocity engineering platform with crisp typography and subtle borders.';

    if (fullText.includes('ai') || fullText.includes('neural') || fullText.includes('compute') || fullText.includes('dark')) {
      primaryStyle = 'Dark Futuristic';
      theme = 'dark';
      colors = {
        primary: ['#000000', '#09090B'],
        backgrounds: ['#09090B', '#121214'],
        text: ['#F4F4F5', '#A1A1AA'],
        accents: ['#22C55E', '#10B981'],
      };
      vibeDescription = 'Subdued low-light command center with emerald glowing telemetry and high-contrast figures.';
    } else if (fullText.includes('arch') || fullText.includes('studio') || fullText.includes('monograph') || fullText.includes('stone')) {
      primaryStyle = 'Editorial Architecture';
      theme = 'light';
      colors = {
        primary: ['#1C1917', '#292524'],
        backgrounds: ['#F5F5F0', '#E7E5E4'],
        text: ['#292524', '#78716C'],
        accents: ['#854D0E', '#A8A29E'],
      };
      vibeDescription = 'Serene tactile presence with monolithic negative space and classical serif typography.';
    } else if (fullText.includes('finance') || fullText.includes('capital') || fullText.includes('bank') || fullText.includes('treasury')) {
      primaryStyle = 'Swiss Finance';
      theme = 'light';
      colors = {
        primary: ['#0F172A', '#1E293B'],
        backgrounds: ['#F8FAFC', '#FFFFFF'],
        text: ['#0F172A', '#64748B'],
        accents: ['#0284C7', '#0EA5E9'],
      };
      vibeDescription = 'Institutional solidity with tabular alignment, strict 16-column grid and liquidity telemetry.';
    }

    return {
      site: {
        title: metadata.title || hostname,
        description: metadata.description || 'Modern digital interface reference.',
        category: primaryStyle.split(' ')[1] || 'SaaS',
        normalizedUrl: url,
      },
      visualStyle: {
        primaryStyle,
        secondaryStyles: ['Swiss Grid', 'Bento Modularity', 'High-Density Typography'],
        theme,
        vibeDescription,
      },
      colors,
      typography: {
        headingStyle: 'Geometric Neo-Grotesque with tight optical tracking (-0.03em)',
        bodyStyle: 'High-legibility humanist sans-serif with 1.6 line height',
        hierarchy: 'Dramatic scale: 64px display / 32px subheadings / 14px micro-labels',
        alignment: 'Left-aligned content column with centered hero headlines',
        estimatedFontFamilies: ['Plus Jakarta Sans', 'Inter', 'JetBrains Mono'],
      },
      layout: {
        maxWidth: '1440px viewport with 1200px inner container',
        grid: '12-column modular grid with 24px column gutters and hairline border partitions',
        spacing: 'Generous vertical rhythm (80px to 120px between core sections)',
        alignment: 'Strict left-aligned grid spine with asymmetric media anchors',
      },
      sections: sections.length > 0 ? sections : [
        {
          type: 'navigation',
          order: 1,
          layout: 'Sticky top bar with wordmark, central links, and primary CTA',
          description: 'Global site header',
        },
        {
          type: 'hero',
          order: 2,
          layout: 'Asymmetric split headline with product demonstration canvas',
          description: 'Primary value proposition',
        },
        {
          type: 'feature_grid',
          order: 3,
          layout: '3-column modular cards with subtle border separators',
          description: 'Capabilities breakdown',
        },
        {
          type: 'cta',
          order: 4,
          layout: 'Focused conversion banner with dual action buttons',
          description: 'Action invitation',
        },
        {
          type: 'footer',
          order: 5,
          layout: 'Multi-column navigational index with copyright',
          description: 'Bottom directory',
        },
      ],
      components: [
        'Sticky Navigation Bar',
        'Asymmetric Hero Stage',
        'Modular Feature Grid',
        'Bento Cards',
        'Tabular Telemetry Row',
        'High-Contrast Primary Buttons',
        'Hairline Divider Borders',
      ],
      features: [
        'Interactive Hero Canvas',
        'Responsive Breakpoints',
        'Micro-interactions on Hover',
        'Sticky Navigation Bar',
        'Structured Typographic Hierarchy',
      ],
      imagery: {
        style: 'High-fidelity product UI mockups with subtle drop shadow depth',
        usage: 'Generous visual breathing room without arbitrary stock illustration blobs',
      },
      responsive: {
        desktop: '1440px wide 3-column / 12-column expansive spatial distribution',
        mobile: 'Single column vertical stack with drawer navigation and full-width touch targets',
      },
      animation: {
        present: true,
        characteristics: [
          'Subtle button scale and background color transition (150ms ease-out)',
          'Sticky navbar backdrop-blur opacity ramp on scroll',
          'Card hover elevation with hairline border accentuation',
        ],
      },
      technologies,
    };
  }
}
