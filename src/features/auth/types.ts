import { userTopics, bookmarks } from '@/lib/db/schema/user-data';
import { policyItems } from '@/lib/db/schema/items';

export type UserTopic = typeof userTopics.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;

export type BookmarkedItem = {
  bookmark: Bookmark;
  item: typeof policyItems.$inferSelect;
};
