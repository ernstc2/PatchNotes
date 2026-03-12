import pRetry, { AbortError } from 'p-retry';
import { z } from 'zod';
import type { AdapterResult, RawItem } from '../types';

const USER_AGENT = 'PatchNotes/1.0 (portfolio project)';
const BASE_URL = 'https://www.federalregister.gov/api/v1/articles.json';

const FederalRegisterResultSchema = z.object({
  document_number: z.string(),
  title: z.string(),
  publication_date: z.string(),
  html_url: z.string(),
  type: z.string(),
  subtype: z.string().nullable().optional(),
});

const FederalRegisterResponseSchema = z.object({
  results: z.array(FederalRegisterResultSchema),
});

function getDateRange(): { gte: string; lte: string } {
  const now = new Date();
  const msIn25Hours = 25 * 60 * 60 * 1000;
  const yesterday = new Date(now.getTime() - msIn25Hours);

  const toYYYYMMDD = (d: Date) => d.toISOString().slice(0, 10);
  return { gte: toYYYYMMDD(yesterday), lte: toYYYYMMDD(now) };
}

async function fetchPage(): Promise<RawItem[]> {
  const { gte, lte } = getDateRange();

  const params = new URLSearchParams();
  // Both RULE and PRORULE — must use repeated keys with append
  params.append('conditions[type][]', 'RULE');
  params.append('conditions[type][]', 'PRORULE');
  params.set('conditions[publication_date][gte]', gte);
  params.set('conditions[publication_date][lte]', lte);
  params.append('fields[]', 'document_number');
  params.append('fields[]', 'title');
  params.append('fields[]', 'publication_date');
  params.append('fields[]', 'html_url');
  params.append('fields[]', 'type');
  params.append('fields[]', 'subtype');
  params.set('per_page', '10');
  params.set('order', 'newest');

  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (response.status >= 400 && response.status < 500) {
    throw new AbortError(
      `Federal Register Regulations API returned ${response.status}: ${response.statusText}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Federal Register Regulations API returned ${response.status}: ${response.statusText}`
    );
  }

  const data: unknown = await response.json();
  const parsed = FederalRegisterResponseSchema.safeParse(data);

  if (!parsed.success) {
    console.warn('[regulations] Response validation failed:', parsed.error.message);
    return [];
  }

  return parsed.data.results.map((result): RawItem => ({
    sourceId: result.document_number,
    source: 'federal_register_rule',
    type: result.type === 'Rule' ? 'rule' : 'proposed_rule',
    title: result.title,
    date: new Date(result.publication_date),
    sourceUrl: result.html_url,
  }));
}

export async function fetchRegulations(): Promise<AdapterResult> {
  const fetchedAt = new Date();

  try {
    const items = await pRetry(fetchPage, {
      retries: 3,
      onFailedAttempt: (context) => {
        console.warn(
          `[regulations] Attempt ${context.attemptNumber} failed. Retries left: ${context.retriesLeft}. Error: ${context.error.message}`
        );
      },
    });

    return {
      source: 'federal_register_rule',
      items,
      fetchedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[regulations] All retries exhausted:', message);
    return {
      source: 'federal_register_rule',
      items: [],
      fetchedAt,
      error: message,
    };
  }
}
