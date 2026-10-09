import { GenerationProvider } from './generation-provider';
import { DesignSpecification } from '../types';
import { UserGenerationConfig, WebsiteDefinition, SectionDefinition } from '../../src/types/website-definition';
import { validateAndSanitizeWebsiteDefinition } from '../generation/schema-validator';

export class MockGenerationProvider implements GenerationProvider {
  name = 'MockGenerationProvider';

  async generateWebsite(
    spec: DesignSpecification,
    config: UserGenerationConfig
  ): Promise<WebsiteDefinition> {
    const isDark =
      config.colorPreference === 'dark' ||
      (config.colorPreference === 'reference' && spec.visualStyle?.theme === 'dark');

    // Theme derivation
    let primaryColor = isDark ? '#FFFFFF' : '#09090B';
    let backgroundColor = isDark ? '#09090B' : '#FAFAF8';
    let cardBackground = isDark ? '#18181B' : '#FFFFFF';
    let textColor = isDark ? '#F4F4F5' : '#09090B';
    let mutedTextColor = isDark ? '#A1A1AA' : '#71717A';
    let borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    let accentColor =
      config.customColors?.accent ||
      spec.colors?.accents?.[0] ||
      (isDark ? '#22C55E' : '#3B82F6');

    if (config.colorPreference === 'custom' && config.customColors) {
      if (config.customColors.primary) primaryColor = config.customColors.primary;
      if (config.customColors.background) backgroundColor = config.customColors.background;
    }

    const sections: SectionDefinition[] = [
      // 1. Navigation
      {
        id: `nav_${Date.now()}`,
        type: 'navbar',
        brandName: config.name,
        tagline: 'Autonomous Intelligence Platform',
        links: [
          { label: 'Capabilities', href: '#features' },
          { label: 'Architecture', href: '#showcase' },
          { label: 'Pricing', href: '#pricing' },
          { label: 'FAQ', href: '#faq' },
        ],
        primaryCta: { label: 'Get Started', href: '#cta' },
        secondaryCta: { label: 'Sign In', href: '#' },
        isSticky: true,
      },

      // 2. Hero (Split if SaaS/AI/Finance, Centered otherwise)
      config.industry === 'AI' || config.industry === 'SaaS' || config.industry === 'Finance'
        ? {
            id: `hero_${Date.now()}`,
            type: 'split-hero',
            badge: `${config.industry.toUpperCase()} PLATFORM 2.0`,
            heading: `Next-generation infrastructure for ${config.name}.`,
            description: config.description,
            primaryCta: { label: 'Start Free Trial', href: '#cta' },
            secondaryCta: { label: 'View Documentation', href: '#features' },
            previewType: 'dashboard',
            previewTitle: `${config.name.toUpperCase()} ENGINE`,
            previewDetails: [
              { label: 'Core Throughput', value: '1.2B ops/s' },
              { label: 'Global Latency', value: '< 18ms' },
              { label: 'Uptime Protocol', value: '99.99%' },
            ],
          }
        : {
            id: `hero_${Date.now()}`,
            type: 'centered-hero',
            badge: `CURATED FOR ${config.industry.toUpperCase()}`,
            heading: `Elevating craft and performance for ${config.name}.`,
            description: config.description,
            primaryCta: { label: 'Explore Services', href: '#cta' },
            secondaryCta: { label: 'Schedule Consultation', href: '#features' },
            microCopy: 'Designed with precision · Zero compromise',
          },

      // 3. Stats section
      {
        id: `stats_${Date.now()}`,
        type: 'stats-section',
        heading: 'MEASURABLE OPERATIONAL VELOCITY',
        stats: [
          { value: '10x', label: 'Faster Execution', change: '+320% YoY' },
          { value: '< 25ms', label: 'Response Latency' },
          { value: '99.99%', label: 'Infrastructure Availability' },
          { value: '140k+', label: 'Teams Worldwide', change: '+45% QoQ' },
        ],
      },

      // 4. Feature or Bento Grid
      spec.visualStyle?.primaryStyle?.toLowerCase().includes('bento') ||
      config.additionalInstructions?.toLowerCase().includes('bento')
        ? {
            id: `bento_${Date.now()}`,
            type: 'bento-grid',
            badge: 'MODULAR ARCHITECTURE',
            heading: 'Engineered for high-concurrency workflows.',
            description:
              'A cohesive design system built from the ground up for resilience and speed.',
            items: [
              {
                title: 'Automated Task Orchestration',
                description:
                  'Multi-agent pipelines that run continuously across distributed clusters without deadlock.',
                size: 'wide',
                highlightMetric: '99.9%',
                highlightLabel: 'Pipeline Accuracy',
                tag: 'CORE ENGINE',
              },
              {
                title: 'Zero-Egress Security',
                description: 'End-to-end cryptographic encapsulation and air-gapped secrets governance.',
                size: 'normal',
                tag: 'GOVERNANCE',
              },
              {
                title: 'Real-time Telemetry Stream',
                description: 'Live observability dashboards with microsecond anomaly notifications.',
                size: 'normal',
                tag: 'MONITORING',
              },
              {
                title: 'Instant Multi-Cloud Deployment',
                description: 'Run on AWS, GCP, or bare metal with zero vendor lock-in or container re-compiles.',
                size: 'wide',
                highlightMetric: '< 2.4s',
                highlightLabel: 'Cold Boot Time',
                tag: 'ORCHESTRATION',
              },
            ],
          }
        : {
            id: `features_${Date.now()}`,
            type: 'feature-grid',
            badge: 'CAPABILITIES',
            heading: 'Everything required to build at planetary scale.',
            description:
              'Thoughtfully architected primitives that work together seamlessly.',
            columns: 3,
            features: [
              {
                title: 'Predictive Inference',
                description:
                  'Low-latency model dispatch engineered for real-time customer touchpoints.',
              },
              {
                title: 'State Synchronization',
                description:
                  'Instant bidirectional sync with zero conflict resolution bottlenecks.',
              },
              {
                title: 'Granular Access Policies',
                description:
                  'Role-based permissions with audit logging and immutable verification.',
              },
            ],
          },

      // 5. Product Showcase
      {
        id: `showcase_${Date.now()}`,
        type: 'product-showcase',
        badge: 'INTERFACE SHOWCASE',
        heading: 'An interface designed for deep focus.',
        description: 'Eliminate friction and focus on what matters most to your organization.',
        tabs: [
          {
            id: 'tab1',
            label: 'Workflow Automation',
            description:
              'Visual nodes and code-first orchestration combined in an ergonomic single pane of glass.',
            previewNote: 'Automated pipeline state: Optimal',
          },
          {
            id: 'tab2',
            label: 'Telemetry Engine',
            description: 'Monitor token expenditure, error spikes, and edge caching in millisecond resolution.',
            previewNote: 'Continuous latency telemetry: Active',
          },
          {
            id: 'tab3',
            label: 'API Integration',
            description: 'Idiomatic client SDKs for TypeScript, Python, and Go with typed interfaces.',
            previewNote: 'SDK compatibility: Universal',
          },
        ],
      },

      // 6. Testimonials
      {
        id: `testimonials_${Date.now()}`,
        type: 'testimonials',
        badge: 'PEER VALIDATION',
        heading: 'Trusted by engineering and design leaders.',
        description: 'See why modern organizations standardize on our architectural foundation.',
        testimonials: [
          {
            quote:
              'Remix reduced our time-to-market from quarters to weeks while elevating our visual polish.',
            author: 'Elena Rostova',
            role: 'VP of Product',
            company: 'Vanguard Systems',
            rating: 5,
          },
          {
            quote:
              'The spatial discipline and typographic hierarchy surpassed every tool we previously evaluated.',
            author: 'Marcus Vance',
            role: 'Founding Engineer',
            company: 'Hyperion Labs',
            rating: 5,
          },
          {
            quote:
              'Originality without compromise. Our conversion metrics tripled after the redesign.',
            author: 'Aria Chen',
            role: 'Head of Growth',
            company: 'Nexus Finance',
            rating: 5,
          },
        ],
      },

      // 7. Pricing
      {
        id: `pricing_${Date.now()}`,
        type: 'pricing',
        badge: 'TRANSPARENT VALUE',
        heading: 'Predictable pricing for every stage.',
        description: 'Start free with generous quotas, scale seamlessly as demand grows.',
        plans: [
          {
            name: 'Starter',
            price: '$0',
            cadence: 'forever free',
            description: 'Perfect for prototyping, early validations, and individual hackers.',
            features: ['Up to 5 concurrent projects', 'Community design templates', 'Standard support'],
            isPopular: false,
            ctaLabel: 'Start for Free',
          },
          {
            name: 'Growth',
            price: '$49',
            cadence: 'per user / month',
            description: 'For velocity software teams building mission-critical interfaces.',
            features: [
              'Unlimited active projects',
              'AI design synthesis & edits',
              'Custom domain routing',
              'Priority technical support',
              'Export full TypeScript code',
            ],
            isPopular: true,
            ctaLabel: 'Upgrade to Growth',
          },
          {
            name: 'Enterprise',
            price: 'Custom',
            cadence: 'annual agreement',
            description: 'Dedicated VPC isolation, custom SLA guarantees, and design audit reviews.',
            features: ['Single Sign-On (SAML/Okta)', 'Custom security posture', 'Dedicated success architect'],
            isPopular: false,
            ctaLabel: 'Contact Sales',
          },
        ],
      },

      // 8. FAQ
      {
        id: `faq_${Date.now()}`,
        type: 'faq',
        badge: 'FREQUENTLY ASKED QUESTIONS',
        heading: 'Common questions & answers.',
        description: 'Everything you need to know about our platform.',
        items: [
          {
            question: 'How does the design synthesis guarantee originality?',
            answer:
              'The engine extracts abstract spatial ratios, typographic scales, and layout arrangements from reference inspiration without reproducing proprietary copy, logos, or assets.',
          },
          {
            question: 'Can I export clean source code?',
            answer:
              'Yes, you can download a complete standalone React and TypeScript project with Tailwind CSS ready to run immediately with npm install and npm run dev.',
          },
          {
            question: 'Does this integrate with our existing design system?',
            answer:
              'Yes, color tokens, typography scales, and border radiuses are customizable through natural language instructions or explicit token overrides.',
          },
        ],
      },

      // 9. CTA Banner
      {
        id: `cta_${Date.now()}`,
        type: 'cta',
        badge: 'START TODAY',
        heading: `Experience the power of ${config.name}.`,
        description:
          'Join forward-thinking product teams building exceptional digital experiences today.',
        primaryCta: { label: 'Get Started Now', href: '#' },
        secondaryCta: { label: 'Talk to an Engineer', href: '#' },
      },

      // 10. Footer
      {
        id: `footer_${Date.now()}`,
        type: 'footer',
        brandName: config.name,
        tagline: 'Precision digital craft for modern software organizations.',
        columns: [
          {
            title: 'Platform',
            links: [
              { label: 'Capabilities', href: '#features' },
              { label: 'Showcase', href: '#showcase' },
              { label: 'Pricing', href: '#pricing' },
            ],
          },
          {
            title: 'Resources',
            links: [
              { label: 'Documentation', href: '#' },
              { label: 'Guides', href: '#' },
              { label: 'Changelog', href: '#' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About', href: '#' },
              { label: 'Security', href: '#' },
              { label: 'Terms & Privacy', href: '#' },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} ${config.name}. All rights reserved.`,
      },
    ];

    const raw = {
      name: config.name,
      tagline: `Modern ${config.industry} Platform`,
      description: config.description,
      industry: config.industry,
      websiteType: config.websiteType,
      theme: {
        primaryColor,
        secondaryColor: isDark ? '#27272A' : '#18181B',
        accentColor,
        backgroundColor,
        cardBackground,
        textColor,
        mutedTextColor,
        borderColor,
        fontHeading: spec.typography?.headingStyle || 'Plus Jakarta Sans',
        fontBody: spec.typography?.bodyStyle || 'Plus Jakarta Sans',
        radius: 'md',
        mode: isDark ? 'dark' : 'light',
      },
      sections,
      meta: {
        title: `${config.name} — Modern ${config.industry} Solution`,
        description: config.description,
        keywords: [config.name, config.industry, config.websiteType],
      },
    };

    return validateAndSanitizeWebsiteDefinition(raw, config.name);
  }

  async editWebsite(
    current: WebsiteDefinition,
    instruction: string
  ): Promise<WebsiteDefinition> {
    const updated = JSON.parse(JSON.stringify(current)) as WebsiteDefinition;
    const lower = instruction.toLowerCase();

    // 1. Accent color edit
    if (lower.includes('violet') || lower.includes('purple')) {
      updated.theme.accentColor = '#8B5CF6';
    } else if (lower.includes('emerald') || lower.includes('green')) {
      updated.theme.accentColor = '#10B981';
    } else if (lower.includes('blue') || lower.includes('sky')) {
      updated.theme.accentColor = '#0EA5E9';
    } else if (lower.includes('amber') || lower.includes('orange')) {
      updated.theme.accentColor = '#F59E0B';
    } else if (lower.includes('rose') || lower.includes('red')) {
      updated.theme.accentColor = '#F43F5E';
    }

    // 2. Dark/Light mode toggle
    if (lower.includes('dark mode') || lower.includes('dark theme')) {
      updated.theme.mode = 'dark';
      updated.theme.backgroundColor = '#09090B';
      updated.theme.cardBackground = '#18181B';
      updated.theme.textColor = '#F4F4F5';
      updated.theme.mutedTextColor = '#A1A1AA';
      updated.theme.borderColor = 'rgba(255,255,255,0.1)';
      updated.theme.primaryColor = '#FFFFFF';
    } else if (lower.includes('light mode') || lower.includes('white background')) {
      updated.theme.mode = 'light';
      updated.theme.backgroundColor = '#FAFAF8';
      updated.theme.cardBackground = '#FFFFFF';
      updated.theme.textColor = '#09090B';
      updated.theme.mutedTextColor = '#71717A';
      updated.theme.borderColor = 'rgba(0,0,0,0.08)';
      updated.theme.primaryColor = '#09090B';
    }

    // 3. Bento grid substitution
    if (lower.includes('bento')) {
      const featIdx = updated.sections.findIndex((s) => s.type === 'feature-grid');
      if (featIdx !== -1) {
        updated.sections[featIdx] = {
          id: `bento_${Date.now()}`,
          type: 'bento-grid',
          badge: 'MODULAR ARCHITECTURE',
          heading: 'High-density bento grid system.',
          description: 'Engineered for exceptional spatial balance and modularity.',
          items: [
            {
              title: 'Automated Task Orchestration',
              description: 'Multi-agent pipelines running continuously with microsecond dispatch.',
              size: 'wide',
              highlightMetric: '99.9%',
              highlightLabel: 'Accuracy',
              tag: 'ORCHESTRATION',
            },
            {
              title: 'Cryptographic Security',
              description: 'End-to-end token encryption and sovereign key governance.',
              size: 'normal',
              tag: 'SECURITY',
            },
            {
              title: 'Real-time Telemetry',
              description: 'Continuous metrics stream with zero ingest lag.',
              size: 'normal',
              tag: 'OBSERVABILITY',
            },
          ],
        };
      }
    }

    // 4. Hero minimalism
    if (lower.includes('minimal')) {
      const hero = updated.sections.find((s) => s.type === 'centered-hero' || s.type === 'split-hero');
      if (hero && hero.type === 'split-hero') {
        (hero as any).type = 'centered-hero';
        (hero as any).microCopy = 'Refined minimal architecture';
      }
    }

    // 5. Add pricing if missing
    if (lower.includes('pricing') && !updated.sections.some((s) => s.type === 'pricing')) {
      const ctaIdx = updated.sections.findIndex((s) => s.type === 'cta');
      const insertAt = ctaIdx !== -1 ? ctaIdx : updated.sections.length - 1;
      updated.sections.splice(insertAt, 0, {
        id: `pricing_${Date.now()}`,
        type: 'pricing',
        badge: 'PRICING TIERS',
        heading: 'Transparent plans for modern teams.',
        description: 'Straightforward billing designed to scale with your usage.',
        plans: [
          {
            name: 'Essential',
            price: '$29',
            cadence: '/ month',
            description: 'Core tools for small projects.',
            features: ['Full platform access', 'Standard export', 'Community support'],
            ctaLabel: 'Choose Essential',
          },
          {
            name: 'Professional',
            price: '$79',
            cadence: '/ month',
            description: 'Advanced features and priority support.',
            features: ['Unlimited exports', 'Custom domain', 'Priority AI generation'],
            isPopular: true,
            ctaLabel: 'Choose Professional',
          },
        ],
      });
    }

    return validateAndSanitizeWebsiteDefinition(updated, current.name);
  }
}
