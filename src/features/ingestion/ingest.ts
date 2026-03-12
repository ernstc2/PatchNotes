import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import { systemStatus } from '@/lib/db/schema/system';
import { fetchExecutiveOrders } from './adapters/executive-orders';
import { fetchBills } from './adapters/bills';
import { fetchRegulations } from './adapters/regulations';
import { runSummarization } from '@/features/summarization/summarize';
import { runNotifications } from '@/features/notifications/notify';
import type { AdapterResult } from './types';

interface IngestResult {
  results: AdapterResult[];
  totalItems: number;
  errors: string[];
  summarized: number;
  summarizationErrors: string[];
  notified: number;
  notificationErrors: string[];
}

export async function runIngest(): Promise<IngestResult> {
  // Run adapters sequentially to avoid rate limit pileup
  const eoResult = await fetchExecutiveOrders();
  const billResult = await fetchBills();
  const regResult = await fetchRegulations();

  const allResults = [eoResult, billResult, regResult];

  // Collect items from non-error results
  const allItems = allResults
    .filter((r) => !r.error)
    .flatMap((r) => r.items);

  // Upsert items to policy_items table
  if (allItems.length > 0) {
    await db
      .insert(policyItems)
      .values(
        allItems.map((item) => ({
          sourceId: item.sourceId,
          source: item.source,
          type: item.type,
          title: item.title,
          date: item.date,
          sourceUrl: item.sourceUrl,
          status: item.status,
        }))
      )
      .onConflictDoUpdate({
        target: [policyItems.sourceId, policyItems.source],
        set: {
          title: sql`excluded.title`,
          status: sql`excluded.status`,
          updatedAt: sql`now()`,
        },
      });
  }

  // Record status for each adapter result in systemStatus
  for (const result of allResults) {
    await db.insert(systemStatus).values({
      service: result.source,
      status: result.error ? 'error' : 'ok',
      message: result.error ?? `Fetched ${result.items.length} items`,
      checkedAt: result.fetchedAt,
    });
  }

  const errors = allResults
    .filter((r) => r.error)
    .map((r) => `${r.source}: ${r.error}`);

  // Post-ingest: summarize any items without summaries
  const summarizationResult = await runSummarization();

  // Post-summarization: send digest emails to qualifying users
  const notificationResult = await runNotifications();

  return {
    results: allResults,
    totalItems: allItems.length,
    errors,
    summarized: summarizationResult.summarized,
    summarizationErrors: summarizationResult.errors,
    notified: notificationResult.sent,
    notificationErrors: notificationResult.errors,
  };
}
