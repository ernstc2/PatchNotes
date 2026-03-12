import { desc, asc, eq, and, isNotNull, or, ilike, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import type { FeedFilters } from './types';

export async function getFeedItems(filters?: FeedFilters) {
  const conditions: Array<SQL | undefined> = [isNotNull(policyItems.summary)];

  const trimmed = filters?.q?.trim();
  if (trimmed) {
    const pattern = `%${trimmed}%`;
    conditions.push(or(ilike(policyItems.title, pattern), ilike(policyItems.summary, pattern)));
  }

  if (filters?.type) {
    conditions.push(eq(policyItems.type, filters.type));
  }

  if (filters?.topic) {
    conditions.push(eq(policyItems.topic, filters.topic));
  }

  const order = filters?.sort === 'asc' ? asc(policyItems.date) : desc(policyItems.date);

  return db
    .select()
    .from(policyItems)
    .where(and(...(conditions.filter(Boolean) as SQL[])))
    .orderBy(order)
    .limit(100);
}

export async function getItemById(id: string) {
  const rows = await db
    .select()
    .from(policyItems)
    .where(eq(policyItems.id, id));
  return rows[0] ?? null;
}
