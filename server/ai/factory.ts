import { VisionProvider } from './provider';
import { MockVisionProvider } from './mock-provider';
import { GeminiVisionProvider } from './gemini-vision-provider';

export function getVisionProvider(): VisionProvider {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 5) {
    return new GeminiVisionProvider(apiKey);
  }

  // Graceful development fallback
  return new MockVisionProvider();
}
