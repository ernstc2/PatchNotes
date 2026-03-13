import { Suspense } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { HeaderAuth } from '@/components/header-auth';
import { SearchInput } from '@/components/search-input';
import { FilterBar } from '@/components/filter-bar';
import { FeedItemCard } from '@/components/feed-item-card';
import { getFeedItems } from '@/features/feed/queries';
import { IngestStatus } from '@/components/ingest-status';
import { parseSummary } from '@/features/feed/types';
import { auth } from '@/lib/auth';
import { getUserTopics, getBookmarkedIds } from '@/features/auth/queries';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; topic?: string; sort?: string }>;
}) {
  const { q, type, topic, sort } = await searchParams;

  // Optional session check — page works without auth
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  let effectiveTopics: string[] = [];
  let bookmarkedIds = new Set<string>();
  let isWatchlistFiltered = false;

  if (session) {
    const [userTopics, userBookmarkIds] = await Promise.all([
      getUserTopics(session.user.id),
      getBookmarkedIds(session.user.id),
    ]);

    bookmarkedIds = new Set(userBookmarkIds);

    // Apply watchlist filter only if user has topics and no explicit topic filter is set
    if (userTopics.length > 0 && !topic) {
      effectiveTopics = userTopics;
      isWatchlistFiltered = true;
    }
  }

  const items = await getFeedItems({
    q,
    type,
    topic, // explicit URL filter (single topic from FilterBar click)
    topics: effectiveTopics.length > 0 ? effectiveTopics : undefined,
    sort,
  });

  // Watchlist notice label for multi-topic case
  const watchlistTopicLabel = isWatchlistFiltered ? 'your watchlist topics' : null;

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
          <div className="flex items-center gap-3">
            <HeaderAuth />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Search input */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <Suspense fallback={<div className="h-10 w-full rounded-md border border-input bg-background animate-pulse" />}>
          <SearchInput />
        </Suspense>
      </div>

      {/* Filter bar */}
      <FilterBar activeType={type} activeTopic={topic} activeSort={sort} />

      {/* Ingest status */}
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <IngestStatus />
      </div>

      {/* Watchlist filter notice */}
      {isWatchlistFiltered && watchlistTopicLabel && (
        <div className="max-w-2xl mx-auto px-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing: <span className="font-medium text-foreground">{watchlistTopicLabel}</span>
            {' '}
            <Link href="/?topic=all" className="underline hover:text-foreground">
              Show all
            </Link>
          </p>
        </div>
      )}

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 pb-12 pt-4">
        {items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No items match the selected filters.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => {
              const parsedSummaryData = parseSummary(item.summary);
              return (
                <FeedItemCard
                  key={item.id}
                  item={item}
                  parsedSummary={parsedSummaryData}
                  showBookmark={!!session}
                  isBookmarked={bookmarkedIds.has(item.id)}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
