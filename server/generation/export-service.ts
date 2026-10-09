import JSZip from 'jszip';
import { WebsiteDefinition } from '../../src/types/website-definition';

export function generateProjectFileMap(website: WebsiteDefinition): Record<string, string> {
  const files: Record<string, string> = {};

  // 1. package.json
  const packageJson = {
    name: `remix-${slugify(website.name)}`,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.546.0',
    },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^4.3.0',
      '@tailwindcss/vite': '^4.0.0',
      tailwindcss: '^4.0.0',
      typescript: '^5.7.0',
      vite: '^6.0.0',
    },
  };
  files['package.json'] = JSON.stringify(packageJson, null, 2);

  // 2. vite.config.ts
  files['vite.config.ts'] = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;

  // 3. tsconfig.json
  files['tsconfig.json'] = `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}`;

  // 4. index.html
  files['index.html'] = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeXml(website.meta.title || website.name)}</title>
    <meta name="description" content="${escapeXml(website.meta.description || website.description)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  </head>
  <body class="antialiased selection:bg-black selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  // 5. .gitignore
  files['.gitignore'] = `node_modules
dist
dist-ssr
*.local
.env
.DS_Store
`;

  // 6. .env.example
  files['.env.example'] = `# Environment variables placeholder
VITE_SITE_TITLE="${website.name}"
`;

  // 7. src/index.css
  files['src/index.css'] = `@import "tailwindcss";

:root {
  --primary-color: ${website.theme.primaryColor};
  --accent-color: ${website.theme.accentColor};
  --bg-color: ${website.theme.backgroundColor};
  --card-bg: ${website.theme.cardBackground};
  --text-color: ${website.theme.textColor};
  --muted-text: ${website.theme.mutedTextColor};
  --border-color: ${website.theme.borderColor};
}

body {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
}
`;

  // 8. src/main.tsx
  files['src/main.tsx'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  // 9. src/websiteData.ts
  files['src/websiteData.ts'] = `export const websiteData = ${JSON.stringify(website, null, 2)};`;

  // 10. src/App.tsx
  files['src/App.tsx'] = `import React, { useState } from 'react';
import { websiteData } from './websiteData';
import {
  Menu, X, ArrowRight, ArrowUpRight, Check, Star, ChevronDown,
  Terminal, Cpu, Layers, Sparkles
} from 'lucide-react';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const theme = websiteData.theme;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      {/* Generated Sections */}
      ${website.sections
        .map((s, idx) => generateSectionJsx(s, idx, website.name))
        .join('\n\n      ')}
    </div>
  );
}
`;

  // 11. README.md
  files['README.md'] = `# ${website.name}

> ${website.tagline || website.description}

Synthesized with **Remix** architecture engine.

## Getting Started

Follow these steps to run the website locally:

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build
\`\`\`

## Architecture & Configuration

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Design Tokens**: Configured in \`src/index.css\` and \`src/websiteData.ts\`
- **Originality**: Bespoke original implementation inspired by modern architectural references with zero copied proprietary source code.

© ${new Date().getFullYear()} ${website.name}. Built with Remix.
`;

  return files;
}

export async function generateProjectZip(website: WebsiteDefinition): Promise<Buffer> {
  const zip = new JSZip();
  const folder = zip.folder(`remix-${slugify(website.name)}`) || zip;

  const files = generateProjectFileMap(website);
  for (const [filepath, content] of Object.entries(files)) {
    folder.file(filepath, content);
  }

  const buffer = await folder.generateAsync({ type: 'nodebuffer' });
  return buffer;
}

function generateSectionJsx(section: any, index: number, siteName: string): string {
  switch (section.type) {
    case 'navbar':
      return `{/* Navbar */}
      <header className="w-full border-b sticky top-0 z-40 backdrop-blur-md" style={{ borderColor: theme.borderColor, backgroundColor: theme.backgroundColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: theme.accentColor }} />
            <span className="text-lg font-bold font-sans tracking-tight">${escapeQuotes(section.brandName || siteName)}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium" style={{ color: theme.mutedTextColor }}>
            ${section.links
              .map(
                (l: any) =>
                  `<a href="${l.href}" className="hover:opacity-100 opacity-80">${escapeQuotes(l.label)}</a>`
              )
              .join('\n            ')}
          </nav>
          <div className="flex items-center gap-3">
            <a href="#cta" className="text-xs font-semibold px-4 py-2 rounded-lg text-white" style={{ backgroundColor: theme.primaryColor }}>
              ${escapeQuotes(section.primaryCta?.label || 'Get Started')}
            </a>
          </div>
        </div>
      </header>`;

    case 'centered-hero':
    case 'split-hero':
      return `{/* Hero Section */}
      <section className="w-full py-20 sm:py-28 border-b text-center" style={{ borderColor: theme.borderColor }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          ${section.badge ? `<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border mb-6" style={{ borderColor: theme.borderColor, color: theme.accentColor }}>${escapeQuotes(section.badge)}</div>` : ''}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08]">${escapeQuotes(section.heading)}</h1>
          <p className="mt-6 text-base sm:text-xl max-w-2xl leading-relaxed" style={{ color: theme.mutedTextColor }}>${escapeQuotes(section.description)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#cta" className="px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2" style={{ backgroundColor: theme.primaryColor }}>
              <span>${escapeQuotes(section.primaryCta?.label || 'Get Started')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>`;

    case 'bento-grid':
    case 'feature-grid':
      return `{/* Feature Grid */}
      <section id="features" className="w-full py-20 border-b" style={{ borderColor: theme.borderColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-bold tracking-tight">${escapeQuotes(section.heading)}</h2>
            ${section.description ? `<p className="mt-2 text-sm" style={{ color: theme.mutedTextColor }}>${escapeQuotes(section.description)}</p>` : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${(section.features || section.items || [])
              .map(
                (f: any) => `<div className="p-6 rounded-2xl border" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground }}>
              <h3 className="text-lg font-bold mb-2">${escapeQuotes(f.title)}</h3>
              <p className="text-sm leading-relaxed" style={{ color: theme.mutedTextColor }}>${escapeQuotes(f.description)}</p>
            </div>`
              )
              .join('\n            ')}
          </div>
        </div>
      </section>`;

    case 'pricing':
      return `{/* Pricing */}
      <section id="pricing" className="w-full py-20 border-b" style={{ borderColor: theme.borderColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight">${escapeQuotes(section.heading)}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${(section.plans || [])
              .map(
                (p: any) => `<div className="p-7 rounded-2xl border flex flex-col justify-between" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground }}>
              <div>
                <h3 className="text-xl font-bold">${escapeQuotes(p.name)}</h3>
                <div className="text-3xl font-black font-mono my-3">${escapeQuotes(p.price)}</div>
                <p className="text-xs mb-4" style={{ color: theme.mutedTextColor }}>${escapeQuotes(p.description)}</p>
              </div>
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white mt-4" style={{ backgroundColor: theme.primaryColor }}>
                ${escapeQuotes(p.ctaLabel || 'Select Plan')}
              </button>
            </div>`
              )
              .join('\n            ')}
          </div>
        </div>
      </section>`;

    case 'cta':
      return `{/* Call to Action */}
      <section id="cta" className="w-full py-20 border-b text-center" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBackground }}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">${escapeQuotes(section.heading)}</h2>
          <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: theme.mutedTextColor }}>${escapeQuotes(section.description)}</p>
          <div className="mt-8 flex justify-center gap-3">
            <button className="px-7 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2" style={{ backgroundColor: theme.primaryColor }}>
              <span>${escapeQuotes(section.primaryCta?.label || 'Get Started Now')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>`;

    case 'footer':
      return `{/* Footer */}
      <footer className="w-full py-12 border-t text-xs font-mono" style={{ borderColor: theme.borderColor, color: theme.mutedTextColor }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>${escapeQuotes(section.copyright || `© ${new Date().getFullYear()} ${siteName}`)}</div>
          <div>Built with Remix Architecture Engine</div>
        </div>
      </footer>`;

    default:
      return `{/* Section ${index} */}
      <section className="py-12 border-b" style={{ borderColor: theme.borderColor }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold">${escapeQuotes(section.heading || 'Section')}</h2>
        </div>
      </section>`;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
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

function escapeQuotes(str: string): string {
  return (str || '').replace(/"/g, '\\"');
}
