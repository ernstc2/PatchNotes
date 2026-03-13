import { getLastIngestTime } from '@/features/feed/queries';

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNextUpdateTime(): string {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(6, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export async function IngestStatus() {
  const lastIngest = await getLastIngestTime();
  if (!lastIngest) return null;

  return (
    <p className="text-xs text-muted-foreground">
      Updated {formatTimeAgo(lastIngest)} &middot; Next update at {getNextUpdateTime()}
    </p>
  );
}
