import type { PolicyItem } from '@/lib/db/schema/items';
import { SummarySchema } from '@/features/summarization/schema';
import type { SummaryOutput } from '@/features/summarization/schema';

export type { SummaryOutput };

export type FeedItem = PolicyItem & { parsedSummary: SummaryOutput | null };

export function parseSummary(raw: string | null): SummaryOutput | null {
  if (!raw || raw.trim() === '') return null;
  try {
    const parsed = JSON.parse(raw);
    const result = SummarySchema.safeParse(parsed);
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export interface FeedFilters {
  q?: string;
  type?: string;
  topic?: string;    // single explicit URL param (FilterBar click)
  topics?: string[]; // watchlist multi-topic array (homepage personalization)
  sort?: string; // 'asc' | 'desc', default 'desc'
}
