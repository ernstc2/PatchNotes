import 'dotenv/config';
import { isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { policyItems } from '@/lib/db/schema/items';
import { summarizeItem } from '@/features/summarization/summarize';

// Usage:
//   npx tsx src/scripts/backfill-topics.ts
//   npx tsx src/scripts/backfill-topics.ts --limit 900

const limit = process.argv.includes('--limit')
  ? parseInt(process.argv[process.argv.indexOf('--limit') + 1], 10)
  : Infinity;

async function main() {
  console.log('Fetching items where topic IS NULL...');

  const rows = await db.select().from(policyItems).where(isNull(policyItems.topic));

  const items = isFinite(limit) ? rows.slice(0, limit) : rows;
  const total = items.length;

  console.log(`Found ${total} item(s) to backfill${isFinite(limit) ? ` (limit: ${limit})` : ''}.`);

  if (total === 0) {
    console.log('Nothing to do. All items already have a topic.');
    process.exit(0);
  }

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${total}] ${item.id}`);
    try {
      await summarizeItem(item);
      succeeded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${message}`);
      failed++;
    }
  }

  console.log(`\nBackfill complete. Succeeded: ${succeeded}, Failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
