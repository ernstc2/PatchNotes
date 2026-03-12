"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { toggleBookmark } from "@/features/auth/queries";

type BookmarkButtonProps = {
  policyItemId: string;
  initialBookmarked: boolean;
};

export function BookmarkButton({ policyItemId, initialBookmarked }: BookmarkButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticBookmarked, setOptimisticBookmarked] = useOptimistic(initialBookmarked);

  function handleClick() {
    startTransition(async () => {
      setOptimisticBookmarked(!optimisticBookmarked);
      try {
        await toggleBookmark(policyItemId);
        router.refresh();
      } catch {
        // Revert handled automatically by useOptimistic on error
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={optimisticBookmarked ? "Remove bookmark" : "Add bookmark"}
      className={`rounded-md p-1 transition-colors hover:bg-accent ${isPending ? "opacity-50" : ""}`}
    >
      {optimisticBookmarked ? (
        <BookmarkCheck className="size-4 text-primary" />
      ) : (
        <Bookmark className="size-4 text-muted-foreground" />
      )}
    </button>
  );
}
