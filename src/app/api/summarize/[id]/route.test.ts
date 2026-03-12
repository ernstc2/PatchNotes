import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PolicyItem } from '@/lib/db/schema/items';

// Mock DB module
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock summarize module
vi.mock('@/features/summarization/summarize', () => ({
  summarizeItem: vi.fn(),
}));

// Import after mocks
import { GET } from './route';
import { db } from '@/lib/db';
import { summarizeItem } from '@/features/summarization/summarize';

const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
};
const mockSummarizeItem = summarizeItem as unknown as ReturnType<typeof vi.fn>;

function makePolicyItem(overrides: Partial<PolicyItem> = {}): PolicyItem {
  return {
    id: 'test-id',
    sourceId: 'src-001',
    source: 'federal_register',
    type: 'executive_order',
    title: 'Test Policy Item',
    date: new Date('2026-01-01'),
    sourceUrl: 'https://example.com/policy',
    status: 'active',
    topic: null,
    summary: null,
    fetchedAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const validSummaryJson = JSON.stringify({
  headline: 'Test headline',
  whatChanged: 'Something changed',
  whoAffected: 'Everyone',
  whyItMatters: 'It matters',
  severity: 'narrow_administrative',
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/summarize/[id]', () => {
  it('returns cached summary immediately without calling summarizeItem (cache-hit)', async () => {
    const item = makePolicyItem({ summary: validSummaryJson });

    const whereMock = vi.fn().mockResolvedValue([item]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const response = await GET(
      new Request('http://localhost/api/summarize/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      summary: JSON.parse(validSummaryJson),
      cached: true,
    });
    expect(mockSummarizeItem).not.toHaveBeenCalled();
  });

  it('generates and persists summary for unsummarized items (cache-miss)', async () => {
    const itemWithoutSummary = makePolicyItem({ summary: null });
    const itemWithSummary = makePolicyItem({ summary: validSummaryJson });

    const whereMock = vi.fn()
      .mockResolvedValueOnce([itemWithoutSummary]) // first DB query — no summary
      .mockResolvedValueOnce([itemWithSummary]);   // re-query after summarizeItem
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    mockSummarizeItem.mockResolvedValue(undefined);

    const response = await GET(
      new Request('http://localhost/api/summarize/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      summary: JSON.parse(validSummaryJson),
      cached: false,
    });
    expect(mockSummarizeItem).toHaveBeenCalledOnce();
    expect(mockSummarizeItem).toHaveBeenCalledWith(itemWithoutSummary);
  });

  it('returns 404 for nonexistent item IDs', async () => {
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const response = await GET(
      new Request('http://localhost/api/summarize/nonexistent-id'),
      { params: Promise.resolve({ id: 'nonexistent-id' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: 'Not found' });
  });

  it('returns 500 on internal error', async () => {
    const fromMock = vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('DB connection failed')),
    });
    mockDb.select.mockReturnValue({ from: fromMock });

    const response = await GET(
      new Request('http://localhost/api/summarize/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toHaveProperty('error');
    expect(body.error).toBe('DB connection failed');
  });
});
