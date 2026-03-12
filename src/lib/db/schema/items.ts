import { pgTable, uuid, timestamp, text, unique } from 'drizzle-orm/pg-core';

export const policyItems = pgTable(
  'policy_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    sourceId: text('source_id').notNull(),
    source: text().notNull(),
    type: text().notNull(),
    title: text().notNull(),
    date: timestamp({ withTimezone: true }).notNull(),
    sourceUrl: text('source_url').notNull(),
    status: text(),
    topic: text(),
    summary: text(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceIdUnique: unique().on(table.sourceId, table.source),
  })
);

export type PolicyItem = typeof policyItems.$inferSelect;
export type NewPolicyItem = typeof policyItems.$inferInsert;
