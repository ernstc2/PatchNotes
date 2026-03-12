import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

export const systemStatus = pgTable('system_status', {
  id: uuid().primaryKey().defaultRandom(),
  service: text().notNull(),
  status: text().notNull(),
  message: text(),
  checkedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export type SystemStatus = typeof systemStatus.$inferSelect;
export type NewSystemStatus = typeof systemStatus.$inferInsert;
