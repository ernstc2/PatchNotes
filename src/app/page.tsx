import Link from 'next/link';
import { Search } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { FilterBar } from '@/components/filter-bar';
import { FeedItemCard } from '@/components/feed-item-card';
import { getExploreItems } from '@/features/feed/queries';
import { parseSummary } from '@/features/feed/types';

export default async function HomePage({
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
            <h1 className="text-xl font-bold tracking-tight">PatchNotes</h1>
            <p className="text-xs text-muted-foreground">
              A changelog for your government
            </p>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Search"
            >
              <Search className="size-5" />
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Filter bar */}
      <FilterBar activeType={type} activeTopic={topic} activeSort={sort} />

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        {items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No items match the selected filters.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const parsedSummary = parseSummary(item.summary);
              return (
                <FeedItemCard
                  key={item.id}
                  item={item}
                  parsedSummary={parsedSummary}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
