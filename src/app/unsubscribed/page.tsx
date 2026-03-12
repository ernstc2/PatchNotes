import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Unsubscribed - PatchNotes',
};

export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-3">
          You&apos;ve been unsubscribed
        </h1>
        <p className="text-muted-foreground mb-6">
          You will no longer receive PatchNotes digest emails.
        </p>
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-4 hover:text-foreground text-muted-foreground dark:hover:text-foreground"
        >
          Return to PatchNotes
        </Link>
      </div>
    </div>
  );
}
