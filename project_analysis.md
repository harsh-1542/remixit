# Remix Project Analysis

## Overview
**Remix** is an AI-powered architectural design discovery and website synthesis platform. It allows users to browse high-fidelity web design archetypes, analyze reference websites, and generate original, production-ready React websites customized to their business needs using AI. It emphasizes "originality over cloning," translating abstract spatial layouts, typographic scales, and visual rhythms into unique implementations.

## Technology Stack
The project is a modern full-stack web application leveraging the following technologies:
- **Frontend**: React 19, Vite, Tailwind CSS (v4), Framer Motion (for animations), Lucide React (for icons).
- **Backend**: Node.js, Express, TypeScript, `tsx` for execution.
- **AI & Integrations**: Google Gemini API (`@google/genai`) for AI website generation, Playwright for web scraping and controlled browser rendering, Supabase (for database/auth capabilities, as seen in dependencies), and Stripe (for billing/payments).
- **Tooling**: TypeScript, ESLint, esbuild.

## Core Features & User Journey
1. **Discovery & Exploration**: Users can browse a curated gallery of high-fidelity design templates or submit custom URLs for analysis.
2. **Reference Analyzer**: The system uses Playwright to analyze public URLs, decomposing DOM structures and extracting design specifications securely (with SSRF protection).
3. **AI Website Generation**: Using the extracted design specs and user inputs (business requirements, industry, etc.), the backend orchestrates an AI generation pipeline (using `gemini-3.8-flash`) to create fully functional, responsive React websites.
4. **Visual Builder & AI Editing**: Users enter a visual editor (with Desktop, Tablet, Mobile viewports) to preview the generated site. They can refine the site via natural language commands (e.g., "Change the hero section to be more minimal").
5. **Publishing & Deployment**: Projects can be exported as standalone React code (downloadable ZIP via `jszip`), pushed to GitHub, or published directly with custom domain mapping support.

## Project Structure
The repository is structured as a monolithic repository housing both the frontend React application and the Express backend:

### `/src` - Frontend Application
Contains the client-side React code.
- **`/pages`**: Includes routing views such as `DashboardPage.tsx`, `EditorPage.tsx`, `AnalysisPage.tsx`, `GeneratePage.tsx`, and auth pages.
- **`/components`**: Reusable UI elements including `Navbar.tsx`, `WebsitePreview.tsx`, `GitHubModal.tsx`, `PublishModal.tsx`, and a `builder/` subdirectory for dynamic site component generation.
- **`/config`, `/lib`, `/data`, `/types`**: Supporting utilities, TypeScript types, and configuration files.
- **`App.tsx` & `main.tsx`**: React application entry points.

### `/server` - Backend Application
Contains the Express.js server and API routes (`server.ts` is the main entry point).
- **`/ai` & `/generation`**: Logic for interfacing with the Gemini AI model and handling the prompt/generation pipelines.
- **`/analysis`**: Website analysis logic using Playwright.
- **`/routes`**: Express routers for projects, authentication, deployments, github integrations, and custom domains.
- **`/security`**: Security modules, notably SSRF protection to prevent malicious internal network scanning during the analysis phase.
- **`/jobs`**: Job managers to handle long-running background tasks (like website analysis and generation).

### Other Notable Directories
- **`/data`**: Likely used for local storage, caching, or holding deployment bundles.
- **`/migrations`**: Database schema migrations (likely related to Supabase or a local DB setup).

## Security Architecture
The platform implements robust security measures:
- **SSRF Defense**: Asynchronous DNS resolution blocks `localhost`, RFC1918 private IP ranges, and cloud metadata endpoints to prevent Server-Side Request Forgery during website analysis.
- **Zero Script Injection**: The visual builder renders approved, registered component schemas rather than executing arbitrary untrusted strings.
- **Credential Safety**: API keys and tokens are strictly kept server-side and never leaked to the client or exported ZIP bundles.

## Running the Project
The package.json provides standard commands:
- `npm run dev`: Starts the full-stack development server (Express API + Vite SPA).
- `npm run build`: Compiles the client bundle for production.
- `npm start`: Runs the compiled production server.
