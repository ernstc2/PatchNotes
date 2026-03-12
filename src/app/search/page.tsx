import { Suspense } from 'react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { SearchInput } from '@/components/search-input';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { FeedItemCard } from '@/components/feed-item-card';
import { getSearchResults } from '@/features/feed/queries';
import { parseSummary } from '@/features/feed/types';

export const metadata = { title: 'Search - PatchNotes' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; topic?: string }>;
}) {
  const { q, type, topic } = await searchParams;

  const hasParams = Boolean(q || type || topic);
  const items = hasParams ? await getSearchResults({ q, type, topic }) : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
              PatchNotes
            </Link>
            <p className="text-xs text-muted-foreground">Search government changes</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Search input */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <Suspense fallback={<div className="h-10 w-full rounded-md border border-input bg-background animate-pulse" />}>
          <SearchInput />
        </Suspense>
      </div>

      {/* Filter bar */}
      <Suspense fallback={null}>
        <SearchFilterBar activeType={type} activeTopic={topic} />
      </Suspense>

      {/* Results */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        {!hasParams ? (
          <p className="py-16 text-center text-muted-foreground">
            Type a keyword to search government changes.
          </p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No results found.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {items.length} result{items.length !== 1 ? 's' : ''}
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
