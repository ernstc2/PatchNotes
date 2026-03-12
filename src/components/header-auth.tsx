"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function HeaderAuth() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    // Skeleton placeholder to prevent layout shift
    return <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />;
  }

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="rounded-md px-3 py-1.5 text-sm font-medium border border-border hover:bg-muted transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const displayName = session.user.name || session.user.email;
  const truncated =
    displayName.length > 20 ? displayName.slice(0, 20) + "…" : displayName;

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px]"
        title={displayName}
      >
        {truncated}
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md px-3 py-1.5 text-sm font-medium border border-border hover:bg-muted transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
