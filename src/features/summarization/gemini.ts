import { GoogleGenAI } from '@google/genai';
import { SummarySchema, summaryJsonSchema, type SummaryOutput } from './schema';
import type { PolicyItem } from '@/lib/db/schema/items';
import { buildPrompt } from './prompt';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateSummary(item: PolicyItem): Promise<SummaryOutput | null> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: buildPrompt(item),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: summaryJsonSchema,
    },
  });

  const raw = response.text ?? '';
  // Strip markdown fences that Gemini occasionally emits despite JSON mode
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null; // Caller handles retry/fallback
  }

  const result = SummarySchema.safeParse(parsed);
  if (!result.success) {
    return null; // Caller handles retry/fallback
  }
  return result.data;
}
