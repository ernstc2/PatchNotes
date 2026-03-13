import { desc, asc, eq, and, isNotNull, or, ilike, inArray, gte, lte, type SQL } from 'drizzle-orm';

import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import type { FeedFilters } from './types';

export async function getFeedItems(filters?: FeedFilters) {
  const trimmed = filters?.q?.trim();
  const hasExplicitFilter =
    !!trimmed ||
    !!filters?.type ||
    !!filters?.topic ||
    (filters?.topics !== undefined && filters.topics.length > 0);

  // When no explicit filters are active, scope to the most recent day with data.
  if (!hasExplicitFilter) {
    const latestDateResult = await db
      .select({ date: policyItems.date })
      .from(policyItems)
      .where(isNotNull(policyItems.summary))
      .orderBy(desc(policyItems.date))
      .limit(1);

    if (latestDateResult.length === 0) return [];

    const latestDate = latestDateResult[0].date;
    const dayStart = new Date(latestDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(latestDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    return db
      .select()
      .from(policyItems)
      .where(
        and(
          isNotNull(policyItems.summary),
          gte(policyItems.date, dayStart),
          lte(policyItems.date, dayEnd),
        ),
      )
      .orderBy(desc(policyItems.date))
      .limit(100);
  }

  // Explicit filters active — broad query without date scoping.
  const conditions: Array<SQL | undefined> = [isNotNull(policyItems.summary)];

  if (trimmed) {
    const pattern = `%${trimmed}%`;
    conditions.push(or(ilike(policyItems.title, pattern), ilike(policyItems.summary, pattern)));
  }

  if (filters?.type) {
    conditions.push(eq(policyItems.type, filters.type));
  }

  // Multi-topic (inArray) takes precedence over single topic
  if (filters?.topics && filters.topics.length > 0) {
    conditions.push(inArray(policyItems.topic, filters.topics));
  } else if (filters?.topic) {
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
