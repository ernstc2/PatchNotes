import { describe, it, expect } from 'vitest';
import { SummarySchema, summaryJsonSchema } from './schema';
import { buildPrompt } from './prompt';
import type { PolicyItem } from '@/lib/db/schema/items';

const validSummary = {
  headline: 'Federal agency updates data reporting requirements for healthcare providers.',
  whatChanged: 'The rule requires quarterly submission of patient outcome metrics.',
  whoAffected: 'Hospitals and outpatient clinics with more than 50 employees.',
  whyItMatters: 'Non-compliance may result in reduced Medicare reimbursements.',
  severity: 'moderate_regional' as const,
};

const mockPolicyItem: PolicyItem = {
  id: 'test-uuid-1234',
  sourceId: 'EO-12345',
  source: 'federal_register_eo',
  type: 'executive_order',
  title: 'Executive Order on Healthcare Data Transparency',
  date: new Date('2026-01-15T00:00:00Z'),
  sourceUrl: 'https://www.federalregister.gov/documents/2026/01/15/example',
  status: 'active',
  topic: null,
  summary: null,
  fetchedAt: new Date('2026-01-16T00:00:00Z'),
  updatedAt: new Date('2026-01-16T00:00:00Z'),
};

describe('SummarySchema', () => {
  it('succeeds for a valid object with all 5 fields', () => {
    const result = SummarySchema.safeParse(validSummary);
    expect(result.success).toBe(true);
  });

  it('fails when headline is missing', () => {
    const { headline: _, ...rest } = validSummary;
    const result = SummarySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when whatChanged is missing', () => {
    const { whatChanged: _, ...rest } = validSummary;
    const result = SummarySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when whoAffected is missing', () => {
    const { whoAffected: _, ...rest } = validSummary;
    const result = SummarySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when whyItMatters is missing', () => {
    const { whyItMatters: _, ...rest } = validSummary;
    const result = SummarySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when severity is missing', () => {
    const { severity: _, ...rest } = validSummary;
    const result = SummarySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails for invalid severity value "high"', () => {
    const result = SummarySchema.safeParse({ ...validSummary, severity: 'high' });
    expect(result.success).toBe(false);
  });

  it('fails for invalid severity value "low"', () => {
    const result = SummarySchema.safeParse({ ...validSummary, severity: 'low' });
    expect(result.success).toBe(false);
  });

  it('accepts severity: broad_national', () => {
    const result = SummarySchema.safeParse({ ...validSummary, severity: 'broad_national' });
    expect(result.success).toBe(true);
  });

  it('accepts severity: moderate_regional', () => {
    const result = SummarySchema.safeParse({ ...validSummary, severity: 'moderate_regional' });
    expect(result.success).toBe(true);
  });

  it('accepts severity: narrow_administrative', () => {
    const result = SummarySchema.safeParse({ ...validSummary, severity: 'narrow_administrative' });
    expect(result.success).toBe(true);
  });
});

describe('summaryJsonSchema', () => {
  it('returns an object with type "object"', () => {
    expect(summaryJsonSchema).toHaveProperty('type', 'object');
  });

  it('has all 5 properties in the schema', () => {
    const props = (summaryJsonSchema as Record<string, unknown>).properties as Record<string, unknown>;
    expect(props).toHaveProperty('headline');
    expect(props).toHaveProperty('whatChanged');
    expect(props).toHaveProperty('whoAffected');
    expect(props).toHaveProperty('whyItMatters');
    expect(props).toHaveProperty('severity');
  });
});

describe('buildPrompt', () => {
  it('returns a string', () => {
    const prompt = buildPrompt(mockPolicyItem);
    expect(typeof prompt).toBe('string');
  });

  it('includes the item title', () => {
    const prompt = buildPrompt(mockPolicyItem);
    expect(prompt).toContain('Executive Order on Healthcare Data Transparency');
  });

  it('includes the item type', () => {
    const prompt = buildPrompt(mockPolicyItem);
    expect(prompt).toContain('executive_order');
  });

  it('includes the item date (ISO slice 0-10)', () => {
    const prompt = buildPrompt(mockPolicyItem);
    expect(prompt).toContain('2026-01-15');
  });

  it('includes nonpartisan instruction', () => {
    const prompt = buildPrompt(mockPolicyItem);
    expect(prompt.toLowerCase()).toContain('nonpartisan');
  });

  it('includes plain language instruction', () => {
    const prompt = buildPrompt(mockPolicyItem);
    expect(prompt.toLowerCase()).toContain('plain language');
  });
});
