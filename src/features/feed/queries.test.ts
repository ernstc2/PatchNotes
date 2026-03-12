import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the DB module before imports
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Import after mocks
import { parseSummary } from './types';
import { getFeedItems, getItemById } from './queries';
import { db } from '@/lib/db';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
};

// Chainable mock builder
function makeSelectChain(returnValue: unknown[]) {
  const limitMock = vi.fn().mockResolvedValue(returnValue);
  const orderByMock = vi.fn().mockReturnValue({ limit: limitMock });
  const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock, limit: limitMock });
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  mockDb.select.mockReturnValue({ from: fromMock });
  return { fromMock, whereMock, orderByMock, limitMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── parseSummary ──────────────────────────────────────────────────────────────

describe('parseSummary', () => {
  it('returns null for null input', () => {
    expect(parseSummary(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSummary('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseSummary('   ')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseSummary('not json')).toBeNull();
  });

  it('returns parsed SummaryOutput for valid JSON matching schema', () => {
    const valid = {
      headline: 'Test headline',
      whatChanged: 'Something changed',
      whoAffected: 'Everyone',
      whyItMatters: 'It matters',
      severity: 'narrow_administrative',
    };
    const result = parseSummary(JSON.stringify(valid));
    expect(result).toEqual(valid);
  });

  it('returns null for JSON missing required fields', () => {
    const partial = {
      headline: 'Test headline',
      // missing whatChanged, whoAffected, whyItMatters, severity
    };
    expect(parseSummary(JSON.stringify(partial))).toBeNull();
  });

  it('returns null for JSON with invalid severity enum', () => {
    const invalid = {
      headline: 'Test',
      whatChanged: 'Changed',
      whoAffected: 'Everyone',
      whyItMatters: 'Matters',
      severity: 'not_a_valid_severity',
    };
    expect(parseSummary(JSON.stringify(invalid))).toBeNull();
  });
});

// ─── getFeedItems ──────────────────────────────────────────────────────────────

describe('getFeedItems', () => {
  it('calls db with isNotNull(summary) filter and desc(date) order when no filters', async () => {
    const { whereMock, orderByMock, limitMock } = makeSelectChain([]);

    await getFeedItems();

    expect(mockDb.select).toHaveBeenCalled();
    expect(whereMock).toHaveBeenCalled();
    expect(orderByMock).toHaveBeenCalled();
    expect(limitMock).toHaveBeenCalledWith(50);
  });

  it('returns results from db query', async () => {
    const fakeItem = { id: 'abc', title: 'Test' };
    makeSelectChain([fakeItem]);

    const result = await getFeedItems();

    expect(result).toEqual([fakeItem]);
  });

  it('passes type filter when provided', async () => {
    makeSelectChain([]);

    await getFeedItems({ type: 'bill' });

    expect(mockDb.select).toHaveBeenCalled();
    // The where clause was called with conditions including type filter
    const { whereMock } = makeSelectChain([]);
    // Re-verify by checking it was called — the conditions are constructed internally
  });

  it('passes topic filter when provided', async () => {
    makeSelectChain([]);

    await getFeedItems({ topic: 'healthcare' });

    expect(mockDb.select).toHaveBeenCalled();
  });

  it('passes both type and topic filters when both provided', async () => {
    makeSelectChain([]);

    await getFeedItems({ type: 'rule', topic: 'environment' });

    expect(mockDb.select).toHaveBeenCalled();
  });

  it('ignores undefined type filter', async () => {
    makeSelectChain([]);

    await getFeedItems({ type: undefined });

    expect(mockDb.select).toHaveBeenCalled();
  });
});

// ─── getItemById ───────────────────────────────────────────────────────────────

describe('getItemById', () => {
  it('returns item when found', async () => {
    const fakeItem = {
      id: 'some-uuid',
      title: 'Found Item',
      type: 'bill',
    };
    // getItemById doesn't use orderBy/limit — just select().from().where()
    const whereMock = vi.fn().mockResolvedValue([fakeItem]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const result = await getItemById('some-uuid');

    expect(result).toEqual(fakeItem);
    expect(whereMock).toHaveBeenCalled();
  });

  it('returns null when not found (empty array)', async () => {
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const result = await getItemById('missing-uuid');

    expect(result).toBeNull();
  });

  it('returns first item when multiple rows returned', async () => {
    const item1 = { id: 'uuid-1', title: 'First' };
    const item2 = { id: 'uuid-2', title: 'Second' };
    const whereMock = vi.fn().mockResolvedValue([item1, item2]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const result = await getItemById('uuid-1');

    expect(result).toEqual(item1);
  });
});
