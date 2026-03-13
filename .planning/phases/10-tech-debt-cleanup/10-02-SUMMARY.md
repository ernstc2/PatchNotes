---
phase: 10-tech-debt-cleanup
plan: "02"
subsystem: infra
tags: [nextjs, middleware, edge-runtime, playwright, e2e-testing, better-auth]

# Dependency graph
requires:
  - phase: 06-user-accounts-personalization
    provides: auth.api.getSession pattern using better-auth
  - phase: 04-digest-feed
    provides: FilterBar component with type/topic/sort Select filters
provides:
  - Next.js Edge Runtime middleware protecting /profile and /onboarding routes
  - Behavioral E2E test suite for feed filter interaction and URL state verification
affects: [ci, e2e-testing, auth-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edge Runtime middleware: use request.headers directly (not await headers() from next/headers)"
    - "Playwright shadcn Select interaction: getByRole('combobox').filter({ hasText }) to locate trigger"

key-files:
  created:
    - src/middleware.ts
    - tests/e2e/feed-filters.spec.ts
  modified:
    - proxy.ts (deleted)

key-decisions:
  - "src/middleware.ts uses request.headers directly — next/headers is Node.js only and crashes Edge Runtime"
  - "Playwright combobox selector uses filter({ hasText }) not { name } — shadcn SelectTrigger has no accessible label, only inner text"
  - "When Select has an active value from URL params, shadcn renders raw value string (e.g. 'executive_order') not the label — test selectors account for this"

patterns-established:
  - "Playwright shadcn Select: getByRole('combobox').filter({ hasText: 'placeholder' }).click() then getByRole('option', { name: 'Label' }).click()"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 10 Plan 02: Middleware Fix and Feed Filter E2E Tests Summary

**Next.js Edge Runtime middleware replacing dead proxy.ts (wrong filename/export), plus 5 behavioral Playwright tests verifying filter-to-URL state changes on the feed page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T02:34:12Z
- **Completed:** 2026-03-13T02:37:30Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 1 deleted, 1 created)

## Accomplishments
- Deleted proxy.ts (dead code — Next.js ignored it due to wrong filename and export name `proxy` instead of `middleware`)
- Created src/middleware.ts with correct `middleware` export, Edge Runtime-safe `request.headers` usage, and `/profile`/`/onboarding` matcher
- Created feed-filters.spec.ts with 5 behavioral E2E tests that click shadcn Select components and assert URL query param changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace proxy.ts with working src/middleware.ts** - `de11b20` (feat)
2. **Task 2: Add behavioral E2E tests for feed filter interaction** - `8a2ca77` (feat)

## Files Created/Modified
- `src/middleware.ts` - Next.js Edge Runtime middleware protecting /profile and /onboarding routes
- `tests/e2e/feed-filters.spec.ts` - 5 behavioral E2E tests for type/topic/sort filter interaction and URL state verification
- `proxy.ts` - Deleted (was dead code in project root with wrong export name)

## Decisions Made
- `request.headers` used directly instead of `await headers()` from next/headers — the latter is Node.js only and crashes Edge Runtime
- Playwright selector strategy discovered via debug test: shadcn SelectTrigger has no accessible label, so `getByRole('combobox', { name: /Type/i })` fails; `getByRole('combobox').filter({ hasText: 'Type' })` works
- When a Select has an active URL param value (e.g. `?type=executive_order`), shadcn renders the raw value string as the trigger text, not the display label — test for "type filter clears URL" locates by `hasText: 'executive_order'`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Playwright selector strategy for shadcn Select triggers**
- **Found during:** Task 2 (add behavioral E2E tests)
- **Issue:** Plan specified `getByRole('combobox', { name: /Type/i })` but shadcn SelectTrigger has no accessible name attribute — only inner text. All 5 tests timed out.
- **Fix:** Used `getByRole('combobox').filter({ hasText: 'Type' })` pattern instead. Also discovered that active Select values render as raw value strings (e.g. `executive_order`) not display labels.
- **Files modified:** tests/e2e/feed-filters.spec.ts
- **Verification:** All 5 new tests + all 5 existing tests pass (10/10)
- **Committed in:** 8a2ca77 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — incorrect selector strategy in plan)
**Impact on plan:** Auto-fix necessary for tests to pass. No scope change, all planned tests written.

## Issues Encountered
- Pre-existing TypeScript errors in `src/features/feed/queries.test.ts` (`topics` vs `topic` typo). These existed before this plan's changes and are out of scope. Logged to deferred-items.

## Next Phase Readiness
- Middleware is live and will protect /profile and /onboarding routes on next deploy
- E2E test suite now has behavioral interaction coverage in addition to smoke-level render checks
- All 10 E2E tests pass

---
*Phase: 10-tech-debt-cleanup*
*Completed: 2026-03-13*
