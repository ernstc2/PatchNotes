import { eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import type { PolicyItem } from '@/lib/db/schema/items';
import { generateSummary } from './gemini';
import type { SummaryOutput } from './schema';

function buildRawExcerpt(item: PolicyItem): SummaryOutput {
  return {
    headline: item.title.slice(0, 120),
    whatChanged: 'See official source for details.',
    whoAffected: 'General public',
    whyItMatters: 'See official source for details.',
    severity: 'narrow_administrative',
  };
}

export async function summarizeItem(item: PolicyItem): Promise<void> {
  // Attempt 1
  let summary = await generateSummary(item);

  // Retry once on null
  if (summary === null) {
    summary = await generateSummary(item);
  }

  // Fallback to raw excerpt if still null
  const summaryData: SummaryOutput = summary ?? buildRawExcerpt(item);

  await db
    .update(policyItems)
    .set({ summary: JSON.stringify(summaryData), updatedAt: new Date() })
    .where(eq(policyItems.id, item.id));
}

export async function runSummarization(): Promise<{ summarized: number; errors: string[] }> {
  // Cache-miss gate: only process items where summary IS NULL
  const unsummarized = await db
    .select()
    .from(policyItems)
    .where(isNull(policyItems.summary));

  let summarized = 0;
  const errors: string[] = [];

  // Sequential processing — 15 RPM rate limit, do NOT use Promise.all
  for (const item of unsummarized) {
    try {
      await summarizeItem(item);
      summarized++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${item.id}: ${message}`);
    }
  }

  return { summarized, errors };
}
