import { PageMetadata } from '../types';
import { extractMetadataFromHtml } from './metadata';
import { verifyHostSafety } from '../security/ssrf-protection';

export interface RenderResult {
  html: string;
  metadata: PageMetadata;
  desktopScreenshot?: string; // base64
  mobileScreenshot?: string;
  source: 'playwright' | 'fetch-fallback';
}

/**
 * Generate a visual representation as fallback if Playwright browser binary
 * is unavailable or restricted in the environment.
 */
function generateFallbackScreenshot(
  metadata: PageMetadata,
  viewport: 'desktop' | 'mobile'
): string {
  const isDesktop = viewport === 'desktop';
  const width = isDesktop ? 1440 : 390;
  const height = isDesktop ? 900 : 844;

  const h1 = metadata.headings.h1[0] || metadata.title || 'Reference Architecture';
  const desc = metadata.description || 'Structural and visual reference analyzed by Remix.';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="#FAFAF8">
    <rect width="${width}" height="${height}" fill="#FAFAF8"/>
    <!-- Top Nav bar -->
    <rect width="${width}" height="70" fill="#FFFFFF" stroke="#E4E4E7" stroke-width="1"/>
    <circle cx="40" cy="35" r="12" fill="#18181B"/>
    <text x="65" y="40" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#18181B">${escapeXml(metadata.title.slice(0, 24))}</text>
    
    <!-- Hero Box -->
    <rect x="${isDesktop ? '120' : '24'}" y="140" width="${isDesktop ? '1200' : '342'}" height="${isDesktop ? '420' : '360'}" rx="16" fill="#FFFFFF" stroke="#E4E4E7" stroke-width="1"/>
    <text x="${isDesktop ? '160' : '48'}" y="220" font-family="system-ui, sans-serif" font-size="${isDesktop ? '36' : '22'}" font-weight="800" fill="#09090B">${escapeXml(h1.slice(0, 48))}</text>
    <text x="${isDesktop ? '160' : '48'}" y="270" font-family="system-ui, sans-serif" font-size="${isDesktop ? '16' : '13'}" fill="#71717A">${escapeXml(desc.slice(0, 90))}</text>
    
    <!-- Button -->
    <rect x="${isDesktop ? '160' : '48'}" y="310" width="160" height="46" rx="8" fill="#18181B"/>
    <text x="${isDesktop ? '240' : '128'}" y="338" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle">Explore Platform</text>
    
    <!-- Grid elements -->
    <rect x="${isDesktop ? '120' : '24'}" y="${isDesktop ? '600' : '530'}" width="${isDesktop ? '380' : '342'}" height="180" rx="12" fill="#FFFFFF" stroke="#E4E4E7"/>
    <rect x="${isDesktop ? '530' : '24'}" y="${isDesktop ? '600' : '720'}" width="${isDesktop ? '380' : '342'}" height="180" rx="12" fill="#FFFFFF" stroke="#E4E4E7"/>
    ${isDesktop ? `<rect x="940" y="600" width="380" height="180" rx="12" fill="#FFFFFF" stroke="#E4E4E7"/>` : ''}
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Render website using Playwright if available, or secure fallback fetch.
 */
export async function renderAndCaptureWebsite(targetUrl: string): Promise<RenderResult> {
  const urlObj = new URL(targetUrl);

  // SSRF DNS safety check before making any network connection
  const safety = await verifyHostSafety(urlObj.hostname);
  if (!safety.safe) {
    throw new Error(safety.error || 'Host resolved to unsafe network address.');
  }

  // Attempt Playwright rendering
  try {
    const { chromium } = await import('playwright');
    
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
      timeout: 15000,
    });

    try {
      // 1. Desktop Viewport
      const desktopContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RemixBot/1.0',
      });
      const desktopPage = await desktopContext.newPage();
      await desktopPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await desktopPage.waitForTimeout(1000); // Allow animations & layout to settle

      const html = await desktopPage.content();
      const metadata = extractMetadataFromHtml(html, targetUrl);

      const desktopScreenshotBuffer = await desktopPage.screenshot({
        type: 'jpeg',
        quality: 80,
        fullPage: false,
      });
      const desktopScreenshot = `data:image/jpeg;base64,${desktopScreenshotBuffer.toString('base64')}`;
      await desktopContext.close();

      // 2. Mobile Viewport
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await mobilePage.waitForTimeout(800);

      const mobileScreenshotBuffer = await mobilePage.screenshot({
        type: 'jpeg',
        quality: 75,
        fullPage: false,
      });
      const mobileScreenshot = `data:image/jpeg;base64,${mobileScreenshotBuffer.toString('base64')}`;
      await mobileContext.close();

      await browser.close();

      return {
        html,
        metadata,
        desktopScreenshot,
        mobileScreenshot,
        source: 'playwright',
      };
    } catch (browserErr) {
      await browser.close().catch(() => {});
      throw browserErr;
    }
  } catch (err: any) {
    // If Playwright fails (e.g. system browser dependencies missing or page blocked automation),
    // perform high-integrity secure HTTP fetch + structure capture fallback.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RemixBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`Website returned HTTP status ${response.status} (${response.statusText}).`);
    }

    const html = await response.text();
    const metadata = extractMetadataFromHtml(html, targetUrl);
    const desktopScreenshot = generateFallbackScreenshot(metadata, 'desktop');
    const mobileScreenshot = generateFallbackScreenshot(metadata, 'mobile');

    return {
      html,
      metadata,
      desktopScreenshot,
      mobileScreenshot,
      source: 'fetch-fallback',
    };
  }
}
