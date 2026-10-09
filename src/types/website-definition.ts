export interface WebsiteTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackground: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  fontHeading: string;
  fontBody: string;
  radius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  mode: 'light' | 'dark';
}

export type SectionType =
  | 'navbar'
  | 'centered-hero'
  | 'split-hero'
  | 'image-hero'
  | 'feature-grid'
  | 'bento-grid'
  | 'stats-section'
  | 'logo-cloud'
  | 'product-showcase'
  | 'image-text'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'contact'
  | 'cta'
  | 'footer';

export interface NavbarSection {
  id: string;
  type: 'navbar';
  brandName: string;
  tagline?: string;
  links: Array<{ label: string; href: string }>;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  isSticky?: boolean;
}

export interface CenteredHeroSection {
  id: string;
  type: 'centered-hero';
  badge?: string;
  heading: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  microCopy?: string;
}

export interface SplitHeroSection {
  id: string;
  type: 'split-hero';
  badge?: string;
  heading: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  previewType: 'dashboard' | 'code' | 'metric-card' | 'device';
  previewTitle?: string;
  previewDetails?: Array<{ label: string; value: string }>;
}

export interface ImageHeroSection {
  id: string;
  type: 'image-hero';
  badge?: string;
  heading: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  imageCaption?: string;
}

export interface FeatureItem {
  iconName?: string;
  title: string;
  description: string;
  tag?: string;
}

export interface FeatureGridSection {
  id: string;
  type: 'feature-grid';
  badge?: string;
  heading: string;
  description?: string;
  columns?: 2 | 3 | 4;
  features: FeatureItem[];
}

export interface BentoItem {
  title: string;
  description: string;
  size: 'normal' | 'wide' | 'tall';
  highlightMetric?: string;
  highlightLabel?: string;
  tag?: string;
}

export interface BentoGridSection {
  id: string;
  type: 'bento-grid';
  badge?: string;
  heading: string;
  description?: string;
  items: BentoItem[];
}

export interface StatsItem {
  value: string;
  label: string;
  change?: string;
}

export interface StatsSection {
  id: string;
  type: 'stats-section';
  heading?: string;
  stats: StatsItem[];
}

export interface LogoCloudSection {
  id: string;
  type: 'logo-cloud';
  heading?: string;
  logos: Array<{ name: string; category?: string }>;
}

export interface ProductShowcaseSection {
  id: string;
  type: 'product-showcase';
  badge?: string;
  heading: string;
  description?: string;
  activeTab?: string;
  tabs?: Array<{ id: string; label: string; description: string; previewNote: string }>;
}

export interface ImageTextSection {
  id: string;
  type: 'image-text';
  badge?: string;
  heading: string;
  description: string;
  points: string[];
  ctaLabel?: string;
  reversed?: boolean;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating?: number;
}

export interface TestimonialGridSection {
  id: string;
  type: 'testimonials';
  badge?: string;
  heading: string;
  description?: string;
  testimonials: TestimonialItem[];
}

export interface PricingPlan {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaLabel: string;
}

export interface PricingSection {
  id: string;
  type: 'pricing';
  badge?: string;
  heading: string;
  description?: string;
  annualDiscountNote?: string;
  plans: PricingPlan[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  type: 'faq';
  badge?: string;
  heading: string;
  description?: string;
  items: FaqItem[];
}

export interface ContactSection {
  id: string;
  type: 'contact';
  badge?: string;
  heading: string;
  description: string;
  email: string;
  fields?: string[];
}

export interface CtaSection {
  id: string;
  type: 'cta';
  badge?: string;
  heading: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface FooterSection {
  id: string;
  type: 'footer';
  brandName: string;
  tagline: string;
  columns: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
  copyright: string;
}

export type SectionDefinition =
  | NavbarSection
  | CenteredHeroSection
  | SplitHeroSection
  | ImageHeroSection
  | FeatureGridSection
  | BentoGridSection
  | StatsSection
  | LogoCloudSection
  | ProductShowcaseSection
  | ImageTextSection
  | TestimonialGridSection
  | PricingSection
  | FaqSection
  | ContactSection
  | CtaSection
  | FooterSection;

export interface WebsiteDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  websiteType: string;
  theme: WebsiteTheme;
  sections: SectionDefinition[];
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface UserGenerationConfig {
  name: string;
  description: string;
  industry: string;
  websiteType: string;
  colorPreference: 'reference' | 'light' | 'dark' | 'custom';
  customColors?: {
    primary?: string;
    accent?: string;
    background?: string;
  };
  additionalInstructions?: string;
}

export type GenerationStatus =
  | 'queued'
  | 'preparing-spec'
  | 'planning-structure'
  | 'generating-sections'
  | 'validating-components'
  | 'rendering-preview'
  | 'completed'
  | 'failed';

export interface GenerationJob {
  id: string;
  projectId: string;
  referenceJobId?: string;
  status: GenerationStatus;
  progress: number;
  currentStage: string;
  config: UserGenerationConfig;
  websiteDefinition?: WebsiteDefinition;
  version: number;
  history?: WebsiteDefinition[];
  createdAt: number;
  updatedAt: number;
  error?: string;
}
