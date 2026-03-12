"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { bookmarks, userTopics } from "@/lib/db/schema/user-data";
import { policyItems } from "@/lib/db/schema/items";
import { and, desc, eq } from "drizzle-orm";

// ---- Topics ----

export async function saveTopics(topics: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  await db
    .delete(userTopics)
    .where(eq(userTopics.userId, session.user.id));

  if (topics.length > 0) {
    await db.insert(userTopics).values(
      topics.map((topic) => ({ userId: session.user.id, topic }))
    );
  }

  redirect("/");
}

export async function updateTopics(topics: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  await db
    .delete(userTopics)
    .where(eq(userTopics.userId, session.user.id));

  if (topics.length > 0) {
    await db.insert(userTopics).values(
      topics.map((topic) => ({ userId: session.user.id, topic }))
    );
  }

  revalidatePath("/profile");
}

export async function getUserTopics(userId: string) {
  const rows = await db
    .select({ topic: userTopics.topic })
    .from(userTopics)
    .where(eq(userTopics.userId, userId));

  return rows.map((r) => r.topic);
}

// ---- Bookmarks ----

export async function toggleBookmark(policyItemId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const existing = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, session.user.id),
        eq(bookmarks.policyItemId, policyItemId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, session.user.id),
          eq(bookmarks.policyItemId, policyItemId)
        )
      );
  } else {
    await db
      .insert(bookmarks)
      .values({ userId: session.user.id, policyItemId })
      .onConflictDoNothing();
  }
}

export async function getBookmarkedItems(userId: string) {
  return db
    .select({ item: policyItems })
    .from(bookmarks)
    .innerJoin(policyItems, eq(bookmarks.policyItemId, policyItems.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

export async function getBookmarkedIds(userId: string) {
  const rows = await db
    .select({ policyItemId: bookmarks.policyItemId })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId));

  return rows.map((r) => r.policyItemId);
}

export async function isBookmarked(userId: string, policyItemId: string) {
  const rows = await db
    .select({ policyItemId: bookmarks.policyItemId })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.policyItemId, policyItemId)
      )
    )
    .limit(1);

  return rows.length > 0;
}
