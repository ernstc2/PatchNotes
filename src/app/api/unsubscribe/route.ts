import type { NextRequest } from 'next/server';
import { verifyUnsubToken } from '@/features/notifications/token';
import { db } from '@/lib/db';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const userId = verifyUnsubToken(token);

  if (!userId) {
    return new Response('Invalid or expired unsubscribe link', { status: 400 });
  }

  await db
    .insert(notificationPrefs)
    .values({ userId, optedOut: true })
    .onConflictDoUpdate({
      target: notificationPrefs.userId,
      set: {
        optedOut: true,
        updatedAt: new Date(),
      },
    });

  return Response.redirect(new URL('/unsubscribed', request.url));
}
