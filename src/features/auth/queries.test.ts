import { describe, test } from 'vitest';

describe('auth/queries', () => {
  describe('topics', () => {
    test.todo('saveTopics stores selected topics for a new user (USER-01)');
    test.todo('getUserTopics returns empty array for user with no topics (USER-03)');
    test.todo('getUserTopics returns saved topic strings (PERS-01)');
    test.todo('updateTopics replaces existing topics on profile (PERS-02)');
  });

  describe('bookmarks', () => {
    test.todo('toggleBookmark adds a bookmark, second call removes it (PERS-03)');
    test.todo('getBookmarkedItems returns bookmarked policy items with join (PERS-04)');
  });
});
