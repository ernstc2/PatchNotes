---
phase: 04-digest-feed
plan: 01
subsystem: ui
tags: [shadcn, drizzle, react, tailwind, vitest]

# Dependency graph
requires:
  - phase: 03-ai-summarization
    provides: SummarySchema and SummaryOutput types consumed by FeedItem and SeverityBadge
  - phase: 01-foundation
    provides: shadcn/base-nova component infrastructure and Tailwind CSS setup
  - phase: 02-data-ingestion
    provides: policyItems DB schema (PolicyItem type) used by FeedItem and queries
provides:
  - FeedItem type (PolicyItem + parsedSummary) for feed pages
  - parseSummary utility for safe JSON parse + schema validation
  - getFeedItems query with optional type/topic filters (isNotNull summary, desc date, limit 50)
  - getItemById query returning item or null
  - SeverityBadge component mapping 3 severity levels to Badge variants
  - TypeBadge component mapping 4 item types to human-readable labels
  - FeedItemCard server component composing all feed display elements
  - shadcn card, badge, select UI primitives (base-nova style)
affects:
  - 04-02-homepage
  - 04-03-detail-page
  - any phase consuming feed data

# Tech tracking
tech-stack:
  added: [shadcn card, shadcn badge, shadcn select]
  patterns:
    - FeedItem = DB type + parsed domain data (PolicyItem & { parsedSummary })
    - parseSummary wraps JSON.parse + SummarySchema.safeParse, returns null on any failure
    - Server components import PolicyItem from DB schema directly (no client boundary needed)
    - prefetch={false} on feed item links to prevent prefetch storms

key-files:
  created:
    - src/features/feed/types.ts
    - src/features/feed/queries.ts
    - src/features/feed/queries.test.ts
    - src/components/severity-badge.tsx
    - src/components/type-badge.tsx
    - src/components/feed-item-card.tsx
    - src/components/ui/card.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/select.tsx
  modified: []

key-decisions:
  - "FeedItem type uses intersection (PolicyItem & { parsedSummary }) rather than mapping all fields — preserves DB type and adds domain-layer field"
  - "parseSummary returns null on empty string check before JSON.parse — avoids exceptions and handles both null and empty from DB"
  - "TypeBadge falls back to capitalizeType for unknown item types — future-proof against new item types from ingestion adapters"
  - "FeedItemCard is a server component (no use client) — reads item.date directly as Date object, formats with toLocaleDateString"
  - "prefetch={false} on title Link in FeedItemCard — prevents prefetch storm when 50 feed items render simultaneously"

patterns-established:
  - "Feed query pattern: conditions array starting with isNotNull(summary), conditionally push additional eq() filters, spread into and()"
  - "Severity visual hierarchy: destructive (national) > secondary (regional) > outline (administrative)"
  - "Type badge always outline variant to visually distinguish from severity badge"

requirements-completed: [FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, FEED-06, UI-04]

# Metrics
duration: 15min
completed: 2026-03-12
---

# Phase 4 Plan 01: Digest Feed Foundation Summary

**Drizzle feed query layer with type/topic filters, parseSummary safe parser, and three presentational components (SeverityBadge, TypeBadge, FeedItemCard) backed by shadcn base-nova primitives**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-12T04:48:00Z
- **Completed:** 2026-03-12T04:53:00Z
- **Tasks:** 3
- **Files modified:** 9 created

## Accomplishments

- shadcn card, badge, select installed (base-nova style using @base-ui/react)
- FeedItem type, parseSummary utility, and FeedFilters interface established as feed data contracts
- getFeedItems and getItemById queries tested and type-safe with Drizzle
- 16 unit tests covering parseSummary edge cases and query filter combinations
- SeverityBadge, TypeBadge, FeedItemCard components ready for page assembly

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components and create feed types + queries** - `f17bff2` (feat)
2. **Task 2: Unit tests for feed queries and parseSummary** - `fc28ca4` (test)
3. **Task 3: Presentational components — SeverityBadge, TypeBadge, FeedItemCard** - `d63a02d` (feat)

**Plan metadata:** (docs: complete plan — pending)

## Files Created/Modified

- `src/features/feed/types.ts` - FeedItem type, parseSummary utility, FeedFilters interface
- `src/features/feed/queries.ts` - getFeedItems (filter by type/topic) and getItemById
- `src/features/feed/queries.test.ts` - 16 unit tests covering all edge cases
- `src/components/severity-badge.tsx` - Maps 3 severity levels to Badge variants
- `src/components/type-badge.tsx` - Maps 4 item types to human labels with fallback
- `src/components/feed-item-card.tsx` - Server component composing all feed card elements
- `src/components/ui/card.tsx` - shadcn Card, CardHeader, CardContent, CardFooter
- `src/components/ui/badge.tsx` - shadcn Badge with default/secondary/destructive/outline variants
- `src/components/ui/select.tsx` - shadcn Select (for future filter UI)

## Decisions Made

- FeedItem uses intersection type (`PolicyItem & { parsedSummary }`) rather than a mapped type — preserves the full DB type contract and adds the parsed domain field
- parseSummary checks for empty/whitespace before JSON.parse to avoid exceptions on blank DB values
- TypeBadge capitalizes unknown type strings as fallback — future-proof for new item types
- FeedItemCard is a server component (no `"use client"`) — Date formatted with `toLocaleDateString`
- `prefetch={false}` on title links to prevent 50-item prefetch storm on feed pages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Feed data layer complete: types, queries (tested), and UI components are ready for plan 02 (homepage) and plan 03 (detail page)
- FeedItemCard accepts `item: PolicyItem` and `parsedSummary: SummaryOutput | null` — pages call parseSummary(item.summary) before passing to card
- No blockers

## Self-Check: PASSED

All 10 expected files found on disk. All 3 task commits verified in git log.

---
*Phase: 04-digest-feed*
*Completed: 2026-03-12*
