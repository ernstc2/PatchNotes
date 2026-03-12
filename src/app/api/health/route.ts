import { db } from '@/lib/db';
import { systemStatus } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.select().from(systemStatus).limit(1);
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
