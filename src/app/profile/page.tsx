import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import {
  getBookmarkedItems,
  getUserTopics,
  updateTopics,
} from '@/features/auth/queries';
import { parseSummary } from '@/features/feed/types';
import { TOPIC_OPTIONS } from '@/features/feed/options';
import { FeedItemCard } from '@/components/feed-item-card';
import { ThemeToggle } from '@/components/theme-toggle';
import { TopicManager } from '@/components/topic-manager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/sign-in');
  }

  const [bookmarkedItems, savedTopics] = await Promise.all([
    getBookmarkedItems(session.user.id),
    getUserTopics(session.user.id),
  ]);

  // Available topics for watchlist (excluding the 'all' sentinel)
  const topicOptions = TOPIC_OPTIONS.filter((o) => o.value !== 'all');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold tracking-tight">PatchNotes</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to feed
        </Link>

        {/* Page title */}
        <h1 className="text-2xl font-bold mb-1">Your Profile</h1>
        <p className="text-sm text-muted-foreground mb-8">{session.user.email}</p>

        {/* Section 1: Topic Watchlist */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Your Topics</h2>
          <TopicManager
            savedTopics={savedTopics}
            topicOptions={topicOptions}
            updateTopics={updateTopics}
          />
        </section>

        {/* Section 2: Bookmarked Items */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Bookmarked Items</h2>
          {bookmarkedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No bookmarked items yet. Browse the feed to save items you want to revisit.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {bookmarkedItems.map(({ item }) => {
                const parsedSummaryData = parseSummary(item.summary);
                return (
                  <FeedItemCard
                    key={item.id}
                    item={item}
                    parsedSummary={parsedSummaryData}
                    showBookmark={true}
                    isBookmarked={true}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
