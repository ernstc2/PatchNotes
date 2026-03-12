import type { NextRequest } from 'next/server';
import { runIngest } from '@/features/ingestion/ingest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await runIngest();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[cron/ingest] Unexpected error:', message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
