import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PolicyItem } from '@/lib/db/schema/items';
import type { SummaryOutput } from './schema';

// Mock the DB module
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock gemini module
vi.mock('./gemini', () => ({
  generateSummary: vi.fn(),
}));

// Import after mocks are set up
import { runSummarization, summarizeItem } from './summarize';
import { db } from '@/lib/db';
import { generateSummary } from './gemini';

// Helpers
const mockDb = db as unknown as {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
const mockGenerateSummary = generateSummary as unknown as ReturnType<typeof vi.fn>;

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

const validSummary: SummaryOutput = {
  headline: 'Test headline',
  whatChanged: 'Something changed',
  whoAffected: 'Everyone',
  whyItMatters: 'It matters',
  severity: 'narrow_administrative',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('runSummarization', () => {
  it('returns zero summarized when all items already have summaries (cache-miss gate)', async () => {
    // Mock DB to return empty array — no items need summarization
    const whereMock = vi.fn().mockResolvedValue([]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const result = await runSummarization();

    expect(result).toEqual({ summarized: 0, errors: [] });
    expect(mockGenerateSummary).not.toHaveBeenCalled();
  });

  it('calls summarizeItem for each unsummarized item', async () => {
    const item1 = makePolicyItem({ id: 'id-1' });
    const item2 = makePolicyItem({ id: 'id-2' });

    const whereMock = vi.fn().mockResolvedValue([item1, item2]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    // Mock the update chain for summarizeItem
    const whereMock2 = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMock2 });
    mockDb.update.mockReturnValue({ set: setMock });

    mockGenerateSummary.mockResolvedValue(validSummary);

    const result = await runSummarization();

    expect(result.summarized).toBe(2);
    expect(result.errors).toEqual([]);
    expect(mockGenerateSummary).toHaveBeenCalledTimes(2);
  });

  it('continues processing remaining items when one fails', async () => {
    const item1 = makePolicyItem({ id: 'id-1' });
    const item2 = makePolicyItem({ id: 'id-2' });

    const whereMock = vi.fn().mockResolvedValue([item1, item2]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const whereMock2 = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMock2 });
    mockDb.update.mockReturnValue({ set: setMock });

    // item1: generateSummary throws on attempt 1 (error propagates, summarizeItem throws)
    // item2: generateSummary returns validSummary on first call
    mockGenerateSummary
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(validSummary);

    const result = await runSummarization();

    // item1 fails (throws on attempt 1 — error propagates up), item2 succeeds
    expect(result.summarized).toBe(1);
    expect(result.errors.length).toBe(1);
  });
});

describe('summarizeItem', () => {
  it('calls generateSummary and writes result to DB on success', async () => {
    const item = makePolicyItem();

    const whereMock = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    mockGenerateSummary.mockResolvedValue(validSummary);

    await summarizeItem(item);

    expect(mockGenerateSummary).toHaveBeenCalledTimes(1);
    expect(mockGenerateSummary).toHaveBeenCalledWith(item);
    expect(mockDb.update).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: JSON.stringify(validSummary),
        updatedAt: expect.any(Date),
      })
    );
  });

  it('retries once on null return from generateSummary, then falls back to raw excerpt', async () => {
    const item = makePolicyItem({ title: 'My Policy Title' });

    const whereMock = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    // Both calls return null — should trigger fallback
    mockGenerateSummary.mockResolvedValue(null);

    await summarizeItem(item);

    // Should have been called twice (initial + one retry)
    expect(mockGenerateSummary).toHaveBeenCalledTimes(2);

    // Should still write to DB with fallback data
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.stringContaining('My Policy Title'),
        updatedAt: expect.any(Date),
      })
    );
  });

  it('raw excerpt fallback produces valid SummarySchema-shaped data', async () => {
    const item = makePolicyItem({ title: 'Long title that might get sliced down to 120 chars maximum allowed' });

    const whereMock = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    mockGenerateSummary.mockResolvedValue(null);

    await summarizeItem(item);

    // Capture what was written to DB
    const writtenSummaryJson = setMock.mock.calls[0][0].summary as string;
    const written = JSON.parse(writtenSummaryJson);

    expect(written).toMatchObject({
      headline: expect.any(String),
      whatChanged: expect.any(String),
      whoAffected: expect.any(String),
      whyItMatters: expect.any(String),
      severity: expect.stringMatching(/^(broad_national|moderate_regional|narrow_administrative)$/),
    });

    // headline should use item title (sliced to 120)
    expect(written.headline).toBe(item.title.slice(0, 120));
  });

  it('sets updatedAt to a Date in the DB update call', async () => {
    const item = makePolicyItem();

    const whereMock = vi.fn().mockResolvedValue([]);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    mockGenerateSummary.mockResolvedValue(validSummary);

    const before = new Date();
    await summarizeItem(item);
    const after = new Date();

    const updatedAt = setMock.mock.calls[0][0].updatedAt as Date;
    expect(updatedAt).toBeInstanceOf(Date);
    expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
