export interface PlanEntitlements {
  maxProjects: number;
  maxAnalysesPerMonth: number;
  maxGenerationsPerMonth: number;
  customDomainsAllowed: number;
  githubSyncAllowed: boolean;
  sourceExportAllowed: boolean;
  priorityModels: boolean;
  badge: string;
}

export interface PlanConfig {
  id: 'free' | 'pro' | 'business';
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number; // in USD
  priceAnnual: number; // in USD per year
  currency: string;
  includedMonthlyCredits: number;
  isPopular?: boolean;
  entitlements: PlanEntitlements;
  features: string[];
}

export interface CreditPackConfig {
  id: 'pack_starter' | 'pack_creator' | 'pack_power';
  name: string;
  credits: number;
  price: number; // in USD
  currency: string;
  pricePerCredit: string;
  description: string;
  badge?: string;
}

export interface CreditCostConfig {
  action: 'analysis' | 'generation' | 'edit' | 'regeneration' | 'section_regeneration';
  name: string;
  cost: number;
  description: string;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Explore and prototype',
    description: 'Perfect for exploring website architecture and testing design remixing.',
    priceMonthly: 0,
    priceAnnual: 0,
    currency: 'USD',
    includedMonthlyCredits: 50,
    entitlements: {
      maxProjects: 3,
      maxAnalysesPerMonth: 5,
      maxGenerationsPerMonth: 3,
      customDomainsAllowed: 0,
      githubSyncAllowed: false,
      sourceExportAllowed: true,
      priorityModels: false,
      badge: 'Starter',
    },
    features: [
      '50 monthly AI credits included',
      '5 URL reference design analyses / month',
      'Up to 3 active saved projects',
      'Interactive website visual editor',
      'Responsive previews (Desktop, Tablet, Mobile)',
      'Standalone website publishing on remix.design',
      'Download complete runnable React/TS code ZIP',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For creators & developers',
    description: 'For freelancers and designers building production-grade web interfaces regularly.',
    priceMonthly: 29,
    priceAnnual: 290, // $24.16/mo (save 17%)
    currency: 'USD',
    includedMonthlyCredits: 500,
    isPopular: true,
    entitlements: {
      maxProjects: 25,
      maxAnalysesPerMonth: 50,
      maxGenerationsPerMonth: 9999,
      customDomainsAllowed: 3,
      githubSyncAllowed: true,
      sourceExportAllowed: true,
      priorityModels: true,
      badge: 'Popular',
    },
    features: [
      '500 monthly AI credits included',
      '50 URL reference analyses / month',
      'Up to 25 saved projects with full version history',
      'Advanced natural language AI website editing',
      'Direct GitHub repository push & 2-way sync',
      '3 Custom Domains with automated SSL/TLS certificates',
      'Full source-code export with all build configurations',
      'High-priority Gemini 2.5 Flash design generation',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'For agencies & teams',
    description: 'Maximum generation throughput, custom domains, and expanded capacity for teams.',
    priceMonthly: 79,
    priceAnnual: 790, // $65.83/mo (save 17%)
    currency: 'USD',
    includedMonthlyCredits: 2000,
    entitlements: {
      maxProjects: 9999,
      maxAnalysesPerMonth: 9999,
      maxGenerationsPerMonth: 9999,
      customDomainsAllowed: 10,
      githubSyncAllowed: true,
      sourceExportAllowed: true,
      priorityModels: true,
      badge: 'Scale',
    },
    features: [
      '2,000 monthly AI credits included',
      'Unlimited website URL reference analyses',
      'Unlimited saved projects and full revisions',
      '10 Custom Domains with edge proxy routing',
      'Direct GitHub repository creation and sync',
      'Fastest generation tier with dedicated priority queue',
      'Custom branding removal on published websites',
      'Early access to experimental generative layout engines',
    ],
  },
};

export const CREDIT_PACKS: CreditPackConfig[] = [
  {
    id: 'pack_starter',
    name: 'Starter Pack',
    credits: 100,
    price: 9,
    currency: 'USD',
    pricePerCredit: '$0.09 / credit',
    description: 'Good for ~20 new website generations or 100 AI design edits.',
  },
  {
    id: 'pack_creator',
    name: 'Creator Pack',
    credits: 300,
    price: 24,
    currency: 'USD',
    pricePerCredit: '$0.08 / credit',
    description: 'Best value for active project remixing and iterative editing.',
    badge: 'Popular',
  },
  {
    id: 'pack_power',
    name: 'Power Pack',
    credits: 1000,
    price: 69,
    currency: 'USD',
    pricePerCredit: '$0.069 / credit',
    description: 'Bulk credits with maximum 23% savings, never expiring.',
    badge: 'Best Value',
  },
];

export const CREDIT_COSTS: CreditCostConfig[] = [
  {
    action: 'analysis',
    name: 'Website URL Reference Analysis',
    cost: 1,
    description: 'Scrapes DOM, captures desktop/mobile screenshots, extracts design tokens & layout hierarchy.',
  },
  {
    action: 'generation',
    name: 'Original AI Website Generation',
    cost: 5,
    description: 'Synthesizes complete responsive multi-section React & Tailwind website with semantic structure.',
  },
  {
    action: 'edit',
    name: 'Natural Language AI Website Edit',
    cost: 1,
    description: 'Applies targeted refinements to color palettes, copy, layout sections, and styling tokens.',
  },
  {
    action: 'regeneration',
    name: 'Full Website Regeneration',
    cost: 5,
    description: 'Regenerates all website sections from scratch based on updated design specification.',
  },
  {
    action: 'section_regeneration',
    name: 'Single Section Regeneration',
    cost: 1,
    description: 'Regenerates a specific component section (hero, features, pricing, etc.) preserving the rest.',
  },
];

export function getCreditCost(action: string): number {
  const item = CREDIT_COSTS.find((c) => c.action === action);
  return item ? item.cost : 1;
}
