---
phase: 04-digest-feed
plan: 02
subsystem: ui
tags: [nextjs, react, tailwind, shadcn, base-ui, server-components]

# Dependency graph
requires:
  - phase: 04-01
    provides: FeedItem type, parseSummary, getFeedItems, getItemById, FeedItemCard, SeverityBadge, TypeBadge, shadcn Select
  - phase: 01-foundation
    provides: ThemeToggle, Tailwind CSS, shadcn base-nova infrastructure
provides:
  - Homepage at / with live filterable government change feed
  - FilterBar client component with type/topic URL-based filter state
  - Item detail page at /item/[id] with structured patch-notes breakdown
  - generateMetadata for SEO on detail pages
  - 404 handling via notFound() for missing item IDs
affects:
  - End users (first user-facing product)
  - Phase 05 (digest email) — detail page URLs linkable from email digest

# Tech tracking
tech-stack:
  added: []
  patterns:
    - searchParams as Promise in Next.js 15+ server components — must await before use
    - params as Promise in Next.js 15+ — await in both generateMetadata and default export
    - Sentinel 'all' value maps to empty string in URL — avoids base-ui Select empty-string issues
    - Frosted-glass sticky header: bg-background/80 backdrop-blur border-b border-border
    - Monospace section labels: font-mono text-xs uppercase tracking-wider text-muted-foreground

key-files:
  created:
    - src/components/filter-bar.tsx
    - src/app/item/[id]/page.tsx
  modified:
    - src/app/page.tsx

key-decisions:
  - "FilterBar uses 'all' sentinel instead of empty string for Select value — base-ui Select's onValueChange returns string | null, sentinel avoids null/empty ambiguity"
  - "Detail page repeats sticky header pattern from homepage for consistent branding without shared layout nesting"
  - "Each section (whatChanged, whoAffected, whyItMatters) rendered in bordered cards for visual scan-ability — changelog metaphor"

# Metrics
duration: ~2min
completed: 2026-03-12
---

# Phase 4 Plan 02: Digest Feed UI Summary

**Homepage feed with URL-based type/topic filters and detail page with changelog-style structured summary breakdown — first user-facing product**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-12T04:52:28Z
- **Completed:** 2026-03-12T04:54:41Z
- **Tasks:** 2/3 complete (Task 3 is checkpoint:human-verify)
- **Files modified:** 2 created, 1 replaced

## Accomplishments

- Splash page replaced with async server component feed (no loading spinners — data pre-generated in DB)
- FilterBar client component with type/topic dropdowns updating URL via router.replace (scroll: false)
- Sticky frosted-glass header with PatchNotes branding and ThemeToggle on all pages
- Item detail page with SEO metadata, structured patch-notes sections, 404 handling
- All 46 tests still passing after changes
- TypeScript clean, Next.js build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Homepage feed page and FilterBar client component** - `c440146` (feat)
2. **Task 2: Item detail page with structured patch-notes layout** - `f6e59d2` (feat)
3. **Task 3: Verify feed and detail page UI** - CHECKPOINT (awaiting human verify)

## Files Created/Modified

- `src/app/page.tsx` - Replaced splash page with async feed; getFeedItems, FilterBar, FeedItemCard, empty state
- `src/components/filter-bar.tsx` - Client component; type/topic Select dropdowns; URL param state via router.replace
- `src/app/item/[id]/page.tsx` - Detail page; generateMetadata; whatChanged/whoAffected/whyItMatters sections; 404 via notFound()

## Decisions Made

- FilterBar uses `'all'` sentinel value instead of empty string — base-ui `onValueChange` returns `string | null`; mapping `'all'` to `''` in URL cleanly handles "no filter" state
- Detail page duplicates sticky header (rather than shared layout) — keeps routing simple and avoids layout nesting complexity
- `params` and `searchParams` both awaited as Promises — required by Next.js 15+ async server component API

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed base-ui Select onValueChange null type**
- **Found during:** Task 1
- **Issue:** `onValueChange` callback receives `string | null` (base-ui API), not `string`; TypeScript error TS2345
- **Fix:** Added null coalescing `value ?? 'all'` in both Select onValueChange handlers
- **Files modified:** `src/components/filter-bar.tsx`
- **Commit:** Included in `c440146`

## Issues Encountered

None beyond the auto-fixed type error.

## User Setup Required

None.

## Next Phase Readiness

- Homepage and detail page complete; checkpoint:human-verify required before marking plan complete
- After user approval, requirements FEED-01 through FEED-06 and UI-01 through UI-04 can be marked complete
- Phase 05 (digest email) can link directly to /item/[id] URLs

## Self-Check: PASSED

All 3 expected files found on disk. Both task commits verified in git log.

---
*Phase: 04-digest-feed*
*Completed: 2026-03-12*
