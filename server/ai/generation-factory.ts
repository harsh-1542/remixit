import { GenerationProvider } from './generation-provider';
import { MockGenerationProvider } from './mock-generation-provider';
import { RealGenerationProvider } from './real-generation-provider';

export function getGenerationProvider(): GenerationProvider {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 5) {
    return new RealGenerationProvider(apiKey);
  }

  return new MockGenerationProvider();
}
