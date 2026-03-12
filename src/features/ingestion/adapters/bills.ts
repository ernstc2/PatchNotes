import pRetry, { AbortError } from 'p-retry';
import { z } from 'zod';
import type { AdapterResult, RawItem } from '../types';

const USER_AGENT = 'PatchNotes/1.0 (portfolio project)';
const BASE_URL = 'https://api.congress.gov/v3/bill';

const CongressBillSchema = z.object({
  congress: z.number(),
  type: z.string(),
  number: z.number(),
  title: z.string().optional().nullable(),
  url: z.string(),
  updateDate: z.string(),
  latestAction: z
    .object({
      actionDate: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

const CongressResponseSchema = z.object({
  bills: z.array(CongressBillSchema),
});

function getBillSourceUrl(congress: number, type: string, number: number): string {
  // Convert type abbreviation to congress.gov URL segment
  // e.g. HR -> house-bill, S -> senate-bill, HJRES -> house-joint-resolution, etc.
  const typeMap: Record<string, string> = {
    HR: 'house-bill',
    S: 'senate-bill',
    HJRES: 'house-joint-resolution',
    SJRES: 'senate-joint-resolution',
    HCONRES: 'house-concurrent-resolution',
    SCONRES: 'senate-concurrent-resolution',
    HRES: 'house-resolution',
    SRES: 'senate-resolution',
  };
  const typeSegment = typeMap[type.toUpperCase()] ?? type.toLowerCase();
  return `https://www.congress.gov/bill/${congress}th-congress/${typeSegment}/${number}`;
}

async function fetchPage(): Promise<RawItem[]> {
  const apiKey = process.env.CONGRESS_API_KEY;

  const now = new Date();
  const msIn25Hours = 25 * 60 * 60 * 1000;
  const from = new Date(now.getTime() - msIn25Hours);

  const params = new URLSearchParams();
  params.set('fromDateTime', from.toISOString());
  params.set('toDateTime', now.toISOString());
  params.set('sort', 'updateDate+desc');
  params.set('limit', '10');
  params.set('api_key', apiKey!);

  const url = `${BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (response.status >= 400 && response.status < 500) {
    throw new AbortError(
      `Congress.gov API returned ${response.status}: ${response.statusText}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Congress.gov API returned ${response.status}: ${response.statusText}`
    );
  }

  const data: unknown = await response.json();
  const parsed = CongressResponseSchema.safeParse(data);

  if (!parsed.success) {
    console.warn('[bills] Response validation failed:', parsed.error.message);
    return [];
  }

  return parsed.data.bills.map((bill): RawItem => ({
    sourceId: `${bill.congress}-${bill.type}-${bill.number}`,
    source: 'congress_bill',
    type: 'bill',
    title: bill.title ?? `${bill.type} ${bill.number}`,
    date: new Date(bill.latestAction?.actionDate ?? bill.updateDate),
    sourceUrl: getBillSourceUrl(bill.congress, bill.type, bill.number),
  }));
}

export async function fetchBills(): Promise<AdapterResult> {
  const fetchedAt = new Date();

  if (!process.env.CONGRESS_API_KEY) {
    const message = 'CONGRESS_API_KEY environment variable is not set';
    console.error('[bills]', message);
    return {
      source: 'congress_bill',
      items: [],
      fetchedAt,
      error: message,
    };
  }

  try {
    const items = await pRetry(fetchPage, {
      retries: 3,
      onFailedAttempt: (context) => {
        console.warn(
          `[bills] Attempt ${context.attemptNumber} failed. Retries left: ${context.retriesLeft}. Error: ${context.error.message}`
        );
      },
    });

    return {
      source: 'congress_bill',
      items,
      fetchedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[bills] All retries exhausted:', message);
    return {
      source: 'congress_bill',
      items: [],
      fetchedAt,
      error: message,
    };
  }
}
