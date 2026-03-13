import { z } from 'zod';

export const TOPIC_VALUES = [
  'healthcare',
  'taxes',
  'immigration',
  'environment',
  'defense',
  'education',
  'economy',
  'other',
] as const;

export type TopicValue = (typeof TOPIC_VALUES)[number];

export const SummarySchema = z.object({
  headline: z
    .string()
    .describe('One-sentence plain-English headline of the change, max 120 chars.'),
  whatChanged: z
    .string()
    .describe('What specifically changed or was enacted, 1-3 sentences, no political framing.'),
  whoAffected: z
    .string()
    .describe('Who is personally affected — specific groups, industries, or the general public.'),
  whyItMatters: z
    .string()
    .describe('Why this matters in practical terms for everyday people.'),
  severity: z
    .enum(['broad_national', 'moderate_regional', 'narrow_administrative'])
    .describe(
      'Scope signal: broad_national = affects most Americans broadly; moderate_regional = affects a sector or region; narrow_administrative = procedural/internal change.'
    ),
  topic: z
    .enum(TOPIC_VALUES)
    .describe(
      'Primary policy topic. Must be exactly one of the allowed values. Use "other" only if the item clearly does not fit any listed category.'
    ),
});

export type SummaryOutput = z.infer<typeof SummarySchema>;

// Pre-computed once at module load — safe to reuse across calls
export const summaryJsonSchema = z.toJSONSchema(SummarySchema);
