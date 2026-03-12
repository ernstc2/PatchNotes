import { desc, asc, eq, and, isNotNull, or, ilike, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import type { FeedFilters, SearchFilters, ExploreFilters } from './types';

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

export async function getSearchResults({ q, type, topic }: SearchFilters) {
  const conditions: Array<SQL | undefined> = [isNotNull(policyItems.summary)];

  const trimmed = q?.trim();
  if (trimmed) {
    const pattern = `%${trimmed}%`;
    conditions.push(or(ilike(policyItems.title, pattern), ilike(policyItems.summary, pattern)));
  }

  if (type) {
    conditions.push(eq(policyItems.type, type));
  }

  if (topic) {
    conditions.push(eq(policyItems.topic, topic));
  }

  return db
    .select()
    .from(policyItems)
    .where(and(...(conditions.filter(Boolean) as SQL[])))
    .orderBy(desc(policyItems.date))
    .limit(50);
}

export async function getExploreItems({ type, topic, sort }: ExploreFilters) {
  const conditions: Array<SQL | undefined> = [isNotNull(policyItems.summary)];

  if (type) {
    conditions.push(eq(policyItems.type, type));
  }

  if (topic) {
    conditions.push(eq(policyItems.topic, topic));
  }

  const order = sort === 'asc' ? asc(policyItems.date) : desc(policyItems.date);

  return db
    .select()
    .from(policyItems)
    .where(and(...(conditions.filter(Boolean) as SQL[])))
    .orderBy(order)
    .limit(100);
}
