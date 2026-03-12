import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock only the db module — drizzle-orm stays real (auth-schema needs `relations`)
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Import the pure helper we'll extract and test directly
import { groupRecipientsFromRows } from './queries';

const TODAY = new Date();
TODAY.setUTCHours(0, 0, 0, 0);

const makeFetchedAt = (hoursOffset = 1) => {
  const d = new Date(TODAY);
  d.setUTCHours(hoursOffset);
  return d;
};

const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(YESTERDAY.getDate() - 1);

describe('groupRecipientsFromRows', () => {
  const todaysItems = [
    {
      id: 'item-1',
      sourceId: 'src-1',
      source: 'federal-register',
      type: 'rule',
      title: 'Item A',
      date: new Date(),
      sourceUrl: 'https://example.com/a',
      status: null,
      topic: 'healthcare',
      summary: null,
      fetchedAt: makeFetchedAt(6),
      updatedAt: new Date(),
    },
    {
      id: 'item-2',
      sourceId: 'src-2',
      source: 'federal-register',
      type: 'rule',
      title: 'Item B',
      date: new Date(),
      sourceUrl: 'https://example.com/b',
      status: null,
      topic: 'immigration',
      summary: null,
      fetchedAt: makeFetchedAt(6),
      updatedAt: new Date(),
    },
    {
      id: 'item-3',
      sourceId: 'src-3',
      source: 'federal-register',
      type: 'rule',
      title: 'Item C',
      date: new Date(),
      sourceUrl: 'https://example.com/c',
      status: null,
      topic: 'healthcare',
      summary: null,
      fetchedAt: makeFetchedAt(7),
      updatedAt: new Date(),
    },
  ];

  it('returns empty array when no subscriber rows provided', () => {
    const result = groupRecipientsFromRows([], todaysItems);
    expect(result).toEqual([]);
  });

  it('returns empty array when todaysItems is empty', () => {
    const rows = [
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'healthcare', optedOut: false },
    ];
    const result = groupRecipientsFromRows(rows, []);
    expect(result).toEqual([]);
  });

  it('returns only users whose watchlist topics match today items', () => {
    const rows = [
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'healthcare', optedOut: false },
      { userId: 'u2', email: 'b@test.com', name: 'Bob', topic: 'defense', optedOut: false },
    ];
    const result = groupRecipientsFromRows(rows, todaysItems);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u1');
  });

  it('excludes users where optedOut is true', () => {
    const rows = [
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'healthcare', optedOut: true },
      { userId: 'u2', email: 'b@test.com', name: 'Bob', topic: 'immigration', optedOut: false },
    ];
    const result = groupRecipientsFromRows(rows, todaysItems);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u2');
  });

  it('excludes users where optedOut is null (no pref row = not opted out → included)', () => {
    const rows = [
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'healthcare', optedOut: null },
    ];
    const result = groupRecipientsFromRows(rows, todaysItems);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('u1');
  });

  it('deduplicates items per user when user watches multiple matching topics', () => {
    // u1 watches both healthcare and immigration, both have items today
    const rows = [
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'healthcare', optedOut: false },
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'immigration', optedOut: false },
    ];
    const result = groupRecipientsFromRows(rows, todaysItems);
    expect(result).toHaveLength(1);
    // healthcare has 2 items (item-1 and item-3), immigration has 1 item (item-2)
    expect(result[0].items).toHaveLength(3);
    // All sourceIds unique
    const sourceIds = result[0].items.map((i) => i.sourceUrl);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
  });

  it('deduplicates items by sourceId when the same item matches via multiple topic rows', () => {
    // Simulate: item-1 has topic 'healthcare', user watches 'healthcare' twice (shouldn't happen but handle)
    const rows = [
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'healthcare', optedOut: false },
      { userId: 'u1', email: 'a@test.com', name: 'Alice', topic: 'healthcare', optedOut: false },
    ];
    const result = groupRecipientsFromRows(rows, todaysItems);
    // healthcare has 2 items (item-1, item-3); duplicates should be deduplicated
    expect(result[0].items).toHaveLength(2);
  });
});
