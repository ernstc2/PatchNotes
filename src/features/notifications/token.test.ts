import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  vi.stubEnv('UNSUBSCRIBE_SECRET', 'test-secret-key');
});

describe('generateUnsubToken', () => {
  it('returns a non-empty base64url string', async () => {
    const { generateUnsubToken } = await import('./token');
    const token = generateUnsubToken('user123');
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('produces different tokens for different userIds', async () => {
    const { generateUnsubToken } = await import('./token');
    const token1 = generateUnsubToken('user123');
    const token2 = generateUnsubToken('user456');
    expect(token1).not.toBe(token2);
  });
});

describe('verifyUnsubToken', () => {
  it('round-trips: verifyUnsubToken(generateUnsubToken(userId)) returns userId', async () => {
    const { generateUnsubToken, verifyUnsubToken } = await import('./token');
    const token = generateUnsubToken('user123');
    expect(verifyUnsubToken(token)).toBe('user123');
  });

  it('returns null for garbage input', async () => {
    const { verifyUnsubToken } = await import('./token');
    expect(verifyUnsubToken('garbage')).toBeNull();
  });

  it('returns null when the signature portion is modified', async () => {
    const { generateUnsubToken, verifyUnsubToken } = await import('./token');
    const token = generateUnsubToken('user123');
    // Decode, tamper signature, re-encode
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [userId] = decoded.split(':');
    const tampered = Buffer.from(`${userId}:invalidsignature`).toString('base64url');
    expect(verifyUnsubToken(tampered)).toBeNull();
  });
});
