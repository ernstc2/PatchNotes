# Roadmap: PatchNotes

## Overview

Eight phases that build PatchNotes from bare infrastructure to a portfolio-ready government policy digest. Phases 1-3 are strictly sequential (infrastructure, then data, then AI). Phase 4 produces the first publicly-readable product. Phases 5-7 add search, user accounts, and email — each independently deployable. Phase 8 finishes for the portfolio.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Next.js monorepo, Neon Postgres, CI/CD, and a live Vercel URL established before any product code (completed 2026-03-12)
- [x] **Phase 2: Data Ingestion** - Three government API adapters that reliably fill the database with filtered, deduplicated policy items every day (completed 2026-03-12)
- [x] **Phase 3: AI Summarization** - Gemini Flash pipeline that converts every filtered item into a validated patch-notes summary at ingestion time (completed 2026-03-12)
- [ ] **Phase 4: Digest + Feed** - The core product: daily digest homepage and scrollable feed with filtering, item detail, and dark mode — publicly deployed
- [ ] **Phase 5: Search + Explore** - Postgres full-text keyword search and browse-all explore page with type/topic/date filters
- [ ] **Phase 6: User Accounts + Personalization** - Auth, topic watchlist with onboarding flow, and bookmarks — introduced only when identity is actually needed
- [ ] **Phase 7: Email Notifications** - Resend-powered watchlist emails triggered after each daily ingest, with unsubscribe flow
- [ ] **Phase 8: Polish + Portfolio** - Accessibility audit, CI badge, test coverage, error pages, seed data, and a README that sells the project

## Phase Details

### Phase 1: Foundation
**Goal**: A deployed Next.js app on a real URL with Postgres connected, TypeScript enforced, and CI running — ready for product code
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-03, INFRA-05
**Success Criteria** (what must be TRUE):
  1. The app is live at a public Vercel URL and returns a 200 response
  2. A Drizzle migration runs against Neon Postgres without error
  3. TypeScript compilation passes with zero errors on `tsc --noEmit`
  4. Pushing to main triggers a GitHub Actions workflow that passes
  5. No secrets appear in the repository — all credentials load from environment variables
**Plans:** 2/2 plans complete
Plans:
- [ ] 01-01-PLAN.md — Scaffold Next.js project, install deps, configure Drizzle/shadcn/next-themes, create DB schema and health API
- [ ] 01-02-PLAN.md — Landing page with dark mode toggle and DB status, GitHub Actions CI, Vercel deployment verification

### Phase 2: Data Ingestion
**Goal**: Three government API adapters run on a daily Vercel Cron schedule, storing 15-30 filtered items per day in Postgres with idempotent upsert and graceful retry
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. Triggering the cron endpoint manually populates the database with real executive orders, bills, and regulations from today
  2. Running the ingest twice for the same day produces no duplicate rows (upsert by source ID is idempotent)
  3. Daily item count stays at or below 30 through API-level filtering before any data hits the database
  4. An admin health route shows last-successful-fetch timestamps for each of the three sources
  5. When a government API returns an error, the pipeline logs it, retries with backoff, and continues — it does not crash
**Plans**: 2 plans
Plans:
- [ ] 02-01-PLAN.md — Schema, types, deps, Vercel cron config, and DB migration
- [ ] 02-02-PLAN.md — Three API adapters, ingest orchestrator, cron route, and admin status route

### Phase 3: AI Summarization
**Goal**: Every filtered item in the database gets a Gemini Flash-generated summary in validated patch-notes JSON format, cached permanently so no AI call ever happens at request time
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06
**Success Criteria** (what must be TRUE):
  1. After ingest, every new item has a non-null `summary` column containing headline, whatChanged, whoAffected, whyItMatters, and severity fields
  2. A Zod schema validates every AI response before it is written to the database — invalid responses are retried once then fall back to a raw excerpt
  3. Each summary includes a severity/scope signal (broad national vs narrow administrative) visible in the stored JSON
  4. A user who clicks an item not in the daily filter receives an on-demand summary within a few seconds, and that summary is cached so the next click is instant
  5. Re-running the summarization pipeline on items that already have summaries makes no AI calls (cache-miss gate enforced)
**Plans**: 2 plans
Plans:
- [ ] 03-01-PLAN.md — Install deps, configure Vitest, create SummarySchema, prompt builder, and Gemini client with tests
- [ ] 03-02-PLAN.md — Batch summarization with retry/fallback, ingest integration, and on-demand API route

### Phase 4: Digest + Feed
**Goal**: Everyday people can read today's government changes in patch-notes format from a public URL, filter by type and topic, and click through to official sources
**Depends on**: Phase 3
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, FEED-06, UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Visiting the homepage shows a daily digest of today's government changes — no loading spinner, summaries are already in the database
  2. A user can filter the feed by type (executive orders, bills, regulations) and by topic category and see results update
  3. Clicking any item opens a detail page showing the structured patch-notes breakdown (what changed, who it affects, why it matters) and a link to the official government source
  4. The app works on a phone screen and looks clean on a desktop — no broken layouts
  5. A dark mode toggle switches the entire app and persists across page loads
**Plans:** 1/2 plans executed
Plans:
- [ ] 04-01-PLAN.md — Install shadcn components, create feed types/queries with tests, and presentational components (badges, card)
- [ ] 04-02-PLAN.md — Homepage feed page with filter bar, item detail page, and visual verification checkpoint

### Phase 5: Search + Explore
**Goal**: A user can find any government item by keyword or browse the full archive by type, topic, and date
**Depends on**: Phase 4
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. Typing a keyword into the search bar returns relevant items with summary snippets visible in the results list
  2. Search results can be narrowed by topic and item type simultaneously — the URL encodes the filter state so it is shareable
  3. An explore page lets a user browse all items with type, topic, and date filters — no keyword required
**Plans**: TBD

### Phase 6: User Accounts + Personalization
**Goal**: Users can create an account, pick the topics they care about, bookmark items, and manage their watchlist — all gated behind auth introduced only at this phase
**Depends on**: Phase 4
**Requirements**: USER-01, USER-02, USER-03, PERS-01, PERS-02, PERS-03, PERS-04
**Success Criteria** (what must be TRUE):
  1. A new user can register with email and password, complete a topic onboarding flow, and land on a watchlist-filtered feed in one sitting
  2. Refreshing the browser after login keeps the session alive — the user does not have to log in again
  3. A logged-in user can bookmark any item and view all bookmarks from their profile page
  4. A user can add and remove topics from their watchlist from a profile management page
**Plans**: TBD

### Phase 7: Email Notifications
**Goal**: Users with a watchlist receive an email after each daily ingest when new items match their followed topics, with a working unsubscribe link
**Depends on**: Phase 6
**Requirements**: PERS-05
**Success Criteria** (what must be TRUE):
  1. After the daily ingest runs, a user subscribed to "healthcare" receives an email listing any new healthcare items ingested that day
  2. Clicking the unsubscribe link in the email removes the user from future notifications without requiring them to log in
  3. Users who have no watchlist topics, or whose topics had no new items, receive no email that day
**Plans**: TBD

### Phase 8: Polish + Portfolio
**Goal**: The deployed app is ready to show to a hiring manager — accessible, tested, documented, and reliable
**Depends on**: Phase 7
**Requirements**: INFRA-02, INFRA-04
**Success Criteria** (what must be TRUE):
  1. The GitHub README contains a live demo link, one-sentence pitch, tech stack, and a brief description of at least one interesting engineering problem solved
  2. CI runs on every push and a green badge is visible on the README
  3. The app has meaningful unit and E2E test coverage — at minimum the ingest pipeline, search query, and auth flow are tested
  4. The app returns a sensible 404 page for unknown routes and a 500 page for server errors — no blank screens
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-12 |
| 2. Data Ingestion | 2/2 | Complete   | 2026-03-12 |
| 3. AI Summarization | 2/2 | Complete   | 2026-03-12 |
| 4. Digest + Feed | 1/2 | In Progress|  |
| 5. Search + Explore | 0/? | Not started | - |
| 6. User Accounts + Personalization | 0/? | Not started | - |
| 7. Email Notifications | 0/? | Not started | - |
| 8. Polish + Portfolio | 0/? | Not started | - |
