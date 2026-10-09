export type AnalysisStatus =
  | 'queued'
  | 'loading'
  | 'capturing'
  | 'extracting'
  | 'analyzing'
  | 'completed'
  | 'failed';

export interface PageMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  language?: string;
  favicon?: string;
  ogTitle?: string;
  ogDescription?: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  navigationItems: string[];
  buttons: string[];
  linksCount: number;
  imagesCount: number;
  hasVideo: boolean;
  hasForms: boolean;
}

export interface InferredSection {
  type: string;
  order: number;
  layout: string;
  description: string;
  confidence?: string;
}

export interface DetectedTechnology {
  name: string;
  confidence: 'High' | 'Likely' | 'Possible';
  category: string;
}

export interface DesignSpecification {
  site: {
    title: string;
    description?: string;
    category?: string;
    normalizedUrl: string;
  };
  visualStyle: {
    primaryStyle: string;
    secondaryStyles: string[];
    theme: 'light' | 'dark' | 'mixed';
    vibeDescription: string;
  };
  colors: {
    primary: string[];
    backgrounds: string[];
    text: string[];
    accents: string[];
  };
  typography: {
    headingStyle: string;
    bodyStyle: string;
    hierarchy: string;
    alignment: string;
    estimatedFontFamilies?: string[];
  };
  layout: {
    maxWidth: string;
    grid: string;
    spacing: string;
    alignment: string;
  };
  sections: InferredSection[];
  components: string[];
  features: string[];
  imagery: {
    style: string;
    usage: string;
  };
  responsive: {
    desktop: string;
    mobile: string;
  };
  animation: {
    present: boolean;
    characteristics: string[];
  };
  technologies?: DetectedTechnology[];
}

export interface WebsiteAnalysisInput {
  url: string;
  metadata: PageMetadata;
  sections: InferredSection[];
  technologies: DetectedTechnology[];
  desktopScreenshotBase64?: string;
  mobileScreenshotBase64?: string;
}

export interface AnalysisJob {
  id: string;
  url: string;
  normalizedUrl: string;
  status: AnalysisStatus;
  progress: number;
  currentStage: string;
  createdAt: number;
  updatedAt: number;
  desktopScreenshot?: string; // data:image/jpeg;base64,...
  mobileScreenshot?: string;
  metadata?: PageMetadata;
  designSpec?: DesignSpecification;
  error?: string;
}
