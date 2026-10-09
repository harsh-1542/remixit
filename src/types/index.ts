export interface Website {
  id: string;
  slug: string;
  name: string;
  description: string;
  category:
    | 'SaaS'
    | 'AI'
    | 'Finance'
    | 'Agency'
    | 'E-commerce'
    | 'Real Estate'
    | 'Healthcare'
    | 'Education'
    | 'Restaurant'
    | 'Portfolio'
    | 'Architecture';
  style:
    | 'Minimal'
    | 'Swiss'
    | 'Editorial'
    | 'Bento'
    | 'Brutalist'
    | '3D'
    | 'Luxury'
    | 'Dark'
    | 'Corporate'
    | 'Futuristic';
  tags: string[];
  features: string[];
  technologies: string[];
  colors: string[];
  featured: boolean;
  popularity: number;
  year?: number;
  designHighlights: {
    typography: string;
    layout: string;
    vibe: string;
    gridSystem: string;
  };
  previewType:
    | 'minimal-saas'
    | 'dark-ai'
    | 'editorial-architecture'
    | 'luxury-agency'
    | 'modern-finance'
    | 'bento-portfolio'
    | 'swiss-studio'
    | 'clean-health'
    | 'culinary-craft'
    | 'neo-brutalist';
}

export type CategoryName = Website['category'];
export type StyleName = Website['style'];

export interface FilterState {
  search: string;
  category: string;
  style: string;
  feature: string;
  technology: string;
  sortBy: 'featured' | 'popular' | 'newest';
}
