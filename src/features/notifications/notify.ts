import { Resend } from 'resend';
import { render } from '@react-email/components';
import { DigestEmail } from './email';
import { getUsersWithMatchingItems } from './queries';
import { generateUnsubToken } from './token';
import type { NotificationResult } from './types';
import { db } from '@/lib/db';
import { notificationPrefs } from '@/lib/db/schema/notification-prefs';
import { inArray } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function runNotifications(): Promise<NotificationResult> {
  try {
    // Gracefully skip if API key is not configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('[notify] RESEND_API_KEY not configured — skipping email notifications');
      return { sent: 0, skipped: 0, errors: ['RESEND_API_KEY not configured'] };
    }

    const allRecipients = await getUsersWithMatchingItems();

    if (allRecipients.length === 0) {
      return { sent: 0, skipped: 0, errors: [] };
    }

    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    // Duplicate check: fetch notifiedDate for today
    const notifiedTodayRows = await db
      .select({ userId: notificationPrefs.userId, notifiedDate: notificationPrefs.notifiedDate })
      .from(notificationPrefs)
      .where(
        inArray(
          notificationPrefs.userId,
          allRecipients.map((r) => r.userId)
        )
      );

    const notifiedTodaySet = new Set(
      notifiedTodayRows
        .filter((row) => row.notifiedDate === todayStr)
        .map((row) => row.userId)
    );

    const recipients = allRecipients.filter((r) => !notifiedTodaySet.has(r.userId));
    const skipped = allRecipients.length - recipients.length;

    if (recipients.length === 0) {
      return { sent: 0, skipped, errors: [] };
    }

    if (recipients.length > 95) {
      console.warn(`[notify] Approaching Resend free tier limit: ${recipients.length} recipients`);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Build email payloads
    const emails = await Promise.all(
      recipients.map(async (r) => {
        const token = generateUnsubToken(r.userId);
        const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${token}`;
        const html = await render(DigestEmail({ name: r.name, items: r.items, unsubscribeUrl }));
        return {
          from: 'PatchNotes <onboarding@resend.dev>',
          to: [r.email],
          subject: `Your PatchNotes Digest — ${todayStr}`,
          html,
        };
      })
    );

    // Send batch
    const batchResult = await resend.batch.send(emails);

    if (batchResult.error) {
      const message = batchResult.error.message ?? 'Unknown Resend batch error';
      console.error('[notify] Resend batch error:', message);
      return { sent: 0, skipped, errors: [message] };
    }

    // Record notifiedDate for each sent recipient
    if (recipients.length > 0) {
      await db
        .insert(notificationPrefs)
        .values(
          recipients.map((r) => ({
            userId: r.userId,
            optedOut: false,
            notifiedDate: todayStr,
          }))
        )
        .onConflictDoUpdate({
          target: notificationPrefs.userId,
          set: {
            notifiedDate: todayStr,
            updatedAt: new Date(),
          },
        });
    }

    return { sent: recipients.length, skipped, errors: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[notify] Unexpected error:', message);
    return { sent: 0, skipped: 0, errors: [message] };
  }
}
