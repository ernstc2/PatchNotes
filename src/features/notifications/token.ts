import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET is required');
  }
  return secret;
}

export function generateUnsubToken(userId: string): string {
  const SECRET = getSecret();
  const hmac = createHmac('sha256', SECRET);
  hmac.update(userId);
  const sig = hmac.digest('base64url'); // URL-safe, no padding issues
  return Buffer.from(`${userId}:${sig}`).toString('base64url');
}

export function verifyUnsubToken(token: string): string | null {
  try {
    const SECRET = getSecret();
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [userId, sig] = decoded.split(':');
    if (!userId || !sig) return null;

    const expected = (() => {
      const h = createHmac('sha256', SECRET);
      h.update(userId);
      return h.digest('base64url');
    })();

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}
