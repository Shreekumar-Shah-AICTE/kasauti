import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import type { GenerateText, Thinking } from '@/ai/client';
import { AI } from '@/core/constants';

const LEVELS: Readonly<Record<Exclude<Thinking, null>, ThinkingLevel>> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
};

/**
 * Creates the production generator backed by Gemini structured output. This is the only
 * file that imports the SDK; everything else depends on {@link GenerateText}.
 * Sampling parameters are intentionally not sent (deprecated for these models).
 *
 * @param apiKey - Server-side Gemini API key; never sent to the browser.
 * @returns A generator that returns the raw JSON text. Complexity: one network call.
 */
export function createGeminiGenerate(apiKey: string): GenerateText {
  const client = new GoogleGenAI({ apiKey });
  return async (request) => {
    const response = await client.models.generateContent({
      model: request.model,
      contents: request.user,
      config: {
        systemInstruction: request.system,
        responseMimeType: 'application/json',
        responseJsonSchema: request.jsonSchema,
        maxOutputTokens: AI.maxOutputTokens,
        abortSignal: request.signal,
        ...(request.thinking === null ? {} : { thinkingConfig: { thinkingLevel: LEVELS[request.thinking] } }),
      },
    });
    return response.text ?? '';
  };
}
