import { desc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { systemStatus } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

const INGESTION_SOURCES = [
  'federal_register_eo',
  'congress_bill',
  'federal_register_rule',
] as const;

export async function GET() {
  const rows = await db
    .select()
    .from(systemStatus)
    .where(inArray(systemStatus.service, [...INGESTION_SOURCES]))
    .orderBy(desc(systemStatus.checkedAt))
    .limit(6);

  return Response.json({ sources: rows });
}
