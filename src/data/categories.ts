export interface CategoryMeta {
  id: string;
  name: string;
  count: number;
  description: string;
  aesthetic: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'AI',
    name: 'AI',
    count: 4,
    description: 'Autonomous interfaces, neural consoles, and low-light product studios.',
    aesthetic: 'High-contrast, luminous typography, subdued grids',
  },
  {
    id: 'SaaS',
    name: 'SaaS',
    count: 5,
    description: 'Modern software tools prioritizing clarity, density, and conversion.',
    aesthetic: 'Clean whites, balanced rhythm, subtle hairline borders',
  },
  {
    id: 'Finance',
    name: 'Finance',
    count: 3,
    description: 'High-trust liquidity dashboards, quantitative layouts, and institutional poise.',
    aesthetic: 'Tabular data, precision charts, disciplined typography',
  },
  {
    id: 'Agency',
    name: 'Agency',
    count: 3,
    description: 'Bold creative studios, experimental art direction, and typography-first layouts.',
    aesthetic: 'Oversized serif headings, asymmetrical flow, spatial tension',
  },
  {
    id: 'E-commerce',
    name: 'E-commerce',
    count: 3,
    description: 'Tactile product staging, editorial lookbooks, and friction-free purchase paths.',
    aesthetic: 'Minimalist product grids, subtle earth tones, tactile imagery',
  },
  {
    id: 'Real Estate',
    name: 'Real Estate',
    count: 2,
    description: 'Architectural living spaces, spatial blueprints, and immersive gallery viewports.',
    aesthetic: 'Expansive photography, classical grid systems, serene palettes',
  },
  {
    id: 'Portfolio',
    name: 'Portfolio',
    count: 3,
    description: 'Individual designers, engineers, and creative technologists curating selected work.',
    aesthetic: 'Bento modular grids, personal voice, interactive micro-states',
  },
  {
    id: 'Architecture',
    name: 'Architecture',
    count: 3,
    description: 'Spatial monographs, structural monographs, and brutalist structural forms.',
    aesthetic: 'Swiss typography, generous negative space, raw geometry',
  },
  {
    id: 'Healthcare',
    name: 'Healthcare',
    count: 2,
    description: 'Evidence-based clinical software, patient outcomes, and gentle scientific clarity.',
    aesthetic: 'Serene blues, humane typography, approachable structure',
  },
  {
    id: 'Education',
    name: 'Education',
    count: 2,
    description: 'Curated curriculum portals, interactive research labs, and structured knowledge.',
    aesthetic: 'Legible serif headers, chaptered indexes, balanced rhythm',
  },
  {
    id: 'Restaurant',
    name: 'Restaurant',
    count: 2,
    description: 'Culinary storytelling, seasonal tasting menus, and intimate hospitality atmospheres.',
    aesthetic: 'Warm parchment tones, bespoke serif titles, editorial menus',
  },
];

export const STYLES = [
  'All',
  'Minimal',
  'Swiss',
  'Editorial',
  'Bento',
  'Brutalist',
  '3D',
  'Luxury',
  'Dark',
  'Corporate',
  'Futuristic',
];

export const FEATURES = [
  'All',
  'Animation',
  '3D',
  'Video',
  'Bento',
  'Pricing',
  'Testimonials',
  'Interactive Hero',
  'Dashboard',
  'Product Showcase',
  'Parallax',
];

export const TECHNOLOGIES = [
  'All',
  'React',
  'Next.js',
  'Webflow',
  'WordPress',
];
