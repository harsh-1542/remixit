import { WebsiteDefinition } from '../../src/types/website-definition';

export interface ArtifactBuildOutput {
  files: Record<string, string>;
  summary: string;
}

export function buildProductionArtifact(
  definition: WebsiteDefinition,
  deploymentId: string,
  publicBaseUrl: string
): ArtifactBuildOutput {
  const theme = definition.theme;
  const isDark = theme.mode === 'dark';
  const bgColor = theme.backgroundColor || (isDark ? '#09090B' : '#FAFAF8');
  const textColor = theme.textColor || (isDark ? '#F4F4F5' : '#09090B');
  const accentColor = theme.accentColor || '#3B82F6';
  const siteTitle = definition.meta?.title || definition.name;
  const siteDescription = definition.meta?.description || definition.description || definition.tagline;

  // Render HTML markup for all sections
  const sectionsHtml = definition.sections
    .map((section) => renderSectionToHtml(section, theme))
    .join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(siteTitle)}</title>
  <meta name="description" content="${escapeHtml(siteDescription)}" />
  <meta property="og:title" content="${escapeHtml(siteTitle)}" />
  <meta property="og:description" content="${escapeHtml(siteDescription)}" />
  <meta property="og:type" content="website" />
  <meta name="generator" content="Remix (remix.design)" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            accent: '${accentColor}',
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            serif: ['"Newsreader"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: ${bgColor};
      color: ${textColor};
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      overflow-x: hidden;
      margin: 0;
      padding: 0;
      scroll-behavior: smooth;
    }
    .accent-bg { background-color: ${accentColor}; }
    .accent-text { color: ${accentColor}; }
    .accent-border { border-color: ${accentColor}; }
    ::selection {
      background-color: ${accentColor};
      color: #FFFFFF;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased">
  <!-- Deployed Website Content -->
  <div class="flex-1 w-full">
${sectionsHtml}
  </div>

  <!-- Remix Clean Publication Watermark -->
  <footer class="w-full py-4 px-6 border-t ${isDark ? 'border-zinc-800 bg-[#09090B]' : 'border-zinc-200 bg-[#FAFAF8]'} text-center text-xs opacity-75">
    <div class="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-mono text-zinc-400">
      <span>Published with <strong class="text-zinc-950 dark:text-zinc-100 font-sans font-bold">remix.</strong></span>
      <a href="${publicBaseUrl}" target="_blank" class="hover:underline text-zinc-600 dark:text-zinc-300">Discover & Remix Similar Websites →</a>
    </div>
  </footer>

  <!-- Standalone Interactive Mobile Menu Script -->
  <script>
    function toggleMobileMenu() {
      var menu = document.getElementById('remix-mobile-nav');
      if (menu) {
        menu.classList.toggle('hidden');
      }
    }
    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
          var targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  </script>
</body>
</html>`;

  const files: Record<string, string> = {
    'index.html': htmlContent,
    'website-definition.json': JSON.stringify(definition, null, 2),
    'metadata.json': JSON.stringify(
      {
        deploymentId,
        name: definition.name,
        publishedAt: new Date().toISOString(),
        sectionsCount: definition.sections.length,
      },
      null,
      2
    ),
  };

  return {
    files,
    summary: `Compiled ${definition.sections.length} semantic sections into standalone responsive bundle.`,
  };
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderSectionToHtml(section: any, theme: any): string {
  const isDark = theme.mode === 'dark';
  const accent = theme.accentColor || '#3B82F6';

  switch (section.type) {
    case 'navbar': {
      const brand = section.brandName || 'Brand';
      const links = section.links || [];
      const primaryCta = section.primaryCta || { label: 'Get Started', href: '#cta' };

      return `
    <header class="sticky top-0 z-40 w-full backdrop-blur-md ${isDark ? 'bg-zinc-950/80 border-b border-zinc-800' : 'bg-white/80 border-b border-zinc-200'}">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="font-bold text-lg tracking-tight font-sans">${escapeHtml(brand)}</div>
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}">
          ${links
            .map((link: any) => `<a href="${escapeHtml(link.href || '#')}" class="hover:text-zinc-950 dark:hover:text-white transition-colors">${escapeHtml(link.label || 'Link')}</a>`)
            .join('\n          ')}
        </nav>
        <div class="hidden md:flex items-center gap-3">
          <a href="${escapeHtml(primaryCta.href || '#')}" class="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs" style="background-color: ${accent}">
            ${escapeHtml(primaryCta.label)}
          </a>
        </div>
        <button onclick="toggleMobileMenu()" class="md:hidden p-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-white" aria-label="Menu">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
      </div>
      <div id="remix-mobile-nav" class="hidden md:hidden px-4 pt-2 pb-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'} flex flex-col gap-3">
        ${links
          .map((link: any) => `<a href="${escapeHtml(link.href || '#')}" class="block py-1 text-sm ${isDark ? 'text-zinc-300' : 'text-zinc-700'}">${escapeHtml(link.label || 'Link')}</a>`)
          .join('\n        ')}
        <a href="${escapeHtml(primaryCta.href || '#')}" class="block text-center py-2 rounded-lg text-xs font-semibold text-white mt-2" style="background-color: ${accent}">
          ${escapeHtml(primaryCta.label)}
        </a>
      </div>
    </header>`;
    }

    case 'centered-hero': {
      const badge = section.badge;
      const heading = section.heading || 'A New Perspective on Design';
      const description = section.description || '';
      const primaryCta = section.primaryCta || { label: 'Explore More', href: '#features' };
      const secondaryCta = section.secondaryCta;

      return `
    <section class="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
      ${badge ? `<div class="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium mb-6 ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}">${escapeHtml(badge)}</div>` : ''}
      <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight font-sans leading-tight">
        ${escapeHtml(heading)}
      </h1>
      <p class="mt-6 text-lg sm:text-xl ${isDark ? 'text-zinc-400' : 'text-zinc-600'} max-w-3xl mx-auto leading-relaxed">
        ${escapeHtml(description)}
      </p>
      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <a href="${escapeHtml(primaryCta.href || '#')}" class="px-6 py-3.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all" style="background-color: ${accent}">
          ${escapeHtml(primaryCta.label)}
        </a>
        ${secondaryCta ? `<a href="${escapeHtml(secondaryCta.href || '#')}" class="px-6 py-3.5 rounded-xl text-sm font-semibold border ${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'} transition-all">${escapeHtml(secondaryCta.label)}</a>` : ''}
      </div>
    </section>`;
    }

    case 'split-hero': {
      return `
    <section class="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        ${section.badge ? `<div class="inline-block text-xs font-mono uppercase tracking-wider mb-4 font-semibold" style="color: ${accent}">${escapeHtml(section.badge)}</div>` : ''}
        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">${escapeHtml(section.heading || 'Built for Speed')}</h1>
        <p class="mt-4 text-base sm:text-lg ${isDark ? 'text-zinc-400' : 'text-zinc-600'}">${escapeHtml(section.description || '')}</p>
        <div class="mt-8 flex gap-4">
          <a href="${escapeHtml(section.primaryCta?.href || '#')}" class="px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm" style="background-color: ${accent}">${escapeHtml(section.primaryCta?.label || 'Get Started')}</a>
        </div>
      </div>
      <div class="p-6 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-xl">
        <div class="flex items-center gap-2 mb-4">
          <span class="w-3 h-3 rounded-full bg-red-400"></span>
          <span class="w-3 h-3 rounded-full bg-amber-400"></span>
          <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
          <span class="text-xs font-mono text-zinc-400 ml-2">${escapeHtml(section.previewTitle || 'Dashboard Preview')}</span>
        </div>
        <div class="h-48 rounded-xl ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'} border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} flex items-center justify-center text-xs font-mono text-zinc-400">
          Interactive Component Surface
        </div>
      </div>
    </section>`;
    }

    case 'feature-grid':
    case 'bento-grid': {
      const features = section.features || [];
      return `
    <section id="features" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="text-center max-w-3xl mx-auto mb-16">
        ${section.badge ? `<span class="text-xs font-mono uppercase tracking-wider block mb-2 font-semibold" style="color: ${accent}">${escapeHtml(section.badge)}</span>` : ''}
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">${escapeHtml(section.heading || 'Key Capabilities')}</h2>
        ${section.description ? `<p class="mt-3 text-base ${isDark ? 'text-zinc-400' : 'text-zinc-600'}">${escapeHtml(section.description)}</p>` : ''}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        ${features
          .map(
            (feat: any, idx: number) => `
        <div class="p-6 rounded-2xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'} shadow-2xs hover:shadow-md transition-all">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold mb-4" style="background-color: ${accent}20; color: ${accent}">0${idx + 1}</div>
          <h3 class="text-base font-bold tracking-tight">${escapeHtml(feat.title || 'Feature')}</h3>
          <p class="mt-2 text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed">${escapeHtml(feat.description || '')}</p>
        </div>`
          )
          .join('\n        ')}
      </div>
    </section>`;
    }

    case 'cta': {
      return `
    <section id="cta" class="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      <div class="p-10 sm:p-14 rounded-3xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} shadow-xl">
        <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">${escapeHtml(section.heading || 'Start Building Today')}</h2>
        <p class="mt-4 text-base ${isDark ? 'text-zinc-400' : 'text-zinc-600'} max-w-2xl mx-auto">${escapeHtml(section.description || 'Experience the future of rapid web development.')}</p>
        <div class="mt-8 flex justify-center">
          <a href="${escapeHtml(section.primaryCta?.href || '#')}" class="px-8 py-3.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all" style="background-color: ${accent}">
            ${escapeHtml(section.primaryCta?.label || 'Get Started Now')}
          </a>
        </div>
      </div>
    </section>`;
    }

    case 'footer': {
      const columns = section.columns || [];
      return `
    <footer class="pt-16 pb-8 border-t ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'} px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 pb-12">
        <div class="col-span-2">
          <h4 class="font-bold text-base tracking-tight">${escapeHtml(section.brandName || 'Brand')}</h4>
          <p class="text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-2 max-w-sm">${escapeHtml(section.tagline || 'Original website built with precision.')}</p>
        </div>
        ${columns
          .map(
            (col: any) => `
        <div>
          <h5 class="text-xs font-mono uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-800'} mb-3">${escapeHtml(col.title || 'Links')}</h5>
          <ul class="space-y-2 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}">
            ${(col.links || [])
              .map((l: any) => `<li><a href="${escapeHtml(l.href || '#')}" class="hover:underline">${escapeHtml(l.label || 'Link')}</a></li>`)
              .join('\n            ')}
          </ul>
        </div>`
          )
          .join('\n        ')}
      </div>
      <div class="max-w-7xl mx-auto pt-6 border-t ${isDark ? 'border-zinc-900' : 'border-zinc-100'} text-center text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}">
        ${escapeHtml(section.copyright || '© 2026 All rights reserved.')}
      </div>
    </footer>`;
    }

    default:
      return `
    <section class="py-12 px-4 max-w-7xl mx-auto border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}">
      <div class="text-xs font-mono opacity-50 uppercase tracking-wider mb-2">${escapeHtml(section.type)}</div>
      <h3 class="text-xl font-bold">${escapeHtml(section.heading || section.title || 'Content Section')}</h3>
      <p class="text-sm mt-2 opacity-75">${escapeHtml(section.description || '')}</p>
    </section>`;
  }
}
