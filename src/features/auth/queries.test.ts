import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation and next/cache before any imports
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the DB module
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  saveTopics,
  updateTopics,
  getUserTopics,
  toggleBookmark,
  getBookmarkedItems,
  getBookmarkedIds,
} from './queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const mockAuth = auth as unknown as {
  api: { getSession: ReturnType<typeof vi.fn> };
};

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const TEST_USER_ID = 'test-user-123';
const TEST_SESSION = { user: { id: TEST_USER_ID, email: 'test@example.com' } };

// Helper: build a chainable select mock
function makeSelectChain(returnValue: unknown[]) {
  const resolved = vi.fn().mockResolvedValue(returnValue);
  const whereMock = vi.fn().mockReturnValue({ orderBy: vi.fn().mockReturnValue(resolved), limit: resolved });
  const fromMock = vi.fn().mockReturnValue({ where: whereMock, innerJoin: vi.fn().mockReturnValue({ where: whereMock }) });
  mockDb.select.mockReturnValue({ from: fromMock });
  return { fromMock, whereMock };
}

// Helper: build a chainable insert mock
function makeInsertChain() {
  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const valuesMock = vi.fn().mockReturnValue({ onConflictDoNothing });
  mockDb.insert.mockReturnValue({ values: valuesMock });
  return { valuesMock, onConflictDoNothing };
}

// Helper: build a chainable delete mock
function makeDeleteChain() {
  const whereMock = vi.fn().mockResolvedValue(undefined);
  mockDb.delete.mockReturnValue({ where: whereMock });
  return { whereMock };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.api.getSession.mockResolvedValue(TEST_SESSION);
});

describe('auth/queries', () => {
  describe('topics', () => {
    test('saveTopics stores selected topics for a new user (USER-01)', async () => {
      const { whereMock: deleteWhereMock } = makeDeleteChain();
      const { valuesMock } = makeInsertChain();

      await saveTopics(['healthcare', 'taxes']);

      // Delete old topics first
      expect(mockDb.delete).toHaveBeenCalled();
      expect(deleteWhereMock).toHaveBeenCalled();

      // Insert new topics
      expect(mockDb.insert).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith([
        { userId: TEST_USER_ID, topic: 'healthcare' },
        { userId: TEST_USER_ID, topic: 'taxes' },
      ]);

      // Redirect to homepage
      expect(redirect).toHaveBeenCalledWith('/');
    });

    test('getUserTopics returns empty array for user with no topics (USER-03)', async () => {
      // getUserTopics: select().from().where() — where returns the result directly
      const whereMock = vi.fn().mockResolvedValue([]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await getUserTopics(TEST_USER_ID);

      expect(result).toEqual([]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('getUserTopics returns saved topic strings (PERS-01)', async () => {
      const whereMock = vi.fn().mockResolvedValue([
        { topic: 'healthcare' },
        { topic: 'environment' },
      ]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await getUserTopics(TEST_USER_ID);

      expect(result).toEqual(['healthcare', 'environment']);
    });

    test('updateTopics replaces existing topics on profile (PERS-02)', async () => {
      makeDeleteChain();
      const { valuesMock } = makeInsertChain();

      await updateTopics(['education', 'defense']);

      // Delete old topics
      expect(mockDb.delete).toHaveBeenCalled();

      // Insert new topics
      expect(mockDb.insert).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith([
        { userId: TEST_USER_ID, topic: 'education' },
        { userId: TEST_USER_ID, topic: 'defense' },
      ]);

      // Does NOT redirect — revalidates /profile instead
      expect(redirect).not.toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/profile');
    });
  });

  describe('bookmarks', () => {
    test('toggleBookmark adds a bookmark, second call removes it (PERS-03)', async () => {
      // First call: no existing bookmark → insert
      const { whereMock: selectWhereMock } = makeSelectChain([]);
      const { valuesMock, onConflictDoNothing } = makeInsertChain();

      await toggleBookmark('policy-item-uuid');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(onConflictDoNothing).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        policyItemId: 'policy-item-uuid',
      });

      vi.clearAllMocks();
      mockAuth.api.getSession.mockResolvedValue(TEST_SESSION);

      // Second call: existing bookmark found → delete
      makeSelectChain([{ userId: TEST_USER_ID, policyItemId: 'policy-item-uuid' }]);
      const { whereMock: deleteWhereMock } = makeDeleteChain();

      await toggleBookmark('policy-item-uuid');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
      expect(deleteWhereMock).toHaveBeenCalled();
    });

    test('getBookmarkedItems returns bookmarked policy items with join (PERS-04)', async () => {
      const fakeItem = {
        item: {
          id: 'policy-item-uuid',
          title: 'Healthcare Reform Act',
          type: 'bill',
        },
      };

      const orderByMock = vi.fn().mockResolvedValue([fakeItem]);
      const innerJoinWhereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const innerJoinMock = vi.fn().mockReturnValue({ where: innerJoinWhereMock });
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await getBookmarkedItems(TEST_USER_ID);

      expect(mockDb.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalled();
      expect(innerJoinMock).toHaveBeenCalled();
      expect(result).toEqual([fakeItem]);
    });
  });
});
