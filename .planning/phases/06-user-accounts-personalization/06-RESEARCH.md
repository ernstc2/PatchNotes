# Phase 6: User Accounts + Personalization - Research

**Researched:** 2026-03-12
**Domain:** Authentication (better-auth), Drizzle ORM schema extensions, Next.js 16 App Router session management
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| USER-01 | User can create an account with email and password | better-auth `emailAndPassword` plugin + `authClient.signUp.email()` |
| USER-02 | User session persists across browser refresh | better-auth session cookies (HttpOnly, persisted by default) |
| USER-03 | User can log in and log out | `authClient.signIn.email()` / `authClient.signOut()` client methods |
| PERS-01 | User can select topics to follow during onboarding | Post-registration redirect to `/onboarding/topics`; save to `user_topics` table |
| PERS-02 | User can manage their topic watchlist from their profile | `/profile` page with topic toggle UI + server action to update `user_topics` |
| PERS-03 | User can bookmark items to save for later | Insert to `bookmarks` table (userId + policyItemId); toggle server action |
| PERS-04 | User can view all bookmarked items on their profile | `/profile` page section — join `bookmarks` with `policy_items` via Drizzle |
</phase_requirements>

---

## Summary

PatchNotes needs auth that works with its current stack: Next.js 16.1.6, React 19, Drizzle ORM, Neon Postgres, Vercel Hobby tier, and a strict $0 budget. Three candidates were evaluated: Auth.js v5 (next-auth), better-auth, and Clerk.

**Auth.js v5** has a known peer-dependency conflict with Next.js 16 (resolved in beta.30+, but still requires `--legacy-peer-deps` or npm overrides). The credentials provider also has a fundamental constraint: it only works reliably with JWT sessions, not database sessions, limiting session control. The Drizzle adapter exists but the credentials+database-session combination triggers active GitHub issues as of early 2026.

**better-auth** is the recommended choice. It resolved Next.js 16 compatibility in January 2026 (issue #5263 closed as COMPLETED). It ships with built-in `emailAndPassword`, Drizzle adapter, session management, and a CLI that generates the exact Drizzle schema needed. It supports both JWT and database sessions with credentials. The Next.js 16 integration uses `proxy.ts` (the renamed middleware). It is fully open-source and self-hosted — no external service, no per-user pricing, $0 cost.

**Clerk** was ruled out: it is a hosted service (data leaves your Postgres), and while the free tier is generous, the constraint is that all data should live in the project's own Neon database alongside `policy_items`.

The personalization layer (topics watchlist, bookmarks) is implemented as plain Drizzle tables (`user_topics`, `bookmarks`) referencing better-auth's `user` table. No third-party library is needed — these are simple junction tables with server actions for mutations.

**Primary recommendation:** Use better-auth with the Drizzle adapter (provider: "pg") and `emailAndPassword` enabled. Use the better-auth CLI to generate schema. Implement personalization as plain Drizzle queries in `src/features/auth/` following the existing feature pattern.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | latest (1.x) | Auth: email/password, session management, user table | Next.js 16 compatible (Jan 2026), Drizzle adapter built-in, self-hosted, $0 |
| drizzle-orm | already installed (0.45.x) | Schema for new auth + personalization tables | Already in project, no new ORM needed |
| bcrypt | built into better-auth | Password hashing | better-auth handles this internally |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @neondatabase/serverless | already installed | Auth database client | Re-use existing `db` from `@/lib/db` |
| zod | already installed (4.x) | Registration/login form validation | Validate email format, password min-length before calling authClient |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-auth | Auth.js v5 (next-auth@beta) | Auth.js credentials provider has database-session incompatibility; peer-dep conflict with Next.js 16 requires workaround |
| better-auth | Clerk | Clerk stores users externally (not in project Neon DB); violates $0 self-hosted goal |
| better-auth | Lucia (deprecated) | Lucia was deprecated March 2025 — not viable |
| plain Drizzle tables for personalization | separate service | Overkill; bookmarks/topics are simple join tables |

### Installation

```bash
npm install better-auth
```

The better-auth CLI is invoked via npx, no separate install needed:
```bash
npx @better-auth/cli generate   # generates Drizzle schema for auth tables
npx drizzle-kit generate        # creates migration file
npx drizzle-kit migrate         # applies to Neon
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── auth.ts               # better-auth server instance (betterAuth config)
│   ├── auth-client.ts        # better-auth React client (createAuthClient)
│   └── db/
│       └── schema/
│           ├── items.ts       # existing — unchanged
│           ├── system.ts      # existing — unchanged
│           ├── auth.ts        # NEW — generated by better-auth CLI (users, sessions, etc.)
│           └── user-data.ts   # NEW — hand-written (bookmarks, user_topics)
├── features/
│   └── auth/
│       ├── queries.ts         # getBookmarks, getUserTopics, toggleBookmark, etc.
│       └── types.ts           # TypeScript types for user data
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx   # login form
│   │   └── sign-up/page.tsx   # registration form
│   ├── onboarding/
│   │   └── topics/page.tsx    # post-registration topic picker
│   ├── profile/
│   │   └── page.tsx           # bookmarks + watchlist management
│   └── api/
│       └── auth/
│           └── [...all]/route.ts  # better-auth catch-all handler
└── proxy.ts                   # Next.js 16 proxy (renamed from middleware.ts)
```

### Pattern 1: better-auth Server Instance

**What:** Central auth configuration in `src/lib/auth.ts`
**When to use:** Imported by API route, server components, and proxy.ts

```typescript
// Source: https://better-auth.com/docs/installation
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema }, // flat map of all tables
  }),
  emailAndPassword: {
    enabled: true,
  },
  // nextCookies plugin required for cookies in server actions
});
```

### Pattern 2: API Route Handler (Next.js App Router)

**What:** Catch-all route that handles all auth HTTP requests
**When to use:** Required once; better-auth handles all auth endpoints

```typescript
// Source: https://better-auth.com/docs/integrations/next
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### Pattern 3: React Client Instance

**What:** Client-side auth methods + useSession hook
**When to use:** All client components that need auth state or auth actions

```typescript
// Source: https://better-auth.com/docs/basic-usage
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### Pattern 4: Proxy (Route Protection)

**What:** Next.js 16 `proxy.ts` — lightweight check for session cookie presence
**When to use:** Protect `/profile` and `/onboarding` routes

```typescript
// Source: https://better-auth.com/docs/integrations/next
// proxy.ts (root of project)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/onboarding/:path*"],
};
```

**Warning:** The proxy is not the sole security layer. Always verify session inside protected Server Components before rendering sensitive data.

### Pattern 5: Server Component Session Check

**What:** Read session on the server; redirect if missing
**When to use:** Profile page, any protected server component

```typescript
// Source: https://better-auth.com/docs/integrations/next
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/sign-in");

  // session.user.id available here
  return <div>Welcome {session.user.email}</div>;
}
```

### Pattern 6: Client-Side Auth Actions

**What:** Sign up, sign in, sign out from client components
**When to use:** Login/register form submit handlers

```typescript
// Source: https://better-auth.com/docs/basic-usage

// Sign up
const { data, error } = await authClient.signUp.email({
  email,
  password,
  name,
  callbackURL: "/onboarding/topics",
});

// Sign in
const { data, error } = await authClient.signIn.email({
  email,
  password,
  callbackURL: "/",
});

// Sign out
await authClient.signOut({
  fetchOptions: { onSuccess: () => router.push("/") },
});
```

### Pattern 7: useSession Hook

**What:** Reactive session state in client components
**When to use:** Header nav (show/hide profile link, sign-in button)

```typescript
// Source: https://better-auth.com/docs/basic-usage
const { data: session, isPending } = authClient.useSession();

if (isPending) return <Skeleton />;
if (!session) return <SignInButton />;
return <UserMenu email={session.user.email} />;
```

### Pattern 8: Personalization Schema (Drizzle)

**What:** `user_topics` and `bookmarks` tables extending auth's user table
**When to use:** These are hand-written (not generated by better-auth CLI)

```typescript
// src/lib/db/schema/user-data.ts
import { pgTable, uuid, text, timestamp, primaryKey, unique } from 'drizzle-orm/pg-core';
import { users } from './auth'; // re-exported from better-auth generated schema

export const userTopics = pgTable(
  'user_topics',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    topic: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.topic] }),
  })
);

export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    policyItemId: uuid('policy_item_id').notNull().references(() => policyItems.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unique: unique().on(table.userId, table.policyItemId),
  })
);
```

Note: The generated better-auth schema names the users table `user` by default. Check the generated schema file and use whatever name the CLI produces.

### Pattern 9: Onboarding Flow

**What:** Single-page topic picker rendered after registration
**When to use:** `callbackURL: "/onboarding/topics"` in signUp call; save topics server-side then redirect to `/`

The flow is: Register → auto sign-in → redirect to `/onboarding/topics` → user picks topics → Server Action saves `user_topics` rows → `redirect('/')`.

No multi-step form library needed. This is a single page with checkbox-style topic buttons (reuse existing `TOPIC_OPTIONS` from `src/features/feed/options.ts`) and a "Continue" button.

### Anti-Patterns to Avoid

- **Calling authClient methods from Server Components:** `authClient` (from `better-auth/react`) is client-only. Use `auth.api.getSession()` on the server.
- **Relying solely on proxy.ts for authorization:** The proxy is a lightweight redirect layer. Always verify session in the Server Component before rendering protected data.
- **Using bcrypt directly:** better-auth handles password hashing internally. Never hash passwords separately and pass them to the signUp call.
- **JWT-only session strategy with manual user table:** better-auth defaults to database sessions (session stored in Postgres), which is correct for this use case — supports "sign out everywhere" and works with credentials provider without the Auth.js v5 workarounds.
- **Fetching bookmarks in a client component via useEffect:** Use Server Components with Drizzle queries directly; no API route needed for read operations.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt setup | better-auth handles it internally | Password hashing requires correct salt rounds, timing-safe comparison; better-auth does this correctly |
| Session cookie management | Custom cookie logic | better-auth sessions | HttpOnly, Secure, SameSite flags; rotation on sign-in; all handled |
| CSRF protection | Custom token header | better-auth built-in | better-auth includes CSRF protection out of the box |
| Auth API routes | Custom `/api/login` endpoint | `toNextJsHandler(auth)` catch-all | All auth endpoints handled: sign-up, sign-in, sign-out, session refresh |
| Auth database schema | Custom users/sessions tables | `npx @better-auth/cli generate` | CLI generates exact schema with correct columns; avoids missing fields |

**Key insight:** Auth has surface area that's easy to get wrong (timing attacks, session fixation, cookie flags). better-auth encapsulates all of this. The only custom code is the personalization tables and queries.

---

## Common Pitfalls

### Pitfall 1: better-auth CLI Schema vs Drizzle Schema Mismatch

**What goes wrong:** The generated schema file uses specific column names and types. If you hand-edit it or the Drizzle adapter receives a schema object that doesn't match, inserts/selects will fail silently or throw at runtime.

**Why it happens:** The `drizzleAdapter` requires a flat schema object (`{ user: usersTable, session: sessionsTable, ... }`) matching model names better-auth uses internally.

**How to avoid:** Run `npx @better-auth/cli generate` to produce the schema. Import it in `src/lib/db/schema/auth.ts`. Pass the full schema to `drizzleAdapter(db, { provider: "pg", schema: { ...allSchemas } })`.

**Warning signs:** `TypeError: Cannot read properties of undefined` at auth endpoints; session inserts failing.

### Pitfall 2: next-auth Peer Dependency Conflict (Do Not Use)

**What goes wrong:** Installing `next-auth@beta` with Next.js 16 fails on peer dependency validation unless `--legacy-peer-deps` is passed.

**Why it happens:** next-auth declares `peer next@"^12.2.5 || ^13 || ^14 || ^15"`, explicitly excluding 16.

**How to avoid:** Use better-auth instead. If you must use next-auth, add npm overrides or use `--legacy-peer-deps`, and set `session: { strategy: "jwt" }` explicitly (credentials provider does not work with database sessions in Auth.js without manual workarounds).

### Pitfall 3: middleware.ts vs proxy.ts in Next.js 16

**What goes wrong:** Creating `middleware.ts` in Next.js 16 still works (backward compat), but the canonical file is now `proxy.ts` exporting `proxy` instead of `middleware`.

**Why it happens:** Next.js 16 renamed the file as part of clarifying its purpose.

**How to avoid:** Create `proxy.ts` at the project root, export `async function proxy(request: NextRequest)`, and export `config` with the matcher array.

### Pitfall 4: Calling authClient on the Server

**What goes wrong:** Importing `authClient` (from `better-auth/react`) in a Server Component causes a runtime error — "Cannot read properties of null (reading 'useRef')".

**Why it happens:** The React client uses hooks internally; hooks are not available in Server Components.

**How to avoid:** In Server Components: use `auth.api.getSession({ headers: await headers() })`. In Client Components: use `authClient.useSession()` or `authClient.signIn.email()`.

### Pitfall 5: Schema Export Conflict (auth.ts vs db/schema/auth.ts)

**What goes wrong:** The file `src/lib/auth.ts` (better-auth server config) and `src/lib/db/schema/auth.ts` (Drizzle schema) can cause import confusion, especially if a barrel export re-exports everything.

**Why it happens:** Both files are called `auth` at similar paths.

**How to avoid:** Name the schema file `src/lib/db/schema/auth-schema.ts` or `src/lib/db/schema/better-auth.ts` to disambiguate. Update the schema `index.ts` barrel accordingly.

### Pitfall 6: Onboarding Skip — User Has No Topics

**What goes wrong:** If a user signs up but doesn't complete onboarding (e.g., navigates away), they land on the feed with no topic filter but the profile page assumes topics exist.

**Why it happens:** The onboarding redirect is only enforced client-side via `callbackURL`.

**How to avoid:** In the profile page and watchlist feed filter, always handle the empty-topics case gracefully. The feed without topic filter shows all items — this is the correct fallback. Do not block the app for users with zero topics.

### Pitfall 7: Bookmark Toggle Race Condition

**What goes wrong:** If a user double-clicks "bookmark", two concurrent inserts may violate the unique constraint.

**Why it happens:** No debounce or optimistic lock on the toggle server action.

**How to avoid:** Use `INSERT ... ON CONFLICT DO NOTHING` (Drizzle's `.onConflictDoNothing()`) for bookmark creates. For delete, use a WHERE clause matching both userId and policyItemId.

---

## Code Examples

### Register Form (Client Component)

```typescript
// Source: https://better-auth.com/docs/basic-usage
"use client"
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signUp.email({
      email: form.get("email") as string,
      password: form.get("password") as string,
      name: form.get("name") as string,
      callbackURL: "/onboarding/topics",
    });
    if (error) setError(error.message);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" minLength={8} required />
      <input name="name" type="text" required />
      {error && <p>{error}</p>}
      <button type="submit">Create account</button>
    </form>
  );
}
```

### Bookmark Toggle (Server Action)

```typescript
// src/features/auth/queries.ts
"use server"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema/user-data";
import { and, eq } from "drizzle-orm";

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
```

### Get Bookmarked Items (Server Component Query)

```typescript
// src/features/auth/queries.ts
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema/user-data";
import { policyItems } from "@/lib/db/schema/items";
import { eq } from "drizzle-orm";

export async function getBookmarkedItems(userId: string) {
  return db
    .select({ item: policyItems })
    .from(bookmarks)
    .innerJoin(policyItems, eq(bookmarks.policyItemId, policyItems.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}
```

### Save Onboarding Topics (Server Action)

```typescript
// src/features/auth/queries.ts
"use server"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userTopics } from "@/lib/db/schema/user-data";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function saveTopics(topics: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  // Delete existing topics and replace
  await db.delete(userTopics).where(eq(userTopics.userId, session.user.id));

  if (topics.length > 0) {
    await db.insert(userTopics).values(
      topics.map((topic) => ({ userId: session.user.id, topic }))
    );
  }

  redirect("/");
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts | proxy.ts | Next.js 16 (2025) | Rename only; same matcher/config export pattern |
| Lucia auth | Deprecated | March 2025 | Do not use |
| Auth.js v5 beta credentials | better-auth | 2025 | better-auth avoids credentials/database-session incompatibility |
| useFormState | useActionState | React 19 / Next.js 15+ | Use `useActionState` hook for server action state; `useFormState` removed |

**Deprecated/outdated:**
- Lucia: Deprecated March 2025 — do not use for new projects
- `middleware.ts` with `export function middleware`: Works in Next.js 16 for backward compat but canonical is now `proxy.ts` with `export function proxy`
- `useFormState` from `react-dom`: Replaced by `useActionState` from `react` in React 19

---

## Open Questions

1. **Does better-auth's CLI generate a `user` table that exports a named `users` export for referencing in user-data.ts?**
   - What we know: The CLI generates a Drizzle schema file; the model name in better-auth is `user`
   - What's unclear: Whether the exported Drizzle table variable is named `user` or `users`
   - Recommendation: Run `npx @better-auth/cli generate` in Wave 0, inspect the output, then write `user-data.ts` to import the correct export name

2. **Session persistence on Vercel Hobby (Neon free tier connection limits)**
   - What we know: better-auth uses database sessions by default, meaning every auth check requires a DB query
   - What's unclear: Whether the Neon free tier's 5-connection limit causes issues under the session query load added by auth on every protected page
   - Recommendation: The existing `@neondatabase/serverless` neon-http client is stateless (HTTP-based, not connection pool) — this avoids the connection limit. No change needed.

3. **Should the homepage feed filter by user's watchlist topics when logged in?**
   - What we know: PERS-01 says "filtered feed" for watchlist; the feed currently supports a `topic` URL param
   - What's unclear: Whether a logged-in user's homepage should auto-filter by watchlist, or if that's a separate view
   - Recommendation: Read the success criterion: "land on a watchlist-filtered feed in one sitting" — this implies the homepage should default to the user's topics when logged in. This is doable by reading the user's topics in the server component and passing them to `getFeedItems`. Since a user may follow multiple topics, `getFeedItems` will need an `or` condition across topics (minor query change).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=verbose src/features/auth` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| USER-01 | `saveUser` insert creates a user row in DB | unit | `npm test -- src/features/auth/queries.test.ts` | ❌ Wave 0 |
| USER-02 | Session cookie persists (HttpOnly, not expired) | manual | manual browser check after login | N/A |
| USER-03 | Sign-in returns session; sign-out clears session | unit | `npm test -- src/features/auth/queries.test.ts` | ❌ Wave 0 |
| PERS-01 | `saveTopics` inserts correct rows for userId+topics | unit | `npm test -- src/features/auth/queries.test.ts` | ❌ Wave 0 |
| PERS-02 | `saveTopics` deletes old rows then inserts new | unit | `npm test -- src/features/auth/queries.test.ts` | ❌ Wave 0 |
| PERS-03 | `toggleBookmark` inserts on first call, deletes on second | unit | `npm test -- src/features/auth/queries.test.ts` | ❌ Wave 0 |
| PERS-04 | `getBookmarkedItems` returns joined policy_items for userId | unit | `npm test -- src/features/auth/queries.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- src/features/auth/queries.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/features/auth/queries.test.ts` — covers PERS-01 through PERS-04, USER-01, USER-03
- [ ] `src/lib/db/schema/user-data.ts` — new schema file (created in Wave 0 after CLI run)
- [ ] `src/lib/db/schema/auth-schema.ts` (or similar) — better-auth CLI output file
- [ ] Migration applied to Neon: `npx drizzle-kit migrate`

*(USER-02 is manual-only: session persistence requires a real browser and cannot be tested in Vitest node environment)*

---

## Sources

### Primary (HIGH confidence)

- [better-auth official docs — Installation](https://better-auth.com/docs/installation) — installation steps, env vars, CLI commands
- [better-auth official docs — Next.js integration](https://better-auth.com/docs/integrations/next) — proxy.ts pattern, toNextJsHandler, server component session check
- [better-auth official docs — Basic Usage](https://better-auth.com/docs/basic-usage) — signUp/signIn/signOut/useSession API
- [better-auth official docs — Drizzle adapter](https://better-auth.com/docs/adapters/drizzle) — drizzleAdapter config, schema generation
- [GitHub issue #5263 — Support Next.js 16](https://github.com/better-auth/better-auth/issues/5263) — confirmed COMPLETED January 2026
- Existing codebase: `src/lib/db/index.ts`, `src/lib/db/schema/items.ts`, `src/features/feed/options.ts` — confirmed Drizzle proxy singleton pattern, topic constants

### Secondary (MEDIUM confidence)

- [Auth.js credentials+database-session GitHub discussion](https://github.com/nextauthjs/next-auth/discussions/4394) — confirms credentials provider only reliable with JWT strategy
- [next-auth Next.js 16 peer dep issue #13302](https://github.com/nextauthjs/next-auth/issues/13302) — confirmed peer-dep conflict; resolved in beta.30 but adds friction
- [Next.js 16 proxy.ts rename explained](https://medium.com/@amitupadhyay878/next-js-16-update-middleware-js-5a020bdf9ca7) — middleware renamed to proxy

### Tertiary (LOW confidence)

- Various Medium/DEV.to articles on better-auth setup — consistent with official docs, not independently verified against source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — better-auth official docs verified; Next.js 16 compat confirmed via resolved GitHub issue
- Architecture: HIGH — patterns pulled directly from official docs with working code examples
- Pitfalls: HIGH — Auth.js peer-dep and credentials/session issues confirmed via GitHub issues; proxy.ts rename confirmed in Next.js 16 docs

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (better-auth is actively maintained; check for breaking changes after 30 days)
