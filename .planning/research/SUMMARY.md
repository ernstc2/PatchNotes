# Project Research Summary

**Project:** PatchNotes — Government Policy Digest App
**Domain:** Civic tech / AI-powered government data aggregation and summarization
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (stack and architecture HIGH from verified docs; AI/DB specifics MEDIUM; features MEDIUM from training data)

## Executive Summary

PatchNotes is a government policy digest app that translates federal government actions (executive orders, bills, regulations) into structured "patch notes" format for everyday citizens. The research consensus is clear: this is a well-understood problem domain with established patterns — a single Next.js (App Router) application, deployed to Vercel, using a serverless Postgres database (Neon), with AI summarization happening at ingestion time and results cached permanently in the database. There is no need for a separate backend server, a message queue, microservices, or a caching layer. The architecture's central insight is that government data changes slowly (daily), which makes pre-generation the correct pattern: AI summaries are generated once per document during the daily cron job, never at user request time.

The recommended stack is modern but not exotic: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Drizzle ORM, Neon (Postgres), Auth.js v5, Vercel AI SDK with Claude (Anthropic), Resend for email, and Vitest + Playwright for testing. One significant architectural decision surfaces from cross-referencing STACK.md against ARCHITECTURE.md: ARCHITECTURE.md recommends keeping MongoDB from the existing codebase, while STACK.md explicitly recommends migrating to PostgreSQL/Neon. **Follow STACK.md.** Policy data is fundamentally relational (bills have sponsors, topics map to items, users subscribe to topics), Postgres full-text search eliminates the need for a search service, and Neon's serverless model costs $0/month for a portfolio project.

The two highest risks to a successful build are cost runaway from unrestricted AI summarization and scope creep that delays launch indefinitely. Both have straightforward mitigations: gate all summarization behind a cache-miss check, set a hard AI spend cap from day one, define a strict v1 feature lock, and treat the PROJECT.md out-of-scope list as a contract. A deployed project with three solid features beats an undeployed project with six incomplete ones.

---

## Key Findings

### Recommended Stack

The stack is a modern Next.js-native monolith with no separate backend. Next.js 16 App Router handles frontend (React Server Components), backend (Route Handlers), and background jobs (Vercel Cron) in one deployment. TypeScript is required throughout. Database migrations from the existing MongoDB codebase to Neon (serverless Postgres) via Drizzle ORM are recommended — the relational nature of policy data (bills, sponsors, topics, users, watchlists) fits a relational model better than documents. AI is handled by Claude via the Vercel AI SDK, which makes provider-switching a config change rather than a rewrite.

**Core technologies:**
- **Next.js 16 (App Router):** Full-stack framework — server components eliminate client fetch overhead; ISR handles daily digest caching; Route Handlers replace Express entirely
- **TypeScript 5.1+:** Required for portfolio credibility and type safety across DB queries, API contracts, and AI response validation
- **Tailwind CSS v4 + shadcn/ui:** Styling layer — v4 is current (Jan 2025), shadcn gives production-quality accessible components without adding a heavy dependency
- **Neon (serverless Postgres) + Drizzle ORM:** Database — relational model fits policy data; Drizzle is TypeScript-first with SQL-readable API; Neon free tier is $0/month for portfolio scale
- **Claude (Anthropic SDK) + Vercel AI SDK:** AI summarization — Claude follows structured formatting instructions reliably; Vercel AI SDK abstracts provider so switching costs nothing; Haiku for batch ingestion, Sonnet for detail pages
- **Auth.js v5:** Authentication — App Router native, credentials + JWT sessions, avoids Clerk's SaaS dependency cost
- **Vercel Cron Jobs:** Background scheduling — built into Vercel Hobby tier, triggers daily ingest at 6am UTC, zero additional infrastructure
- **Resend:** Email notifications — 3,000 emails/month free tier, React Email templates, watchlist digest delivery
- **Vitest + Playwright:** Testing — Vitest for unit/component tests, Playwright for E2E auth/search/watchlist flows; CI badge on README is a strong portfolio signal

**What not to build:** No separate Express server, no GraphQL, no Redis, no tRPC, no Turborepo, no React Query, no Redux. All of these are over-engineering for a solo portfolio project of this scale.

### Expected Features

**Must have (table stakes):**
- Scannable feed of recent policy changes — core premise; already exists, needs rebuild
- AI summary per item in "patch notes" format (What Changed / Who It Affects / Why It Matters) — the brand differentiator and trust anchor
- Date-based filtering and "today's changes" view — users orient by recency
- Category/topic filtering — narrows 50+ daily items to what matters per user
- Item detail view with structured AI breakdown and link to official source — trust requires source attribution
- Search with keyword + topic filter — required rebuild target per PROJECT.md
- Responsive design and dark mode — already exists; rebuild cleaner

**Should have (differentiators):**
- Daily digest view as primary landing experience — single curated "what happened today" page; strongest retention driver
- Topic watchlist with onboarding flow — "what do you care about?" on first run; personalization drives return visits 2-3x per research patterns
- Email notification for watchlist topics — primary re-engagement channel for policy content; push notification permission rates are too low to justify
- Impact framing ("Who this affects") — makes abstract policy feel personal; pure prompt engineering, not engineering complexity
- Severity/scope visual indicator — broad national vs. narrow administrative; adds scannability; requires AI classification; defer to v1.1

**Defer to v2+:**
- "What changed vs before" delta view — requires diffing strategy; high complexity
- State/local government data — dozens of separate APIs; exponential scope growth
- Mobile push notifications — out of scope per PROJECT.md
- AI chatbot / "ask about this bill" — high cost and moderation surface area for v1
- Social features (comments, reactions) — not core to civic literacy mission

### Architecture Approach

The correct architecture is a single Next.js application with four logical subsystems: (1) a daily cron-triggered ingestion pipeline that fetches from Congress.gov, Federal Register, and Regulations.gov; (2) an AI summarization step that runs at ingestion time, not request time, storing structured summaries permanently in Postgres; (3) a read-heavy server-rendered frontend where Server Components query the database directly with no intermediate API layer; and (4) client-side interactions (bookmarks, watchlist) handled by a small set of Route Handlers. Auth.js handles session management via JWT (no sessions table). Pre-computed digest documents mean the homepage is a single Postgres lookup by date, not a real-time aggregation.

**Major components:**
1. **Ingestion Pipeline** (`lib/ingestion/`) — Fetches government APIs daily via Vercel Cron, upserts items by sourceId (idempotent), stores raw response + structured fields; Congress adapter, Federal Register adapter, Regulations.gov adapter
2. **AI Summarization** (`lib/ai/`) — Runs after ingestion for all items with null summaries; calls Claude with structured JSON prompt; validates output against Zod schema before storing; never called at request time
3. **Digest Composer** — Assembles a pre-computed digest document (ordered item IDs + metadata) so homepage query is a single lookup; runs at end of ingestion pipeline
4. **Server-Rendered Frontend** (`app/(app)/`) — Server Components read from `lib/db/queries` directly; daily digest, explore/search, item detail, watchlist, bookmarks pages
5. **Auth + User Features** (`lib/auth.ts`, `app/(auth)/`) — Auth.js credentials provider, JWT sessions, bookmark and watchlist mutations via Route Handlers
6. **Email Notifications** — Resend-triggered after watchlist items change; queries users subscribed to matching topic slugs

**Critical architecture note:** ARCHITECTURE.md was written recommending MongoDB retention; STACK.md, written with deeper analysis, recommends migrating to Postgres. The Postgres recommendation is correct — follow it. The schema design from ARCHITECTURE.md (unified `items` collection with `type` discriminator, pre-composed `digests`, `users` with watchlist as topic slug array) maps directly to Postgres tables with minimal translation.

### Critical Pitfalls

1. **AI cost runaway from batch summarization** — Never summarize all ingested documents automatically. Gate every AI call behind a cache-miss check. Set a hard spend cap in the AI provider dashboard from day one. For the daily digest, summarize only the curated top items. Log tokens per request from the start. *Phase warning: data pipeline phase.*

2. **Government APIs treated as reliable infrastructure** — Congress.gov, Federal Register, and Regulations.gov go down without notice, return malformed data, and silently change schemas. Wrap every call in retry with exponential backoff (3 attempts). Store raw API responses before any processing — if processing fails, you can reprocess without re-fetching. Build a simple admin health check showing last-successful-fetch timestamps per source. *Phase warning: data pipeline and initial deployment.*

3. **AI prompt design as afterthought** — "Patch notes" format requires a specific structured schema. Design the summary schema first (headline, whatChanged, whoAffected, status, topics). Enforce it via JSON mode and validate against a Zod schema before storing. Test against 10 diverse real documents before finalizing. If output fails Zod validation, retry once then store a raw excerpt fallback. *Phase warning: must be solved before building any digest display UI.*

4. **Building auth before the core product** — Auth is needed for exactly one feature: watchlist. Build the daily digest, search, and item detail views first (all public/read-only). Add auth only when the watchlist phase begins. Building auth in week one produces nothing visible and introduces security surface area before there's any value to protect. *Phase warning: sequence auth to watchlist phase, not foundation.*

5. **Scope creep disguised as polish** — Every new idea is compelling, especially with the "patch notes" metaphor (versioning, user changelogs, diff views...). Write new ideas to BACKLOG.md and defer explicitly. Each milestone must touch the deployed app. Time-box the entire v1 build; cut features before extending the timeline. *Phase warning: highest risk during frontend development.*

---

## Implications for Roadmap

The feature dependency graph and pitfall warnings together make the phase ordering unambiguous. The data pipeline must precede AI summarization; AI summarization must precede any digest display; search and user features are independent additive layers. Auth is gated to the watchlist phase to avoid the "auth before product" anti-pattern.

### Phase 1: Foundation + Project Setup
**Rationale:** Zero-config Next.js + Neon + Drizzle setup establishes the base everything else runs on. No features yet — just working infrastructure. Get CI, deployment pipeline, and a live URL established before writing product code.
**Delivers:** Deployed Next.js app on Vercel, Neon Postgres connected via Drizzle, TypeScript config, ESLint/Prettier, GitHub Actions CI, shadcn/ui initialized, environment variable structure
**Addresses:** Basic project scaffolding
**Avoids:** Secrets committed to repo (Pitfall 8 — configure .gitignore and Vercel secrets on day one); architectural drift from starting without proper foundation

### Phase 2: Data Ingestion Pipeline
**Rationale:** Everything downstream — AI summaries, digest display, search — depends on having fresh government data in the database. The pipeline must be proven reliable and idempotent before any UI is built against it.
**Delivers:** Three working API adapters (Congress.gov, Federal Register, Regulations.gov), unified `items` table with Drizzle schema, idempotent upsert logic, Vercel Cron job wired up, manual trigger endpoint, raw response storage, last-ingested timestamps, admin health check route
**Addresses:** Feed data requirements; government data freshness
**Avoids:** Government API fragility (Pitfall 2 — retry logic, defensive parsers, raw response storage); N+1 fetch problem from existing codebase (identified in ARCHITECTURE.md); cron reliability (Pitfall 13)
**Research flag:** NEEDS RESEARCH — Congress.gov API current rate limits, Federal Register pagination behavior at scale, and Regulations.gov rate limit specifics should be verified against current documentation before implementation. Token chunking strategy for long documents (100K+ word bills) also needs validation.

### Phase 3: AI Summarization Pipeline
**Rationale:** Summaries must exist and have a validated format before any UI component renders them. Prompt design is the most iterative work in the project — it needs time before it's embedded in all display components.
**Delivers:** Claude integration via Vercel AI SDK, structured summary schema (Zod-validated), prompt templates for each item type, batch summarization with rate limiting, permanent summary storage, re-run logic for null summaries, token chunking for long documents, fallback behavior on AI failure
**Addresses:** "Patch notes" structured format as brand differentiator; item summaries for feed and detail view
**Avoids:** AI cost runaway (Pitfall 1 — cache-miss gate, spend cap, top-N limit); prompt inconsistency (Pitfall 5 — Zod validation before storage); model version lock (Pitfall 14 — model name in env var)
**Research flag:** NEEDS VALIDATION — Verify current Claude model names, pricing, and rate limits at docs.anthropic.com before implementation. Verify Vercel AI SDK version and Anthropic provider integration.

### Phase 4: Daily Digest + Core Feed Display
**Rationale:** With data and summaries in the database, the core product value can be rendered. This is the first phase that produces something a user can actually read. Deploy this and share it — even to get early feedback.
**Delivers:** Homepage as daily digest view (pre-computed digest document, single Postgres lookup), feed with AI patch-notes cards (headline, what changed, who affected, status, topic tags), item detail page (structured breakdown + official source link), topic/category filtering, date navigation, dark mode, responsive layout, error boundaries on AI-generated content
**Addresses:** Table stakes features (scannable feed, structured summaries, date filtering, category filtering, item detail, official source links, responsive design); daily digest as primary retention driver
**Avoids:** Frontend crash on AI failure (Pitfall 11 — error boundaries, graceful degradation); scope creep (Pitfall 3 — digest and feed only, no user features yet)

### Phase 5: Search + Explore
**Rationale:** Search is a required rebuild target per PROJECT.md and is independent of user accounts. Postgres full-text search (`tsvector`) handles keyword search for v1 — no Elasticsearch needed.
**Delivers:** Explore page (browse all items with type/date/topic filters), keyword search with full-text index on title + summary headline, search result cards, URL-encoded search state (shareable links), pagination
**Addresses:** Search requirement from PROJECT.md; competitive gap vs GovTrack (no search for non-experts)
**Avoids:** Over-engineering search (Pitfall 12 — Postgres FTS is sufficient for v1; Algolia/Elasticsearch deferred)
**Research flag:** STANDARD PATTERNS — Postgres full-text search with tsvector/tsquery is well-documented; no additional research needed.

### Phase 6: User Accounts + Watchlist + Bookmarks
**Rationale:** Auth is introduced here — only when the watchlist feature actually requires user identity. This is the correct order per the "auth before product" pitfall. Onboarding flow captures topic preferences immediately, making the watchlist sticky from first use.
**Delivers:** Auth.js v5 credentials provider (email + password), JWT sessions, register/login/logout flows, Middleware route protection, topic watchlist with onboarding flow (5-10 topic cards on first login), watchlist management page, bookmarks (save items), bookmark management page
**Addresses:** Watchlist and bookmarks from PROJECT.md rebuild targets; onboarding as high-leverage retention feature; personalization from day one
**Avoids:** Building auth too early (Pitfall 4 — auth introduced only in this phase); using Clerk (STACK.md recommendation to avoid third-party auth SaaS)

### Phase 7: Email Notifications
**Rationale:** Completes the watchlist loop. Email is the primary re-engagement channel for a policy app — watchlist changes that don't surface anywhere drive churn.
**Delivers:** Resend integration, watchlist change detection after daily ingest, email notification to subscribed users, React Email templates with digest format, unsubscribe flow, notification preferences in user settings
**Addresses:** Email notification requirement from PROJECT.md; watchlist re-engagement loop; sticky daily habit formation
**Avoids:** Email deliverability gotchas (use Resend with proper DNS records, not a raw SMTP relay); push notification over-engineering (email only per PROJECT.md scope)
**Research flag:** NEEDS VALIDATION — Verify Resend current free tier limits and Next.js integration package. Test email delivery and unsubscribe mechanics before assuming they work.

### Phase 8: Polish + Portfolio Presentation
**Rationale:** The final phase is for production-quality finishing that makes the project presentable to hiring managers, not new features. Deploy-first mentality — the URL should have been live since Phase 4.
**Delivers:** Comprehensive README (one-sentence pitch, live demo link, architecture diagram, tech stack, "interesting problems solved"), accessibility audit (semantic HTML, ARIA labels, keyboard navigation), loading skeleton states, error pages (404, 500), performance audit (Core Web Vitals), CI badge, uptime monitoring (UptimeRobot free tier), seed data for demo reliability
**Addresses:** Portfolio anti-patterns (Pitfall 10 — README and live demo); error boundaries and graceful degradation; demo reliability
**Avoids:** "Polish before shipping" trap (Pitfall 3 — polish is the last phase, not an ongoing blocker)

### Phase Ordering Rationale

- Phases 1-3 are strictly sequential: infrastructure before data before summaries. No phase can be built without the one before it.
- Phase 4 (digest display) is the first user-visible milestone. It should be deployed publicly as soon as it works — not held until "perfect." A live URL with real government data and real AI summaries is a strong portfolio artifact on its own.
- Phases 5-7 are additive and largely independent of each other. If time is short, Phase 5 (search) and Phase 6 (watchlist) are higher priority than Phase 7 (email) — search is a stated requirement, watchlist is the core personalization feature.
- Phase 8 is explicitly the last phase. Polish does not happen during phases 1-7 except where directly needed for functionality.
- Auth is intentionally deferred to Phase 6. The daily digest, search, and explore features are entirely public/read-only and do not require a user identity.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Data Ingestion):** Congress.gov API current rate limits, schema, and endpoint availability need verification against current docs. Federal Register pagination behavior at high volume needs real-world testing. Regulations.gov per-document fetch N+1 problem needs profiling to determine if parallelization is required within Vercel's 60s function timeout. Document this research before writing a line of ingestion code.
- **Phase 3 (AI Summarization):** Claude model names, pricing, and rate limits change frequently. Verify at docs.anthropic.com before implementation. Token limits for long legislative documents (omnibus bills can be 100K+ words) need a concrete chunking strategy. Vercel AI SDK Anthropic provider integration should be confirmed with `npm show ai version` + SDK docs.
- **Phase 7 (Email Notifications):** Resend free tier limits, DNS setup requirements, and React Email template integration need validation. Email deliverability for notification emails (SPF/DKIM) has domain-specific setup that varies.

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** `create-next-app` defaults, Neon setup, Drizzle migration — all covered by official docs verified during STACK research.
- **Phase 4 (Digest Display):** React Server Components data fetching patterns, shadcn/ui components, ISR with `revalidateTag` — standard App Router patterns, no unknowns.
- **Phase 5 (Search):** Postgres full-text search with tsvector/tsquery — well-documented, no external research needed for v1 implementation.
- **Phase 6 (Auth + Watchlist):** Auth.js v5 with App Router is documented; credentials provider + JWT sessions is the straightforward path.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Next.js, Tailwind, testing recommendations sourced from official docs (2026-02-27). Drizzle, Neon, Vercel AI SDK at MEDIUM — verify versions before install. |
| Features | MEDIUM | Competitor feature landscape from training data (cutoff Aug 2025). Core feature set is well-defined by PROJECT.md. Verify current GovTrack/Congress.gov state before finalizing differentiators. |
| Architecture | HIGH | Single-app pattern, Server Components, cron ingestion, pre-generated summaries — all confirmed against official Next.js and Vercel docs. Key caveat: ARCHITECTURE.md recommends MongoDB while STACK.md recommends Postgres — STACK.md wins. |
| Pitfalls | HIGH | AI cost management, scope creep, and portfolio anti-patterns are universal patterns with high-confidence documentation. Government API reliability at MEDIUM — verify specific rate limits before implementation. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Congress.gov API current rate limits and schema:** Verify at https://api.congress.gov/ before Phase 2. Rate limits and endpoint structure have evolved in 2024-2025.
- **Claude model names and pricing:** Change frequently. Verify current model IDs at `docs.anthropic.com/en/docs/about-claude/models/overview` before Phase 3. Haiku and Sonnet naming conventions should be confirmed.
- **Drizzle ORM version and Neon serverless driver compatibility:** Run `npm show drizzle-orm version` and check Neon's Drizzle integration docs before Phase 1 setup to get exact install commands.
- **Regulations.gov pipeline performance:** The existing codebase makes N+1 requests (one list + one follow-up per document). At 100+ regulations/day, this may approach Vercel's 60s Hobby function timeout. Benchmark during Phase 2 to determine if parallelization (batches of 5, Promise.all) is required.
- **Token chunking strategy:** Appropriations bills and omnibus regulations can exceed 100K words. A concrete chunking approach (first N tokens, map-reduce, section-by-section) needs to be chosen before Phase 3 to avoid mid-build rework.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs v16.1.6 — framework, routing, caching, testing, auth patterns (verified 2026-02-27)
- Tailwind CSS v4 announcement — https://tailwindcss.com/blog/tailwindcss-v4 (January 22, 2025)
- Vercel Cron Jobs docs — confirmed Hobby tier once-per-day limit, CRON_SECRET pattern (verified 2026-03-11)
- Next.js App Router Route Handlers docs — REST pattern, Server Component data access (verified 2026-03-11)
- Existing PatchNotes codebase — direct inspection of server.js, geminiAPI.js, regulationAPI.js (HIGH confidence for existing anti-patterns identified)
- PROJECT.md — feature scope, out-of-scope list, rebuild targets

### Secondary (MEDIUM confidence)
- Drizzle ORM (orm.drizzle.team) — site blocked during research; capabilities from training knowledge; verify version before install
- Neon (neon.tech) — free tier details from training knowledge; verify current limits
- Anthropic Claude API (docs.anthropic.com) — model names and pricing change frequently; verify before Phase 3
- Vercel AI SDK (sdk.vercel.ai) — site blocked during research; verify version and Anthropic provider support
- Auth.js v5 (authjs.dev) — listed by name in official Next.js auth docs; v5 stability should be verified
- Competitor feature landscape (GovTrack, Congress.gov, Legiscan, Ground News, The Skimm, Axios) — training data knowledge cutoff August 2025; verify current state before finalizing differentiators
- Government API reliability patterns — training knowledge from public project post-mortems

### Tertiary (LOW confidence)
- Gemini API rate limits (existing ARCHITECTURE.md reference) — superseded by STACK.md recommendation to switch to Claude; disregard Gemini-specific rate limit claims
- OpenAI billing patterns in PITFALLS.md — directly applicable to Claude with appropriate cost recalibration; Claude Haiku pricing should be verified at current Anthropic pricing page

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
