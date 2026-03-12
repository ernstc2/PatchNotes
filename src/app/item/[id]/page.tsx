import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

import { getItemById } from '@/features/feed/queries';
import { parseSummary } from '@/features/feed/types';
import { TypeBadge } from '@/components/type-badge';
import { SeverityBadge } from '@/components/severity-badge';
import { ThemeToggle } from '@/components/theme-toggle';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    return { title: 'Not Found - PatchNotes' };
  }

  const parsedSummary = parseSummary(item.summary);
  return {
    title: `${item.title} - PatchNotes`,
    description: parsedSummary?.headline ?? item.title,
  };
}

export default async function ItemPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getItemById(id);

  if (!item) {
    notFound();
  }

  const parsedSummary = parseSummary(item.summary);

  const formattedDate = item.date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <span className="text-xl font-bold tracking-tight">PatchNotes</span>
          </div>
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

        {/* Header section */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <TypeBadge type={item.type} />
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
          {parsedSummary && (
            <SeverityBadge severity={parsedSummary.severity} />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold leading-tight mb-6">
          {item.title}
        </h1>

        {parsedSummary ? (
          <>
            {/* Headline */}
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {parsedSummary.headline}
            </p>

            {/* Structured sections */}
            <div className="flex flex-col gap-4">
              <section className="rounded-lg border border-border p-5">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  What Changed
                </h2>
                <p className="text-sm leading-relaxed">{parsedSummary.whatChanged}</p>
              </section>

              <section className="rounded-lg border border-border p-5">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Who It Affects
                </h2>
                <p className="text-sm leading-relaxed">{parsedSummary.whoAffected}</p>
              </section>

              <section className="rounded-lg border border-border p-5">
                <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Why It Matters
                </h2>
                <p className="text-sm leading-relaxed">{parsedSummary.whyItMatters}</p>
              </section>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Summary is not yet available for this item.
          </p>
        )}

        {/* Official source link */}
        <div className="mt-8">
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View Official Source
            <ExternalLink className="size-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
