# Technology Stack

**Project:** PatchNotes v1.0 Full Rebuild
**Researched:** 2026-03-11
**Research mode:** Ecosystem
**Confidence:** HIGH for Next.js/Tailwind/testing (verified against official docs v16.1.6, updated 2026-02-27); MEDIUM for AI/DB/Auth (training data — verification notes included per section)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.1.6 (latest stable) | Full-stack React framework | App Router is the explicit recommendation for all new projects in the official docs. Server Components eliminate useEffect data-fetching boilerplate. Route Handlers replace a separate Express backend entirely. ISR (`revalidate`) caches government API + AI results between polls. Verified against official docs 2026-02-27. |
| TypeScript | 5.x (bundled) | Type safety | Built into `create-next-app` defaults. Required for portfolio-grade code — hiring managers read config files. |
| React | 19 (via Next.js App Router) | UI library | Bundled with Next.js 16; App Router uses React canary releases that include all stable React 19 features. Do not manage React separately — Next.js pins the tested version. |

**App Router is mandatory for this rebuild.** Pages Router is legacy. App Router enables Server Components (no client-side data-fetching waterfall), Server Actions (mutations without manual API routes), and ISR (the core caching strategy for expensive government + AI calls). This is the pattern hiring managers expect in 2026.

---

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.2 (current stable) | Utility-first CSS | v4 drops `tailwind.config.js` — all config lives in CSS via `@import "tailwindcss"`. Uses a PostCSS plugin for Next.js. 8.8x faster incremental builds than v3. Native CSS variables (no JavaScript config needed). Verified against official Tailwind docs at tailwindcss.com. |
| shadcn/ui | latest (no version — copy-paste model) | Accessible component registry | Not a package — CLI generates components into your codebase. You own the code; no version lock-in. Built on Radix UI primitives for accessibility. Dark mode via CSS variables pairs with Tailwind v4 natively. Provides everything PatchNotes needs: Card, Badge, Button, Input, Dialog, Select, Tabs. (Confidence: HIGH on design direction, MEDIUM on Tailwind v4 compatibility detail — docs access was blocked during research.) |
| Lucide React | latest | Icon set | Default icon library for shadcn/ui. Consistent, tree-shakeable. |

**Do not use:** Material UI, Chakra UI, Ant Design — heavy, opinionated design systems that fight Tailwind. shadcn/ui + Tailwind is the dominant 2026 portfolio stack.

**Tailwind v4 installation for Next.js (verified from official docs):**
```bash
npx create-next-app@latest patchnotes --typescript --eslint --app
npm install tailwindcss @tailwindcss/postcss postcss
```
Create `postcss.config.mjs` with `"@tailwindcss/postcss": {}` plugin. Add `@import "tailwindcss";` to `app/globals.css`.

---

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MongoDB Atlas | M0 free tier | Primary data store | Keep it. Government policy data is document-shaped by nature: executive orders have different fields than bills, regulations have different metadata than amendments. MongoDB's flexible schema handles heterogeneous data without migrations when API response shapes change. Atlas M0 is free, hosted, no credit card. Existing government API integrations are validated working against MongoDB — no reason to re-validate a database switch. |
| Mongoose | 8.x | ODM / schema layer | Adds schemas, validation, and TypeScript types on top of the MongoDB driver. `mongoose.model()` provides the typed data layer that Server Components and Route Handlers call directly. Current stable major version as of training knowledge (MEDIUM confidence — run `npm show mongoose version` to verify before pinning). |

**Why not switch to PostgreSQL/Prisma/Drizzle:** The milestone context explicitly calls out that "MongoDB for data storage works" as a validated capability. Switching databases for a portfolio rebuild re-introduces risk in the data layer without any user-visible benefit. MongoDB's document model is a genuinely good fit for the heterogeneous structure of federal government data. If asked about this in an interview, "I kept MongoDB because the document model fits the data structure and the free tier eliminates hosting costs for a portfolio project" is a defensible answer.

**Search strategy:** MongoDB Atlas Search (built into Atlas, no additional service) handles full-text search over bill titles and AI summaries for v1. Upgrading to Algolia or Elasticsearch is a v2 decision if search quality proves insufficient.

---

### AI Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Google Generative AI SDK (`@google/generative-ai`) | latest | AI summarization client | Existing validated integration. Keep it. The previous version had working Gemini summarization — preserve that institutional knowledge. |
| Gemini Flash | `gemini-2.0-flash` or `gemini-1.5-flash` | Summarization model | Flash variants are optimized for throughput and cost, not raw capability. Batch summarization of government documents (well-defined prompt, structured output) is exactly the use case Flash is built for. (MEDIUM confidence on exact model name — verify current available models at ai.google.dev/gemini-api/docs/models before implementation.) |

**Why keep Gemini over switching to Claude or OpenAI:**
- Gemini summarization is already validated working — it produced acceptable output in the original project
- Switching AI providers for a rebuild adds risk with no proven benefit
- Gemini Flash has a generous free tier for development
- The Vercel AI SDK (optional addition — see supporting libraries) makes switching providers a config change if needed later

**Prompt strategy:** The "patch notes" structured format should be enforced via a system prompt with required output sections: `What changed:`, `Who it affects:`, `Why it matters:`. Use Gemini's JSON output mode if available to avoid regex parsing of AI output. A single well-engineered system prompt is the highest-leverage work in the AI layer.

---

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Clerk | latest | User auth + session management | Listed first in the official Next.js Auth Libraries documentation. Provides complete pre-built auth: sign-in/sign-up UI components, social login (Google, GitHub), JWT sessions, and Next.js App Router Middleware integration that protects routes. Free tier handles 10,000 MAU — more than sufficient for a portfolio project. For a solo developer, Clerk eliminates 2-3 weeks of auth boilerplate. (MEDIUM confidence on free tier MAU limit — verify at clerk.com/pricing.) |

**Alternative:** Auth.js (NextAuth v5) — open source, no MAU limits, more configuration. Valid choice if third-party auth dependencies are a concern or if demonstrating auth mechanics matters more than speed of delivery.

**Why not roll your own:** The official Next.js auth docs note directly: "implementing your own secure solution can quickly become complex. Consider using an Auth Library to simplify the process." The engineering time is better spent on PatchNotes' actual differentiators (data pipeline, AI prompt design, search, watchlist).

---

### Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zod | 3.x | Schema validation | Used in official Next.js auth documentation examples. TypeScript-first, runs on server and client, validates government API responses before MongoDB writes, validates Route Handler request bodies, integrates with Server Actions via `safeParse`. No alternatives worth considering. |

---

### Email

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Resend | latest | Transactional email | Watchlist notification emails and (optionally) auth emails. Modern developer API, `@react-email/render` package for JSX email templates, generous free tier (3,000 emails/month). Significantly simpler to configure than SendGrid for a solo developer. (MEDIUM confidence on free tier limits — verify at resend.com/pricing.) |

---

### Background Jobs / Scheduling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel Cron Jobs | N/A (built into Vercel) | Scheduled data ingestion | Define schedule in `vercel.json`, triggers a Next.js Route Handler (e.g. `GET /api/cron/ingest`). Zero additional service needed. Free on Hobby plan. Sufficient for a daily digest app. Protect the endpoint with a `CRON_SECRET` env var checked in the handler. |

**Why not a separate job queue (Bull, Inngest, Trigger.dev):** Over-engineering for v1. Vercel Cron + a Route Handler handles the daily government API poll and AI summarization job cleanly. A job queue adds a separate service, configuration, and monitoring surface area with no benefit until you need retry logic, fan-out, or real-time triggers — none of which are v1 requirements.

---

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | latest | Unit + component testing | Officially recommended by Next.js docs for unit testing. Vite-native transform (significantly faster than Jest). Jest-compatible API (same `describe`/`it`/`expect` surface). Native TypeScript support. Verified from official Next.js testing docs (v16.1.6, 2026-02-27). |
| React Testing Library | latest | Component testing companion | Pairs with Vitest. Tests from the user's perspective (roles, text, interactions) rather than implementation details. Standard for React component testing. |
| Playwright | latest | End-to-end testing | Officially recommended by Next.js docs for E2E. Automates Chromium, Firefox, and WebKit. Critical for testing auth flows, search behavior, and watchlist interactions end-to-end. A portfolio project with E2E tests is meaningfully stronger than one without. Verified from official Next.js Playwright docs (v16.1.6, 2026-02-27). |

**Important constraint from official docs:** Vitest does not yet support async Server Components. Use Playwright E2E tests for Server Component behavior. Use Vitest for Client Components, utilities, hooks, and pure functions (AI prompt builders, data transformation, Zod schemas).

**Solo-dev testing priorities:** Don't chase 100% coverage.
1. Unit tests: AI prompt builder functions, data transformation utilities, Zod schemas for API responses
2. Component tests: FeedItem, DigestCard (core display components)
3. E2E tests: view digest page, search flow, sign-in, add topic to watchlist

**Vitest setup (verified from official docs):**
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

**Playwright setup (verified from official docs):**
```bash
npm init playwright
```

---

### CI/CD

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | Hobby (free) | Hosting + automatic deployments | Zero-config Next.js deployment. Every git push creates a preview deployment with a unique URL. Merge to `main` = production deploy. Free tier includes: custom domains, HTTPS, edge network, serverless functions, cron jobs, preview deployments. A CI badge on the README and shareable preview URLs per PR are strong portfolio signals. |
| GitHub Actions | N/A | Test gate on PRs | Run Vitest unit tests and Playwright E2E tests on every PR before Vercel deploys. Vercel handles deployment; GitHub Actions handles the test gate. A passing test pipeline in the PR history is what separates a portfolio project from a demo. |

**CI workflow (`.github/workflows/test.yml`):**
```yaml
on: [push, pull_request]
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test        # Vitest
      - run: npx playwright install --with-deps
      - run: npm run test:e2e    # Playwright
```

---

### Code Quality

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | latest (via create-next-app) | Linting | Built into Next.js. The `eslint-config-next` plugin catches App Router-specific mistakes (e.g., using `useEffect` for data fetching in Server Components). Use flat config format (`eslint.config.mjs`). |
| Prettier | latest | Formatting | Non-negotiable for portfolio code. Pair with `eslint-config-prettier` to disable ESLint formatting rules that conflict with Prettier. |

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 3.x | Date formatting | Format government document dates ("Signed January 15, 2026"). Prefer over moment.js (smaller, tree-shakeable, no global mutation). |
| next-themes | latest | Dark mode toggle | Simple dark/light theme switching that integrates with shadcn/ui's CSS variable system. |
| Vercel AI SDK (`ai`) | 4.x | AI provider abstraction (optional) | If you want easy provider switching (Gemini → Claude → OpenAI is a config change). Not required if you stay on Gemini. Add if you want the streaming utilities for a potential future chat feature. (MEDIUM confidence on version — verify `npm show ai version`.) |
| SWR | latest | Client-side data fetching | Only needed for Client Components that require live data (e.g., search-as-you-type). Most PatchNotes data fetching happens in Server Components — do not add SWR preemptively. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 App Router | Remix | Both excellent. Next.js has better Vercel integration, ISR is a better fit for infrequently-changing digest data, and it's the industry-default portfolio signal. |
| Framework | Next.js 16 App Router | SvelteKit | Svelte is excellent but you'd spend interview time explaining the choice rather than having it signal competence. |
| Styling | Tailwind v4 + shadcn | Tailwind v3 | v4 is current (Jan 2025). No reason to use v3 for a new project. |
| Styling | Tailwind + shadcn | Chakra UI / MUI | Runtime overhead, opinionated design system that fights Tailwind, harder to make look unique. |
| Database | MongoDB Atlas (keep) | PostgreSQL + Drizzle | Policy data is document-shaped, not relational. MongoDB avoids migrations when government API response shapes change. Existing integration is validated. |
| Database | MongoDB Atlas (keep) | Supabase | Supabase bundles auth + storage + realtime — features PatchNotes handles with better-fit dedicated tools. Neon (pure Postgres) or MongoDB (keep) are cleaner. |
| AI | Gemini (keep) | Claude + Vercel AI SDK | Gemini summarization is validated working. Switching AI providers adds risk with no proven benefit. Vercel AI SDK is an optional addition to make switching easier, not a reason to switch. |
| AI | Gemini (keep) | OpenAI GPT-4o | OpenAI costs more per token for the same structured summarization task at low volumes. |
| Auth | Clerk | Auth.js (NextAuth v5) | Auth.js is the right choice if demonstrating auth mechanics matters or if Clerk's MAU limit becomes real. Clerk is faster to implement for a portfolio project. |
| Testing | Vitest + Playwright | Jest + Cypress | Vitest is faster than Jest, same API. Playwright is the modern standard over Cypress (better browser coverage, faster execution). Official Next.js recommendation. |
| Background jobs | Vercel Cron | Inngest / Trigger.dev / Bull | Over-engineering for a daily digest job. Vercel Cron + Route Handler is zero additional service. Add a job queue only when you need retry queues, fan-out, or real-time triggers. |

---

## Integration Points

Where layers connect — design these decisions before building:

| Integration | Layer A | Layer B | Key Consideration |
|-------------|---------|---------|-------------------|
| DB reads in Server Components | Mongoose | Next.js RSC | Call Mongoose directly in async Server Components — no API layer needed for reads. |
| Auth protection | Clerk | Next.js Middleware | Clerk middleware runs before requests for protected routes (`/dashboard`, `/watchlist`). `auth()` in Server Components provides session data. |
| AI calls | Gemini API | Next.js Route Handlers | Summarization runs in Route Handlers or Server Actions — never client-side. System prompt is the source of truth for patch-notes format. |
| Daily ingestion job | Vercel Cron | Next.js Route Handler | Cron triggers `GET /api/cron/ingest` → fetch government APIs → validate with Zod → deduplicate → write to MongoDB → trigger AI summarization for new items. Protect with `CRON_SECRET`. |
| Search | MongoDB Atlas Search | Next.js Server Component | Atlas Search provides full-text search over bill titles and summaries via the Aggregation Pipeline. No separate search service for v1. |
| Email notifications | Resend | MongoDB watchlist data | After each ingestion run, query users with matching watchlist topics → send Resend emails with matched items. |
| Cache invalidation | MongoDB write | Next.js revalidateTag | After new items are written by the cron job, call `revalidateTag('digest')` to invalidate the cached digest page so the next request gets fresh data. |

---

## Data Flow

```
Daily Cron (Vercel, configurable schedule)
  → Route Handler: GET /api/cron/ingest
      → Fetch: Congress API, Federal Register, EO RSS feed
      → Validate: Zod schemas per source
      → Deduplicate: check MongoDB for existing item IDs
      → Write: new items to MongoDB Atlas (without summaries)
      → For each new item: call Gemini API with structured prompt
      → Write: AI summaries back to MongoDB documents
      → Call: revalidateTag('digest') to bust ISR cache

User request for /digest
  → Next.js: check ISR cache (revalidate: 3600)
  → Cache HIT: return cached HTML instantly
  → Cache MISS: Server Component reads from MongoDB, renders, caches

User search
  → Client: input → debounced fetch to /api/search?q=...
  → Route Handler: MongoDB Atlas Search aggregation
  → Return: matched items with title + summary snippet

User watchlist update
  → Server Action
  → Write: user topic preference to MongoDB
  → Next notification run picks up updated preferences
```

---

## Project Structure (Recommended)

```
patchnotes/
├── app/
│   ├── (auth)/              # Clerk-provided sign-in / sign-up pages
│   ├── (protected)/         # Routes requiring auth (watchlist, bookmarks, settings)
│   │   ├── watchlist/
│   │   └── bookmarks/
│   ├── api/
│   │   ├── cron/
│   │   │   └── ingest/      # Vercel Cron target — government data + AI summarization
│   │   └── search/          # Full-text search endpoint
│   ├── digest/              # Daily digest (ISR, revalidate: 3600)
│   ├── explore/             # Search + browse page
│   ├── item/[id]/           # Individual item detail (ISR)
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn/ui components (CLI-generated, owned)
│   ├── feed/                # FeedItem, DigestCard, CategoryBadge, TopicTag
│   └── layout/              # Header, Footer, NavBar
├── lib/
│   ├── db/
│   │   └── models/          # Mongoose models: Bill, ExecutiveOrder, Regulation, User, Watchlist
│   ├── ai/
│   │   ├── gemini.ts        # Gemini client + prompt constants
│   │   └── prompts.ts       # System prompt templates for patch-notes format
│   ├── gov-apis/            # Congress API, Federal Register, EO feed clients
│   └── email/               # Resend client + email template renderers
├── middleware.ts             # Clerk middleware for route protection
└── __tests__/               # Vitest unit tests (utilities, schemas, prompt builders)
tests/                       # Playwright E2E tests
```

---

## Environment Variables

```bash
# MongoDB
MONGODB_URI=mongodb+srv://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Gemini
GEMINI_API_KEY=AIzaSy...

# Resend
RESEND_API_KEY=re_...

# Cron protection
CRON_SECRET=a-long-random-secret

# Government APIs
CONGRESS_API_KEY=...
```

---

## Installation

```bash
# Bootstrap (TypeScript + ESLint + App Router)
npx create-next-app@latest patchnotes --typescript --eslint --app
cd patchnotes

# Tailwind CSS v4 (PostCSS for Next.js)
npm install tailwindcss @tailwindcss/postcss postcss

# shadcn/ui (interactive setup — choose your component defaults)
npx shadcn@latest init

# Database
npm install mongoose

# Auth
npm install @clerk/nextjs

# Validation
npm install zod

# AI
npm install @google/generative-ai

# Email
npm install resend @react-email/render

# Utilities
npm install date-fns next-themes

# Testing (dev only)
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
npm init playwright

# Code quality
npm install -D prettier eslint-config-prettier
```

---

## What NOT to Build (Over-Engineering Risks)

| Temptation | Why to Skip |
|------------|-------------|
| Separate Express/Fastify backend | Route Handlers and Server Actions cover everything. A separate backend doubles deployment complexity and architecture surface for zero gain. |
| GraphQL | REST Route Handlers + Server Actions are simpler, fully type-safe with Zod+TypeScript, and what most companies actually use. GraphQL signals over-engineering here. |
| Redis / Upstash | Next.js ISR + Data Cache handles government API and AI response caching natively. Add only when you have a measured performance problem. |
| tRPC | Server Actions already provide type-safe server calls. Save tRPC for a team project with defined contract boundaries. |
| Elasticsearch / Algolia | MongoDB Atlas Search handles keyword search over bill titles and summaries at v1 volumes. Add only if search quality proves insufficient. |
| Docker / Kubernetes | Vercel manages containerization. Docker adds local overhead. Only introduce if you move off Vercel. |
| Turborepo / monorepo | One app, one developer. Monorepo tooling adds overhead with zero benefit until there's a second package to maintain. |
| State management (Redux, Zustand) | Server Components eliminate most global state. React `useState`/`useContext` covers v1 UI state. |
| Real-time features (WebSockets, SSE) | Out of scope per PROJECT.md. Government data changes on a daily basis, not in real time. |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Next.js version + App Router recommendation | HIGH | Verified: official docs v16.1.6, updated 2026-02-27 |
| Tailwind CSS v4 install for Next.js | HIGH | Verified: official Tailwind docs v4.2 |
| Vitest setup | HIGH | Verified: official Next.js testing docs v16.1.6 |
| Playwright setup | HIGH | Verified: official Next.js testing docs v16.1.6 |
| Next.js caching / ISR behavior | HIGH | Verified: official Next.js caching docs v16.1.6 |
| Auth library landscape (Clerk listed first) | HIGH | Verified: official Next.js auth docs v16.1.6 |
| Route Handler capabilities | HIGH | Verified: official Next.js Route Handler docs v16.1.6 |
| shadcn/ui Tailwind v4 compatibility | MEDIUM | Official docs access denied; training data knowledge |
| Mongoose version (8.x) | MEDIUM | Training data; run `npm show mongoose version` to verify |
| Gemini model names (gemini-2.0-flash) | MEDIUM | Training data; verify at ai.google.dev/gemini-api/docs/models |
| @google/generative-ai SDK version | MEDIUM | Training data; run `npm show @google/generative-ai version` to verify |
| Clerk free tier (10,000 MAU) | MEDIUM | Training data; verify at clerk.com/pricing |
| Resend free tier (3,000 emails/month) | MEDIUM | Training data; verify at resend.com/pricing |
| MongoDB Atlas M0 free tier | MEDIUM | Training data; verify at mongodb.com/cloud/atlas/register |

---

## Sources

| Source | Confidence | What It Confirmed |
|--------|------------|-------------------|
| Next.js official docs v16.1.6 (nextjs.org/docs, updated 2026-02-27) | HIGH | App Router recommendation, Route Handlers, Server Actions, auth libraries, testing (Vitest + Playwright), caching, ISR, auth patterns |
| Tailwind CSS official docs v4.2 (tailwindcss.com) | HIGH | v4 PostCSS install for Next.js, CSS-first config |
| Training data (knowledge cutoff August 2025) | MEDIUM | Mongoose, Gemini SDK, Clerk, Resend, shadcn/ui — verify current versions and pricing before implementation |
