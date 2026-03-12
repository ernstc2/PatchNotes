import {
  pgTable,
  text,
  uuid,
  timestamp,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { policyItems } from './items';

export const userTopics = pgTable(
  'user_topics',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    topic: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.topic] })]
);

export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    policyItemId: uuid('policy_item_id')
      .notNull()
      .references(() => policyItems.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique().on(table.userId, table.policyItemId)]
);
