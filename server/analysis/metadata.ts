import { PageMetadata } from '../types';

export function extractMetadataFromHtml(html: string, url: string): PageMetadata {
  const getMatch = (regex: RegExp) => {
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };

  const getAllMatches = (regex: RegExp) => {
    const results: string[] = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text && text.length < 120 && !results.includes(text)) {
        results.push(text);
      }
    }
    return results.slice(0, 8);
  };

  const title =
    getMatch(/<title[^>]*>([^<]+)<\/title>/i) ||
    getMatch(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    'Untitled Reference';

  const description =
    getMatch(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    getMatch(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    '';

  const ogTitle = getMatch(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const ogDescription = getMatch(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const canonicalUrl = getMatch(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  const language = getMatch(/<html[^>]*lang=["']([^"']+)["']/i) || 'en';

  let favicon =
    getMatch(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
    getMatch(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);

  if (favicon && !favicon.startsWith('http')) {
    try {
      favicon = new URL(favicon, url).toString();
    } catch {
      // ignore
    }
  }

  // Headings
  const h1 = getAllMatches(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  const h2 = getAllMatches(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const h3 = getAllMatches(/<h3[^>]*>([\s\S]*?)<\/h3>/gi);

  // Navigation Items
  const navMatches = html.match(/<nav[\s\S]*?<\/nav>/gi) || [];
  const navText = navMatches.join(' ');
  const navigationItems = getAllMatches(/<a[^>]*>([\s\S]*?)<\/a>/gi);

  // Buttons
  const buttons = getAllMatches(/<button[^>]*>([\s\S]*?)<\/button>/gi);

  // Counts
  const linksCount = (html.match(/<a\s+[^>]*href/gi) || []).length;
  const imagesCount = (html.match(/<img\s+/gi) || []).length;
  const hasVideo = /<video|<iframe[^>]*youtube|<iframe[^>]*vimeo/i.test(html);
  const hasForms = /<form[\s>]/i.test(html);

  return {
    title,
    description,
    ogTitle: ogTitle || undefined,
    ogDescription: ogDescription || undefined,
    canonicalUrl: canonicalUrl || undefined,
    language,
    favicon: favicon || undefined,
    headings: { h1, h2, h3 },
    navigationItems: navigationItems.slice(0, 6),
    buttons: buttons.slice(0, 5),
    linksCount,
    imagesCount,
    hasVideo,
    hasForms,
  };
}
