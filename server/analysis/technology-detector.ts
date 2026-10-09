import { DetectedTechnology } from '../types';

export function detectTechnologies(html: string): DetectedTechnology[] {
  const detected: DetectedTechnology[] = [];
  const lower = html.toLowerCase();

  // 1. Next.js
  if (
    lower.includes('__next') ||
    lower.includes('_next/static') ||
    lower.includes('next-route-announcer') ||
    lower.includes('__next_data__')
  ) {
    detected.push({
      name: 'Next.js',
      confidence: lower.includes('__next_data__') || lower.includes('_next/static') ? 'High' : 'Likely',
      category: 'Full-stack Framework',
    });
  }

  // 2. React
  if (
    lower.includes('react') ||
    lower.includes('react-dom') ||
    lower.includes('_react') ||
    lower.includes('data-reactroot') ||
    detected.some((d) => d.name === 'Next.js')
  ) {
    if (!detected.some((d) => d.name === 'React')) {
      detected.push({
        name: 'React',
        confidence: lower.includes('data-reactroot') || lower.includes('react-dom') ? 'High' : 'Likely',
        category: 'UI Library',
      });
    }
  }

  // 3. Nuxt / Vue
  if (lower.includes('__nuxt') || lower.includes('_nuxt/') || lower.includes('data-v-')) {
    detected.push({
      name: 'Nuxt.js',
      confidence: lower.includes('__nuxt') ? 'High' : 'Likely',
      category: 'Vue Framework',
    });
  } else if (lower.includes('vue.js') || lower.includes('vue.min.js') || lower.includes('v-bind')) {
    detected.push({
      name: 'Vue.js',
      confidence: 'Likely',
      category: 'UI Library',
    });
  }

  // 4. Webflow
  if (
    lower.includes('data-wf-page') ||
    lower.includes('data-wf-site') ||
    lower.includes('assets.website-files.com') ||
    lower.includes('webflow.com')
  ) {
    detected.push({
      name: 'Webflow',
      confidence: 'High',
      category: 'Visual CMS Platform',
    });
  }

  // 5. WordPress
  if (
    lower.includes('/wp-content/') ||
    lower.includes('/wp-includes/') ||
    lower.includes('wp-json') ||
    lower.includes('generator" content="wordpress')
  ) {
    detected.push({
      name: 'WordPress',
      confidence: 'High',
      category: 'CMS Platform',
    });
  }

  // 6. Shopify
  if (
    lower.includes('cdn.shopify.com') ||
    lower.includes('shopify.theme') ||
    lower.includes('shopify-buy')
  ) {
    detected.push({
      name: 'Shopify',
      confidence: 'High',
      category: 'E-commerce Engine',
    });
  }

  // 7. Tailwind CSS
  if (
    lower.includes('tailwind') ||
    /class="[^"]*(?:flex|grid|items-center|justify-between|text-|bg-|p-|m-)[^"]*"/.test(html)
  ) {
    detected.push({
      name: 'Tailwind CSS',
      confidence: lower.includes('tailwind') ? 'High' : 'Likely',
      category: 'Styling Architecture',
    });
  }

  // 8. Framer Motion / Animations
  if (lower.includes('framer') || lower.includes('motion') || lower.includes('gsap')) {
    detected.push({
      name: lower.includes('gsap') ? 'GSAP' : 'Motion',
      confidence: 'Likely',
      category: 'Animation Engine',
    });
  }

  if (detected.length === 0) {
    detected.push({
      name: 'Modern Semantic Web',
      confidence: 'Possible',
      category: 'HTML5 / CSS / JavaScript',
    });
  }

  return detected;
}
