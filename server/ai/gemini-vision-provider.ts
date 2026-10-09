import { GoogleGenAI } from '@google/genai';
import { VisionProvider } from './provider';
import { WebsiteAnalysisInput, DesignSpecification } from '../types';

export class GeminiVisionProvider implements VisionProvider {
  name = 'GeminiVisionProvider';
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY });
  }

  async analyzeWebsite(input: WebsiteAnalysisInput): Promise<DesignSpecification> {
    const { url, metadata, sections, technologies, desktopScreenshotBase64 } = input;

    const systemPrompt = `You are a world-class principal design director and design systems architect.
Analyze this website as a design reference and produce a structured design specification that can be used to create an original website with similar design characteristics.

CRITICAL INSTRUCTIONS:
- Do NOT clone this website.
- Do NOT reproduce proprietary text, logos, copyrighted assets, or raw source code.
- Describe design patterns, visual hierarchy, spatial rhythms, typography rules, color palettes, and component taxonomy.
- Return ONLY valid JSON conforming exactly to the requested schema.

Target URL: ${url}
Extracted Title: ${metadata.title}
Extracted Description: ${metadata.description}
Extracted Headings: ${JSON.stringify(metadata.headings)}
Extracted Detected Technologies: ${JSON.stringify(technologies)}
Inferred DOM Sections: ${JSON.stringify(sections.map((s) => s.type))}

JSON Output Schema:
{
  "site": {
    "title": "string",
    "description": "string",
    "category": "string",
    "normalizedUrl": "${url}"
  },
  "visualStyle": {
    "primaryStyle": "string (e.g. Minimal, Swiss, Editorial, Bento, Dark, Brutalist)",
    "secondaryStyles": ["string"],
    "theme": "light" | "dark" | "mixed",
    "vibeDescription": "string"
  },
  "colors": {
    "primary": ["#hex", "#hex"],
    "backgrounds": ["#hex", "#hex"],
    "text": ["#hex", "#hex"],
    "accents": ["#hex", "#hex"]
  },
  "typography": {
    "headingStyle": "string",
    "bodyStyle": "string",
    "hierarchy": "string",
    "alignment": "string",
    "estimatedFontFamilies": ["string"]
  },
  "layout": {
    "maxWidth": "string",
    "grid": "string",
    "spacing": "string",
    "alignment": "string"
  },
  "sections": [
    {
      "type": "string",
      "order": 1,
      "layout": "string",
      "description": "string"
    }
  ],
  "components": ["string"],
  "features": ["string"],
  "imagery": {
    "style": "string",
    "usage": "string"
  },
  "responsive": {
    "desktop": "string",
    "mobile": "string"
  },
  "animation": {
    "present": boolean,
    "characteristics": ["string"]
  }
}`;

    const parts: any[] = [{ text: systemPrompt }];

    // If we have a base64 screenshot, attach it to vision prompt
    if (desktopScreenshotBase64) {
      const match = desktopScreenshotBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText) as DesignSpecification;

      // Validate basic shape
      if (!parsed.visualStyle || !parsed.colors || !parsed.typography) {
        throw new Error('AI output missing core DesignSpecification fields.');
      }

      parsed.technologies = technologies;
      return parsed;
    } catch (err: any) {
      console.warn('Gemini vision analysis parse error, retrying once:', err.message);
      try {
        // Retry once with concise correction
        const retryResponse = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                ...parts,
                {
                  text: 'Your previous response did not produce the expected valid JSON structure. Please re-output strictly the valid JSON object conforming to the schema above.',
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const retryText = retryResponse.text || '{}';
        const parsedRetry = JSON.parse(retryText) as DesignSpecification;
        parsedRetry.technologies = technologies;
        return parsedRetry;
      } catch (retryErr: any) {
        console.warn('Gemini retry failed, falling back to MockVisionProvider:', retryErr.message);
        const { MockVisionProvider } = await import('./mock-provider');
        const fallback = new MockVisionProvider();
        return fallback.analyzeWebsite(input);
      }
    }
  }
}
