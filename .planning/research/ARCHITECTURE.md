# Architecture Patterns

**Project:** PatchNotes — Full Rebuild
**Domain:** Government policy digest / news aggregation app with AI summarization
**Researched:** 2026-03-11

---

## Recommended Architecture

**Single Next.js App (App Router) deployed to Vercel, with MongoDB Atlas as the database.**

This is not a monorepo. It is not a separate frontend + backend. For a solo developer building a portfolio project, a single Next.js application handles:

- The frontend (React Server Components + Client Components)
- The backend API (Route Handlers in `app/api/`)
- Background data ingestion (Vercel Cron Jobs hitting internal API routes)
- AI summarization pipeline (triggered during ingestion or on first request, cached in DB)

No microservices. No separate Express server. No Turborepo. One repo, one deployment, one place to look when something breaks.

---

## Directory Structure

```
patchnotes/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (app)/
│   │   ├── page.tsx              # Daily digest home
│   │   ├── explore/
│   │   │   ├── page.tsx          # Browse/search all items
│   │   │   └── [id]/page.tsx     # Individual item detail
│   │   ├── watchlist/
│   │   │   └── page.tsx          # User's topic subscriptions
│   │   └── bookmarks/
│   │       └── page.tsx          # Saved items
│   └── api/
│       ├── cron/
│       │   └── ingest/route.ts   # Triggered by Vercel Cron
│       ├── items/
│       │   ├── route.ts          # GET /api/items (list, search, paginate)
│       │   └── [id]/route.ts     # GET /api/items/[id]
│       ├── digest/
│       │   └── route.ts          # GET /api/digest (today's patch notes)
│       ├── user/
│       │   ├── bookmarks/route.ts
│       │   └── watchlist/route.ts
│       └── auth/
│           └── [...nextauth]/route.ts
├── lib/
│   ├── db/
│   │   ├── client.ts             # MongoDB connection singleton
│   │   ├── models/               # Mongoose or raw collection types
│   │   │   ├── item.ts
│   │   │   ├── digest.ts
│   │   │   └── user.ts
│   │   └── queries/              # Reusable query functions
│   │       ├── items.ts
│   │       └── digest.ts
│   ├── ingestion/
│   │   ├── sources/
│   │   │   ├── congress.ts       # Congress API adapter
│   │   │   ├── exec-orders.ts    # Federal Register adapter
│   │   │   └── regulations.ts    # Regulations.gov adapter
│   │   └── pipeline.ts           # Orchestrates sources → DB
│   ├── ai/
│   │   ├── summarize.ts          # Gemini call + prompt templates
│   │   └── prompts.ts            # Structured prompt builders
│   └── auth.ts                   # Auth.js config
├── components/
│   ├── ui/                       # Shadcn/ui primitives
│   ├── digest/                   # Digest-specific components
│   ├── item/                     # Item card, detail view
│   └── layout/                   # Header, nav, sidebar
├── types/
│   └── index.ts                  # Shared TypeScript types
├── vercel.json                   # Cron job definitions
└── next.config.ts
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Next.js App (frontend)** | Renders pages, handles user interactions, auth UI | API routes (internal), Auth.js |
| **Next.js API Routes** | REST-style endpoints for data reads, user actions | MongoDB Atlas, Gemini API |
| **Cron Ingest Route** (`/api/cron/ingest`) | Fetches new items from government APIs, writes to DB, queues summarization | Congress API, Federal Register API, Regulations.gov API, MongoDB Atlas |
| **AI Summarization** | Calls Gemini to generate structured patch-notes summary per item | Gemini API, MongoDB Atlas (write back summaries) |
| **MongoDB Atlas** | Persistent storage for items, digests, users, sessions | All server-side code |
| **Auth.js** | Handles session management, credential auth | MongoDB Atlas (user collection) |

---

## Data Flow: Government APIs → DB → AI → User

```
[Vercel Cron: 0 6 * * *]
       ↓
GET /api/cron/ingest (secret-key protected)
       ↓
lib/ingestion/pipeline.ts
  ├── congress.ts     → fetchNewBills(lastUpdated)
  ├── exec-orders.ts  → fetchNewOrders(lastUpdated)
  └── regulations.ts  → fetchNewRegulations(lastUpdated)
       ↓
Upsert raw items to MongoDB (idempotent — duplicate-safe)
       ↓
For each new item without a summary:
  lib/ai/summarize.ts → Gemini API (gemini-2.0-flash)
       ↓
Write structured summary back to item document in MongoDB
       ↓
Compose today's digest document (list of item IDs + metadata)
       ↓
[User visits /]
  Next.js Server Component reads digest from MongoDB
  Renders patch-notes format server-side (no client fetch needed)
```

**Key decision: AI summarization happens at ingestion time, not at request time.** The user never waits for an AI call. Summaries are pre-generated and stored in the database. This makes the app fast and prevents Gemini rate limits from degrading UX.

---

## API Design: REST via Next.js Route Handlers

Use REST, not tRPC.

**Why not tRPC:** tRPC is excellent but adds conceptual overhead (router setup, client configuration, adapter boilerplate). For a solo developer, the productivity gain is real only when the frontend makes many typed API calls. In PatchNotes, most data fetching happens in Server Components — which can call `lib/db/queries` directly without going through an API at all. The API routes exist mainly for client interactions (bookmarks, watchlist) and the cron job. REST is simpler, better for portfolio readability, and sufficient.

**REST endpoint design:**

```
GET  /api/digest?date=YYYY-MM-DD       # Today's patch notes (or specified date)
GET  /api/items?q=&type=&page=&limit=  # Search/browse with pagination
GET  /api/items/[id]                   # Single item with full summary
POST /api/user/bookmarks               # Toggle bookmark
GET  /api/user/bookmarks               # Get user's bookmarks
PUT  /api/user/watchlist               # Update topic subscriptions
GET  /api/user/watchlist               # Get user's watchlist
POST /api/cron/ingest                  # Internal: triggered by cron (protected)
```

Server Components read from `lib/db/queries` directly. These endpoint routes handle client-side mutations and the cron trigger only.

---

## Database Schema Design

Keep MongoDB. It already works for this data shape. The existing four collections are a good start; normalize them into one `items` collection with a `type` discriminator.

### `items` collection (unified)

```typescript
interface Item {
  _id: ObjectId;
  type: 'executive_order' | 'bill' | 'regulation' | 'proposed_regulation';
  sourceId: string;          // External unique ID (doc number, bill number, docket ID)
  title: string;
  date: Date;                // Canonical date (signing_date / action_date / postedDate)
  url: string;               // Official source URL
  pdfUrl?: string;
  agencyId?: string;         // For regulations

  // Raw source data (preserve for re-summarization)
  rawData: Record<string, unknown>;

  // AI-generated summary (null until summarized)
  summary: {
    headline: string;        // One sentence: what changed
    whatChanged: string[];   // Bullet list of changes
    whoAffected: string[];   // Affected groups
    status: string;          // "Signed", "Passed House", "Final Rule", etc.
    topics: string[];        // For watchlist matching: ["healthcare", "immigration"]
    generatedAt: Date;
    model: string;           // e.g. "gemini-2.0-flash"
  } | null;

  createdAt: Date;
  updatedAt: Date;
}
```

**Why unify into one collection:** The old architecture has four separate collections (`Exec_Orders`, `Congress_Bills`, `Regulations`, `Proposed_Regulations`). This means four separate queries for the digest, four sets of upsert logic, four sets of types. One unified collection with a `type` field simplifies every query and lets you add new source types without schema migrations.

### `digests` collection

```typescript
interface Digest {
  _id: ObjectId;
  date: Date;               // The date this digest represents (UTC midnight)
  itemIds: ObjectId[];      // Ordered list of items in this digest
  generatedAt: Date;
  published: boolean;
}
```

A pre-composed digest document means the homepage query is a single lookup by date rather than a complex aggregation.

### `users` collection

```typescript
interface User {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  bookmarks: ObjectId[];    // Item IDs
  watchlist: string[];      // Topic slugs: ["healthcare", "immigration", "taxes"]
  createdAt: Date;
}
```

### Indexes to create

```javascript
// items
db.items.createIndex({ type: 1, date: -1 })         // Digest queries
db.items.createIndex({ date: -1 })                  // Latest items
db.items.createIndex({ sourceId: 1 }, { unique: true }) // Dedup on ingest
db.items.createIndex({ "summary.topics": 1 })       // Watchlist matching
db.items.createIndex({ title: "text", "summary.headline": "text" }) // Full-text search

// digests
db.digests.createIndex({ date: -1 }, { unique: true })
```

---

## Auth Strategy

**Auth.js (formerly NextAuth) v5 with credentials provider.**

- Email + password for v1 (bcrypt for hashing, already in existing code)
- Auth.js v5 integrates natively with Next.js App Router — session available in Server Components via `auth()` helper
- Session stored in JWT (stateless, no session collection needed)
- The existing session-in-MongoDB approach is replaced by JWT — simpler, no `sessions` collection to manage
- Auth.js handles the `/api/auth/[...nextauth]` route automatically

**Auth flow:**

```
User submits login form
  → POST /api/auth/callback/credentials (Auth.js route)
  → Verify email/password against users collection
  → Issue JWT session cookie (httpOnly, secure, sameSite: strict)
  → Server Components read session via auth() with no additional DB lookup
```

Do not implement OAuth (Google, GitHub) in v1 — adds complexity without portfolio value relative to the effort.

---

## Background Jobs: Data Ingestion

**Vercel Cron Jobs calling an internal protected API route.**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "0 6 * * *"
    }
  ]
}
```

The cron fires daily at 6am UTC, calling `GET /api/cron/ingest`. The route verifies a `CRON_SECRET` header (Vercel sets this automatically). The route runs the ingestion pipeline synchronously.

**Hobby plan limitation:** Vercel Hobby only allows cron jobs to run once per day (confirmed from Vercel docs). This is fine — government data does not need sub-daily updates. A single 6am UTC run captures all items published in the previous 24 hours.

**Ingest route pattern:**

```typescript
// app/api/cron/ingest/route.ts
export async function GET(request: Request) {
  // Vercel sets Authorization: Bearer ${CRON_SECRET} automatically
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await runIngestionPipeline();
  return Response.json({ success: true, ...result });
}
```

**No separate queue system needed.** The government APIs return manageable data volumes (tens to low hundreds of items per day). Processing them synchronously within a single Vercel Function execution (max 60s on Hobby, 300s on Pro) is sufficient. Regulations.gov is the slow one due to per-document follow-up fetches — this may require batching or parallelization within the pipeline.

---

## AI Summarization Pipeline

**Async at ingestion time, cached in DB, never called at request time.**

```
Ingest pipeline:
  1. Fetch new items from all sources
  2. Upsert items to DB (summary = null for new items)
  3. Query DB for items where summary IS null
  4. For each: call Gemini → write structured summary back to item
  5. Compose/update today's digest document
```

**Prompt strategy for structured output:**

The existing `geminiAPI.js` passes raw text prompts and extracts `.candidates[0].content.parts[0].text`. For the rebuild, use Gemini's structured output (JSON response format) to get reliable patch-notes format:

```typescript
// Prompt template
const SUMMARY_PROMPT = (item: Item) => `
You are summarizing a U.S. government policy document for everyday citizens.
No political opinion. Facts only.

Document type: ${item.type}
Title: ${item.title}
Date: ${item.date}

Respond in JSON with this exact structure:
{
  "headline": "One sentence: what changed",
  "whatChanged": ["bullet 1", "bullet 2", "bullet 3"],
  "whoAffected": ["affected group 1", "affected group 2"],
  "status": "Signed | Passed House | Final Rule | Proposed Rule",
  "topics": ["topic slug 1", "topic slug 2"]
}

Valid topic slugs: healthcare, taxes, immigration, environment, education,
defense, economy, technology, housing, social-programs, trade, judiciary
`;
```

**Caching:** Summaries are stored permanently in the item document. They are never regenerated unless explicitly triggered (could add an admin endpoint later). This means Gemini is called at most once per item, ever.

**Gemini rate limit management:** On the free tier, Gemini Flash has generous rate limits (15 RPM / 1,500 RPD as of training data — verify before building). The ingestion pipeline should add a small delay between summary calls if processing many items in one batch: use `await new Promise(r => setTimeout(r, 200))` between calls, or process in parallel batches of 5.

---

## Deployment Architecture

```
[Vercel]
  ├── Next.js App (SSR + static)
  ├── API Route Handlers (serverless functions)
  └── Cron Job → /api/cron/ingest (daily)

[MongoDB Atlas]
  └── Free tier M0 cluster (sufficient for portfolio scale)
      └── PatchNotes database

[Gemini API]
  └── Called only during ingestion (never user-facing)

[Government APIs]
  ├── api.congress.gov (Congress API key)
  ├── federalregister.gov (no key required)
  └── api.regulations.gov (DEMO_KEY or registered key)
```

**Environment variables needed:**
```
DATABASE_URL=           # MongoDB Atlas connection string
AUTH_SECRET=            # Auth.js secret (generated)
GEMINI_API_KEY=         # Google Gemini API key
CONGRESS_API_KEY=       # Congress.gov API key
REGULATION_API_KEY=     # Regulations.gov API key (DEMO_KEY works for dev)
CRON_SECRET=            # Vercel sets this automatically, reference in route
```

**Vercel project settings:**
- Framework: Next.js
- Build command: `next build`
- Environment variables: set all above in Vercel dashboard
- No custom server — Vercel handles Next.js natively

---

## Patterns to Follow

### Pattern 1: Server Components for Data Reads

For all read-only page data, use Server Components that call `lib/db/queries` directly. No client-side fetching with `useEffect`, no separate API call for initial page load.

```typescript
// app/(app)/page.tsx — Server Component
import { getTodaysDigest } from '@/lib/db/queries/digest';

export default async function HomePage() {
  const digest = await getTodaysDigest();
  return <DigestView items={digest.items} />;
}
```

### Pattern 2: Client Components Only for Interactivity

Bookmark toggles, watchlist management, search input — these need `'use client'`. Keep them as leaf components. The parent layout stays a Server Component.

### Pattern 3: Idempotent Upserts for Ingestion

All ingestion writes use `updateOne` with `upsert: true` on `sourceId`. Running the pipeline twice produces identical results. This makes the cron job safe to re-run manually or retry after failure.

### Pattern 4: DB Connection Singleton

MongoDB clients are expensive to create. Use a module-level singleton cached in Node's global object to survive hot reloads in development:

```typescript
// lib/db/client.ts
import { MongoClient } from 'mongodb';

const uri = process.env.DATABASE_URL!;
let client: MongoClient;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClient) {
    (global as any)._mongoClient = new MongoClient(uri);
  }
  client = (global as any)._mongoClient;
} else {
  client = new MongoClient(uri);
}

export default client;
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling Gemini on User Request

**What goes wrong:** User clicks on an item, the server calls Gemini, the user waits 2-8 seconds for a summary. Gemini rate limits cause failures under load. Every user request burns API quota.

**Instead:** Pre-generate all summaries during ingestion. If a summary is null (item was just ingested and summarization failed), show a "Summary generating..." state and trigger async summarization via a background mechanism — but never block the HTTP response on it.

### Anti-Pattern 2: Separate Express Backend

**What goes wrong:** Two deployments to manage, CORS configuration, two sets of environment variables, two repos or a complex monorepo setup — all for no real benefit on a solo project of this scale.

**Instead:** Next.js Route Handlers provide everything Express provided, with zero additional infrastructure.

### Anti-Pattern 3: Four Separate Collections by Document Type

**What goes wrong:** Every digest query requires four separate DB queries and four separate mapping functions. Adding a new source type (e.g. presidential proclamations) requires duplicating four places.

**Instead:** One `items` collection with `type: 'executive_order' | 'bill' | 'regulation' | 'proposed_regulation'`. Type-specific fields live inside `rawData`. This was the biggest design mistake in the original codebase.

### Anti-Pattern 4: Fetching Full Documents from Regulations.gov on Every Ingest

**What goes wrong:** The existing `regulationAPI.js` makes N+1 HTTP requests — one list request plus one follow-up per document to get file URLs. For 100 regulations, that's 101 HTTP calls. This is slow and hits rate limits.

**Instead:** Cache the file URL fetches. After the first fetch for a document, the `pdfUrl` and `htmUrl` are stored in MongoDB. The N+1 problem goes away — subsequent ingestion runs skip already-stored documents via the `sourceId` upsert.

### Anti-Pattern 5: Running updateDB() on Every HTTP Request

**What goes wrong:** The original `server.js` calls `updateDB()` inside route handlers. If a user hits `/data/latest`, the server checks if the DB needs updating and potentially kicks off all API calls before responding. This blocks the response and creates unpredictable latency.

**Instead:** Ingestion runs only via the cron job. API routes read from DB. The concerns are completely separated.

---

## Scalability Considerations

This is a portfolio project. Optimize for developer clarity and demo reliability, not 10M users. That said:

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| DB reads | Single MongoDB Atlas M0, fine | Still fine with indexes | Needs Atlas dedicated tier |
| AI costs | Free tier sufficient | Monitor usage, may need paid | Paid Gemini plan |
| Ingestion speed | Single function call | Single function call | Same — data volume is bounded by government publication rate |
| Cron frequency | Daily is sufficient | Daily is sufficient | Could do hourly with Vercel Pro |
| Search | MongoDB text index | MongoDB text index | Consider Atlas Search |

---

## Build Order (Suggested Phase Sequence)

The architecture enables incremental delivery. Each phase produces something runnable:

1. **Foundation** — Next.js project setup, MongoDB connection, TypeScript config, Auth.js, basic layout
2. **Data Layer** — Unified `items` collection schema, ingestion pipeline for all three sources, Vercel cron setup, manual trigger endpoint
3. **AI Pipeline** — Gemini integration with structured prompts, summary storage, re-run logic for nulls
4. **Daily Digest** — Home page showing today's items in patch-notes format, digest document generation
5. **Search & Explore** — Browse page with filtering by type/date/topic, full-text search, item detail page
6. **User Features** — Auth (register/login), bookmarks, topic watchlist
7. **Polish** — Dark mode, responsive design, accessibility, loading states, error boundaries

Each phase depends on the one before it. Phases 2 and 3 can be built and tested without any UI. Phase 4 requires Phase 3 (summaries must exist to display). Phases 5-7 are additive.

---

## Integration Points Between Components

| From | To | What Crosses the Boundary |
|------|-----|--------------------------|
| Vercel Cron | `/api/cron/ingest` | HTTP GET with `Authorization: Bearer ${CRON_SECRET}` |
| Ingestion pipeline | Congress API | `fromDateTime` / `toDateTime` ISO strings, returns bill objects |
| Ingestion pipeline | Federal Register API | `dateStart` / `dateEnd` YYYY-MM-DD, returns executive orders |
| Ingestion pipeline | Regulations.gov API | `date range` + `documentType` filter, returns regulations |
| Ingestion pipeline | MongoDB | Upsert items by `sourceId`, read `lastIngestedAt` from metadata |
| AI summarizer | Gemini API | Raw item title + date + type → JSON summary object |
| AI summarizer | MongoDB | Write `summary` field back to item document |
| Server Components | MongoDB | `lib/db/queries` functions return typed documents |
| API Routes | MongoDB | Same query functions |
| Auth.js | MongoDB | Read/write `users` collection for credential verification |
| Client Components | API Routes | `fetch('/api/user/bookmarks', { method: 'POST', ... })` |

---

## Sources

- Next.js App Router Route Handlers: https://nextjs.org/docs/app/api-reference/file-conventions/route (v16.1.6, fetched 2026-03-11) — HIGH confidence
- Next.js Caching documentation: https://nextjs.org/docs/app/guides/caching (v16.1.6, fetched 2026-03-11) — HIGH confidence
- Vercel Cron Jobs documentation: https://vercel.com/docs/cron-jobs (fetched 2026-03-11) — HIGH confidence
- Vercel Cron pricing/limits (Hobby = once per day): https://vercel.com/docs/cron-jobs/usage-and-pricing (fetched 2026-03-11) — HIGH confidence
- Existing PatchNotes server.js analysis — HIGH confidence (direct code inspection)
- Auth.js v5 — MEDIUM confidence (could not fetch docs directly; v5 App Router integration is well-established in the ecosystem as of training data)
- Gemini API rate limits — LOW confidence (could not verify current free tier limits; check https://ai.google.dev/gemini-api/docs/rate-limits before building)
- Regulations.gov API N+1 behavior — HIGH confidence (direct code inspection of existing `regulationAPI.js`)
