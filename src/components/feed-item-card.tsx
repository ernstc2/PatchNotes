import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { SeverityBadge } from '@/components/severity-badge';
import { TypeBadge } from '@/components/type-badge';
import type { PolicyItem } from '@/lib/db/schema/items';
import type { SummaryOutput } from '@/features/feed/types';

type FeedItemCardProps = {
  item: PolicyItem;
  parsedSummary: SummaryOutput | null;
};

export function FeedItemCard({ item, parsedSummary }: FeedItemCardProps) {
  const formattedDate = item.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={item.type} />
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
          {parsedSummary && (
            <SeverityBadge severity={parsedSummary.severity} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Link
          href={`/item/${item.id}`}
          prefetch={false}
          className="block text-foreground hover:underline font-medium leading-snug"
        >
          {item.title}
        </Link>
        {parsedSummary?.headline && (
          <p className="mt-1 text-sm text-muted-foreground">
            {parsedSummary.headline}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View Source
          <ExternalLink className="size-3" />
        </a>
      </CardFooter>
    </Card>
  );
}
