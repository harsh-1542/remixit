# Remix — AI Website Discovery & Generation Platform

> **Find it. Remix it. Build it.**
> Discover exceptional websites, analyze design references, and generate original, production-ready React websites.

---

## Overview

Remix is an architectural design discovery and website synthesis platform built across three integrated phases:

- **Phase 1 — Discovery & Library**: Curated gallery of 15 high-fidelity design archetypes with multi-faceted filtering, searching, and zero-pill editorial typography.
- **Phase 2 — Reference Analyzer**: Controlled browser rendering, DOM structure decomposition, technology detection, and vision-based `DesignSpecification` extraction with SSRF security defenses.
- **Phase 3 — AI Website Generation Engine**: Transforms reference design specifications and user business requirements into original, fully functional React websites with live responsive viewports, natural language AI editing, version history, and standalone project code export.

---

## Key Product Principle: Originality Over Cloning

Remix is strictly **NOT** a website cloning or ripping service. The engine does not reproduce proprietary source code, copyrighted assets, logos, or brand claims from reference sites. Instead, it translates abstract spatial ratios, typographic scales, visual rhythm, and component taxonomies into a fresh, original implementation tailored to the user's business.

---

## User Journey

1. **Discover**: Browse the library or navigate to `/build`.
2. **Analyze**: Submit any public URL (`POST /api/analyze`) to inspect its layout, palette, and DOM taxonomy.
3. **Build Similar**: Click *Build Similar* to enter the configuration workspace (`/generate/:jobId`).
4. **Configure**: Provide product name, description, industry, website type, preferred colors, and custom instructions.
5. **Synthesize**: The generation engine steps through 6 verifiable stages to assemble a typed `WebsiteDefinition`.
6. **Preview & Edit**: Enter the visual builder (`/editor/:projectId`) with live Desktop (1440px), Tablet (768px), and Mobile (390px) viewports.
7. **Refine with AI**: Apply targeted natural language modifications (e.g., *"Make the hero more minimal"*, *"Change accent color to violet"*, *"Add a pricing section"*).
8. **Export**: Click *Download Code* to receive a standalone, deployable React 19 + TypeScript + Tailwind CSS project ZIP.

---

## AI Providers & Mock Mode

The platform uses a modular provider abstraction (`GenerationProvider`):

- **Real Provider (`RealGenerationProvider`)**: Uses Google AI Studio's `@google/genai` TypeScript SDK with model `gemini-3.8-flash`. All API calls are kept strictly on the server (`server/ai/`).
- **Mock Mode (`MockGenerationProvider`)**: When no API key is provided, or in offline development, Remix automatically runs in mock mode. It produces rich, multi-section original website structures matching the chosen industry and handles deterministic natural language edits without network overhead.

### Environment Setup

Set your environment variables in `.env` (refer to `.env.example`):

```bash
# GEMINI_API_KEY: Optional for local development; when omitted, Remix uses Mock mode.
GEMINI_API_KEY="your_api_key_here"

# Port (default 3000)
PORT=3000
```

---

## Development & Production Commands

```bash
# Install dependencies
npm install

# Start full-stack development server (Express API + Vite SPA on port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Build client bundle for production
npm run build

# Start production server
npm start
```

---

## Security Architecture

- **SSRF Defense**: Asynchronous DNS resolution check (`server/security/ssrf-protection.ts`) blocks `localhost`, `127.0.0.1`, RFC1918 private ranges, and cloud metadata endpoints (`169.254.169.254`).
- **Zero Script Injection**: The live preview renders approved, registered component schemas (`src/components/builder/`) rather than executing arbitrary untrusted strings.
- **Server-Side Credentials**: API keys and backend tokens are never transmitted to client JavaScript, local storage, or exported project archives.
