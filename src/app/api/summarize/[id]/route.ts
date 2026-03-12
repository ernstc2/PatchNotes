import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import { summarizeItem } from '@/features/summarization/summarize';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    const [item] = await db.select().from(policyItems).where(eq(policyItems.id, id));

    if (!item) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Cache hit: summary already exists
    if (item.summary) {
      return Response.json({ summary: JSON.parse(item.summary), cached: true });
    }

    // Cache miss: generate and persist summary on-demand
    await summarizeItem(item);

    // Re-query to get the persisted summary
    const [updated] = await db.select().from(policyItems).where(eq(policyItems.id, id));

    return Response.json({ summary: JSON.parse(updated.summary!), cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
