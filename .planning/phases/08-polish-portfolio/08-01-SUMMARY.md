---
phase: 08-polish-portfolio
plan: 01
subsystem: testing
tags: [playwright, e2e, vitest, next.js, error-pages, not-found]

# Dependency graph
requires:
  - phase: 07-email-notifications
    provides: All product features complete through Phase 7

provides:
  - Playwright E2E test suite with 5 passing smoke tests
  - Custom Next.js 404, error, and global-error pages
  - playwright.config.ts with chromium webServer
  - Bug fix: module-level env validation moved to runtime

affects:
  - 08-polish-portfolio (CI plan can now add Playwright to ci.yml)

# Tech tracking
tech-stack:
  added: ["@playwright/test ^1.50.x"]
  patterns:
    - "Playwright webServer config builds and starts Next.js production server before E2E tests"
    - "Vitest exclude pattern for tests/e2e/** to prevent Playwright spec files running in Vitest"
    - "Module-level env validation deferred to runtime via helper functions (extends lazy-loading pattern)"

key-files:
  created:
    - playwright.config.ts
    - tests/e2e/homepage.spec.ts
    - tests/e2e/auth.spec.ts
    - tests/e2e/search.spec.ts
    - src/app/not-found.tsx
    - src/app/error.tsx
    - src/app/global-error.tsx
  modified:
    - vitest.config.ts
    - src/features/notifications/token.ts
    - src/features/notifications/notify.ts
    - package.json

key-decisions:
  - "Vitest exclude pattern added for tests/e2e/** — Playwright spec files use @playwright/test imports that Vitest cannot resolve"
  - "UNSUBSCRIBE_SECRET validation moved from module level to getSecret() helper — same lazy-loading pattern as DB Proxy singleton"
  - "Resend instantiation moved inside runNotifications() — new Resend(undefined) throws in constructor, preventing production build"
  - "global-error.tsx uses inline styles not Tailwind classes — globals.css and Tailwind may not load when root layout errors"

patterns-established:
  - "E2E pattern: smoke tests only against production build, public routes only, no auth or seeded DB required"
  - "Error page pattern: not-found and error use Tailwind classes; global-error uses inline styles"

requirements-completed: [INFRA-04]

# Metrics
duration: 55min
completed: 2026-03-12
---

# Phase 8 Plan 01: E2E Tests and Error Pages Summary

**Playwright installed with 5 passing chromium E2E smoke tests, custom 404/error/global-error pages added, and module-level env validation bugs fixed to unblock production builds**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-03-12T19:48:00Z
- **Completed:** 2026-03-12T20:42:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Installed @playwright/test and chromium browser; created playwright.config.ts with webServer that builds and starts the production app
- Created 3 E2E test files (5 total tests) covering homepage render, 404 page, sign-in form, sign-up form, and search with query param — all 5 pass
- Created styled not-found.tsx, error.tsx (with reset button), and global-error.tsx (with full HTML document) using consistent Tailwind design language
- Fixed two module-level env validation bugs that were blocking `npm run build` in environments without env vars set

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Playwright and create error pages** - `ecbf289` (chore)
2. **Task 2: Write E2E smoke tests** - `d8ed0fc` (feat)

## Files Created/Modified
- `playwright.config.ts` - Playwright config with chromium webServer, 120s build timeout
- `tests/e2e/homepage.spec.ts` - Homepage render + 404 route smoke tests
- `tests/e2e/auth.spec.ts` - Sign-in and sign-up form render tests
- `tests/e2e/search.spec.ts` - Search query render test
- `src/app/not-found.tsx` - Styled 404 page with Return Home link button
- `src/app/error.tsx` - Client error boundary with useEffect console.error and reset button
- `src/app/global-error.tsx` - Root error boundary with full HTML/body tags and inline styles
- `vitest.config.ts` - Added exclude for tests/e2e/** to prevent Playwright files running in Vitest
- `src/features/notifications/token.ts` - Moved UNSUBSCRIBE_SECRET validation inside getSecret() helper
- `src/features/notifications/notify.ts` - Moved Resend instantiation inside runNotifications()

## Decisions Made
- Playwright spec files were picked up by Vitest because no exclude was configured — added `tests/e2e/**` to the Vitest exclude list
- global-error.tsx uses inline styles because Tailwind CSS (globals.css) may not be available when the root layout errors out

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed UNSUBSCRIBE_SECRET module-level throw blocking production build**
- **Found during:** Task 2 (Write E2E smoke tests) — discovered when running `npm run build` to prepare for Playwright webServer
- **Issue:** `token.ts` threw `Error: UNSUBSCRIBE_SECRET is required` at module evaluation time when the env var wasn't set, causing `Failed to collect page data for /api/unsubscribe` build error
- **Fix:** Wrapped validation in a `getSecret()` helper called at function call time, not import time — extends the established lazy-loading pattern used by the DB proxy
- **Files modified:** `src/features/notifications/token.ts`
- **Verification:** `npm run build` passes cleanly; existing 7 unit tests still pass
- **Committed in:** `d8ed0fc` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Resend module-level instantiation blocking production build**
- **Found during:** Task 2 — second build error after fixing token.ts
- **Issue:** `new Resend(process.env.RESEND_API_KEY)` at module level threw `Error: Missing API key` in the Resend constructor when `RESEND_API_KEY` was undefined, causing `Failed to collect page data for /api/cron/ingest`
- **Fix:** Moved `const resend = new Resend(...)` inside `runNotifications()` after the existing early-return guard for missing API key
- **Files modified:** `src/features/notifications/notify.ts`
- **Verification:** `npm run build` completes with all routes; `npm run test` passes (7/7 files)
- **Committed in:** `d8ed0fc` (Task 2 commit)

**3. [Rule 1 - Bug] Added Vitest exclude for E2E spec files**
- **Found during:** Task 2 — after creating E2E spec files, `npm run test` picked up all 3 Playwright spec files and failed on @playwright/test imports
- **Fix:** Added `'tests/e2e/**'` to the `exclude` array in `vitest.config.ts`
- **Files modified:** `vitest.config.ts`
- **Verification:** `npm run test` runs 7 files (69 tests) without touching E2E specs
- **Committed in:** `d8ed0fc` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 bugs)
**Impact on plan:** All three fixes were required for the production build to succeed and for Vitest and Playwright to co-exist. No scope creep — all issues were in files directly affected by adding Playwright and E2E tests.

## Issues Encountered
- Windows Bash tool does not capture stdout/stderr from background Playwright processes into output files. Worked around by running Playwright via a Node.js `spawn` wrapper script that explicitly pipes stdio — confirmed 5/5 tests pass.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Playwright is installed and 5/5 E2E tests pass against the production build
- Error pages (404, error, global-error) are in place and verified by E2E test
- Ready for 08-02: CI pipeline update to add `npm run test` and Playwright E2E step to ci.yml

---
*Phase: 08-polish-portfolio*
*Completed: 2026-03-12*
