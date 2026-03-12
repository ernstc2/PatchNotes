import { db } from '@/lib/db';
import { userTopics } from '@/lib/db/schema/user-data';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import { policyItems } from '@/lib/db/schema/items';
import { user } from '@/lib/db/schema/auth-schema';
import { eq, gte, and, inArray } from 'drizzle-orm';
import type { DigestRecipient } from './types';

type PolicyItem = typeof policyItems.$inferSelect;

type SubscriberRow = {
  userId: string;
  email: string;
  name: string;
  topic: string;
  optedOut: boolean | null;
};

/**
 * Pure function: groups subscriber rows with today's items into DigestRecipient array.
 * Extracted for testability — no DB calls in this function.
 */
export function groupRecipientsFromRows(
  rows: SubscriberRow[],
  todaysItems: PolicyItem[]
): DigestRecipient[] {
  if (rows.length === 0 || todaysItems.length === 0) return [];

  const byUser = new Map<string, DigestRecipient>();
  // Track seen item sourceIds per user to deduplicate
  const seenItems = new Map<string, Set<string>>();

  for (const row of rows) {
    // Skip opted-out users (true = opted out; false or null = subscribed)
    if (row.optedOut === true) continue;

    const matchingItems = todaysItems.filter((item) => item.topic === row.topic);
    if (matchingItems.length === 0) continue;

    if (!byUser.has(row.userId)) {
      byUser.set(row.userId, {
        userId: row.userId,
        email: row.email,
        name: row.name,
        items: [],
      });
      seenItems.set(row.userId, new Set());
    }

    const seen = seenItems.get(row.userId)!;
    const recipient = byUser.get(row.userId)!;

    for (const item of matchingItems) {
      if (!seen.has(item.sourceId)) {
        seen.add(item.sourceId);
        recipient.items.push({
          title: item.title,
          topic: item.topic,
          type: item.type,
          sourceUrl: item.sourceUrl,
        });
      }
    }
  }

  return [...byUser.values()];
}

export async function getUsersWithMatchingItems(): Promise<DigestRecipient[]> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Items ingested since midnight UTC
  const todaysItems = await db
    .select()
    .from(policyItems)
    .where(gte(policyItems.fetchedAt, todayStart));

  if (todaysItems.length === 0) return [];

  // Topics present in today's items
  const todayTopics = [
    ...new Set(todaysItems.map((i) => i.topic).filter(Boolean)),
  ] as string[];

  if (todayTopics.length === 0) return [];

  // Users subscribed to at least one of those topics
  // Left join notificationPrefs so users without a pref row are included (null = not opted out)
  const subscribers = await db
    .select({
      userId: userTopics.userId,
      email: user.email,
      name: user.name,
      topic: userTopics.topic,
      optedOut: notificationPrefs.optedOut,
    })
    .from(userTopics)
    .innerJoin(user, eq(userTopics.userId, user.id))
    .leftJoin(notificationPrefs, eq(userTopics.userId, notificationPrefs.userId))
    .where(
      and(
        inArray(userTopics.topic, todayTopics),
      )
    );

  return groupRecipientsFromRows(subscribers, todaysItems);
}
