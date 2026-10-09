import { GoogleGenAI } from '@google/genai';
import { GenerationProvider } from './generation-provider';
import { DesignSpecification } from '../types';
import { UserGenerationConfig, WebsiteDefinition } from '../../src/types/website-definition';
import { buildGenerationPrompt, buildEditPrompt } from '../generation/prompt-builder';
import { validateAndSanitizeWebsiteDefinition } from '../generation/schema-validator';
import { MockGenerationProvider } from './mock-generation-provider';

export class RealGenerationProvider implements GenerationProvider {
  name = 'RealGenerationProvider';
  private ai: GoogleGenAI;
  private fallback: MockGenerationProvider;

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY });
    this.fallback = new MockGenerationProvider();
  }

  async generateWebsite(
    spec: DesignSpecification,
    config: UserGenerationConfig
  ): Promise<WebsiteDefinition> {
    const prompt = buildGenerationPrompt(spec, config);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);
      return validateAndSanitizeWebsiteDefinition(parsed, config.name);
    } catch (err: any) {
      console.warn('Real AI generation failed, using mock provider fallback:', err.message);
      return this.fallback.generateWebsite(spec, config);
    }
  }

  async editWebsite(
    current: WebsiteDefinition,
    instruction: string
  ): Promise<WebsiteDefinition> {
    const prompt = buildEditPrompt(current, instruction);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);
      return validateAndSanitizeWebsiteDefinition(parsed, current.name);
    } catch (err: any) {
      console.warn('Real AI edit failed, using mock provider fallback:', err.message);
      return this.fallback.editWebsite(current, instruction);
    }
  }
}
