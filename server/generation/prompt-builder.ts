import { DesignSpecification } from '../types';
import { UserGenerationConfig, WebsiteDefinition } from '../../src/types/website-definition';

export function buildGenerationPrompt(
  spec: DesignSpecification,
  config: UserGenerationConfig
): string {
  return `You are a principal frontend architect and creative design director.
Task: Generate an original, complete, production-grade website definition inspired by a reference design specification.

CRITICAL PRODUCT PRINCIPLE:
- You are creating an ORIGINAL website for the user's business/project.
- Do NOT clone proprietary source code, trademarks, copyright, or text from the reference.
- Translate the reference's spatial rhythms, typography hierarchy, color harmony, and component taxonomy into an original design tailored to the user's request.

USER REQUIREMENTS:
- Business / Product Name: ${config.name}
- Description: ${config.description}
- Industry: ${config.industry}
- Website Type: ${config.websiteType}
- Color Preference: ${config.colorPreference}
${config.customColors ? `- Custom Colors: ${JSON.stringify(config.customColors)}` : ''}
${config.additionalInstructions ? `- Additional User Instructions: "${config.additionalInstructions}"` : ''}

REFERENCE DESIGN SPECIFICATION (INSPIRATION ONLY):
- Visual Style: ${spec.visualStyle?.primaryStyle} (${spec.visualStyle?.theme} mode)
- Reference Colors: ${JSON.stringify(spec.colors)}
- Typography Rules: ${JSON.stringify(spec.typography)}
- Layout Grid: ${JSON.stringify(spec.layout)}
- Reference Sections: ${JSON.stringify(spec.sections?.map((s) => s.type))}
- Reusable Components: ${JSON.stringify(spec.components)}

OUTPUT SCHEMA REQUIREMENTS:
Produce a strictly valid JSON object conforming to this WebsiteDefinition schema:
{
  "name": "${config.name}",
  "tagline": "string",
  "description": "${config.description}",
  "industry": "${config.industry}",
  "websiteType": "${config.websiteType}",
  "theme": {
    "primaryColor": "hex string",
    "secondaryColor": "hex string",
    "accentColor": "hex string",
    "backgroundColor": "hex string",
    "cardBackground": "hex string",
    "textColor": "hex string",
    "mutedTextColor": "hex string",
    "borderColor": "rgba or hex",
    "fontHeading": "string",
    "fontBody": "string",
    "radius": "none" | "sm" | "md" | "lg" | "full",
    "mode": "light" | "dark"
  },
  "sections": [
    // Array of supported section objects. Supported types:
    // "navbar", "split-hero" | "centered-hero", "feature-grid" | "bento-grid", "stats-section", "logo-cloud", "product-showcase", "image-text", "testimonials", "pricing", "faq", "cta", "footer"
  ],
  "meta": {
    "title": "string",
    "description": "string",
    "keywords": ["string"]
  }
}

Include at least 6 rich, comprehensive sections (e.g. navbar, hero, features/bento, stats or showcase, testimonials/pricing, cta, footer).
Ensure copy is original, thoughtful, and professional. Return JSON only.`;
}

export function buildEditPrompt(
  currentWebsite: WebsiteDefinition,
  instruction: string
): string {
  return `You are a principal website design engineer.
Update the following WebsiteDefinition based on the user's natural language edit instruction.

USER EDIT INSTRUCTION:
"${instruction}"

CURRENT WEBSITE DEFINITION:
${JSON.stringify(currentWebsite, null, 2)}

REQUIREMENTS:
- Modify only the sections and theme properties necessary to satisfy the instruction.
- Preserve sections and copy the user did not ask to change.
- Return the entire updated WebsiteDefinition strictly as valid JSON.
- Never wrap with markdown or commentary outside the JSON.`;
}
