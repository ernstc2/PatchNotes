import { Suspense } from 'react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { ExploreFilterBar } from '@/components/explore-filter-bar';
import { FeedItemCard } from '@/components/feed-item-card';
import { getExploreItems } from '@/features/feed/queries';
import { parseSummary } from '@/features/feed/types';

export const metadata = { title: 'Explore - PatchNotes' };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; topic?: string; sort?: string }>;
}) {
  const { type, topic, sort } = await searchParams;

  const items = await getExploreItems({ type, topic, sort });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              PatchNotes
            </Link>
            <p className="text-xs text-muted-foreground">Explore government changes</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <ExploreFilterBar activeType={type} activeTopic={topic} activeSort={sort} />
      </Suspense>

      {/* Results */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        {items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No items match the selected filters.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-col gap-4">
              {items.map((item) => {
                const parsed = parseSummary(item.summary);
                return <FeedItemCard key={item.id} item={item} parsedSummary={parsed} />;
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
