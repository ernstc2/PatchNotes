import { desc, eq, and, isNotNull, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import type { FeedFilters } from './types';

export async function getFeedItems(filters?: FeedFilters) {
  const conditions: SQL[] = [isNotNull(policyItems.summary)];

  if (filters?.type) {
    conditions.push(eq(policyItems.type, filters.type));
  }

  if (filters?.topic) {
    conditions.push(eq(policyItems.topic, filters.topic));
  }

  return db
    .select()
    .from(policyItems)
    .where(and(...conditions))
    .orderBy(desc(policyItems.date))
    .limit(50);
}

export async function getItemById(id: string) {
  const rows = await db
    .select()
    .from(policyItems)
    .where(eq(policyItems.id, id));
  return rows[0] ?? null;
}
