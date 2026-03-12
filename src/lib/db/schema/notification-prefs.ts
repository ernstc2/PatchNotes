import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export const notificationPrefs = pgTable('notification_prefs', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  optedOut: boolean('opted_out').default(false).notNull(),
  notifiedDate: text('notified_date'), // ISO date string "YYYY-MM-DD", prevents duplicate sends
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
