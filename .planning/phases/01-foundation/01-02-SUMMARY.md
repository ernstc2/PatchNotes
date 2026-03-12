---
phase: 01-foundation
plan: 02
subsystem: ui, infra
tags: [next.js, tailwind, shadcn, next-themes, github-actions, ci, dark-mode, landing-page]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: ThemeProvider, /api/health route, shadcn Button, db client, layout.tsx

provides:
  - Landing page with PatchNotes branding, tagline, and version badge
  - Dark mode toggle component (ThemeToggle) using useSyncExternalStore for hydration safety
  - DB connection status indicator (DbStatus) fetching /api/health
  - GitHub Actions CI workflow with tsc, lint, and build steps

affects: [all phases - CI pipeline gates all future pushes to main]

# Tech tracking
tech-stack:
  added: [github-actions, next-themes useTheme hook]
  patterns: [useSyncExternalStore for client-only hydration-safe rendering, lazy DB proxy singleton]

key-files:
  created:
    - src/components/theme-toggle.tsx
    - src/components/db-status.tsx
    - .github/workflows/ci.yml
  modified:
    - src/app/page.tsx

key-decisions:
  - "Used useSyncExternalStore instead of useEffect+setState for mounted detection to satisfy react-hooks/set-state-in-effect lint rule"
  - "DbStatus as separate client component so server page.tsx stays a server component"
  - "CI workflow triggers on both push to main and pull_request to main"

patterns-established:
  - "Client-only rendering pattern: useSyncExternalStore with server snapshot returning false"
  - "DB lazy proxy singleton: Proxy wrapping getDb() so module-level export doesn't trigger DATABASE_URL check at build time"

requirements-completed: [INFRA-01, INFRA-05]

# Metrics
duration: 25min
completed: 2026-03-11
---

# Phase 1 Plan 02: Landing Page, Dark Mode, and CI Summary

**Next.js landing page with PatchNotes branding, hydration-safe dark mode toggle, DB status indicator, and GitHub Actions CI pipeline wired to DATABASE_URL secret**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-11T00:00:00Z
- **Completed:** 2026-03-11
- **Tasks:** 1 of 2 (Task 2 is human-verify checkpoint — awaiting user verification)
- **Files modified:** 4

## Accomplishments
- PatchNotes landing page with name, tagline "A changelog for your government", v1.0-dev badge
- ThemeToggle component using `useSyncExternalStore` — avoids hydration mismatch without triggering lint errors
- DbStatus client component fetches `/api/health` and shows green "Connected" or red "Disconnected"
- GitHub Actions CI workflow: type-check (tsc --noEmit), lint, build — all steps pass locally

## Task Commits

Each task was committed atomically:

1. **Task 1: Build landing page, theme toggle, DB status, CI workflow** - `91752ec` (feat)

**Plan metadata:** pending (after human verify checkpoint)

## Files Created/Modified
- `src/app/page.tsx` - Landing page: PatchNotes name, tagline, version badge, ThemeToggle, DbStatus
- `src/components/theme-toggle.tsx` - Dark mode toggle using useTheme + useSyncExternalStore for hydration safety
- `src/components/db-status.tsx` - Client component fetching /api/health, showing connection status with colored dot
- `.github/workflows/ci.yml` - CI pipeline: checkout, setup-node@v4, npm ci, tsc --noEmit, lint, build

## Decisions Made
- Used `useSyncExternalStore` for mount detection instead of `useEffect + setState` — satisfies the `react-hooks/set-state-in-effect` lint rule while achieving the same hydration safety
- Kept `DbStatus` as a separate client component so the top-level `page.tsx` remains a server component
- CI uses `DATABASE_URL: ${{ secrets.DATABASE_URL }}` — build won't attempt DB connection (lazy proxy ensures that), but the secret is available if needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Build failed: DB client instantiated at module load without DATABASE_URL**
- **Found during:** Task 1 (full build verification)
- **Issue:** `export const db = drizzle(...)` called `neon(process.env.DATABASE_URL!)` at module load time, causing build to fail with "No database connection string provided"
- **Fix:** Implemented lazy Proxy singleton — `getDb()` defers instantiation until first method call; module-level `db` export is a Proxy that calls `getDb()` on access
- **Files modified:** `src/lib/db/index.ts`
- **Verification:** `npm run build` passes without DATABASE_URL in environment
- **Committed in:** ef8f704 (plan 01-01 Task 2 commit, already in repo)

**2. [Rule 1 - Bug] Lint error: setState called synchronously in useEffect**
- **Found during:** Task 1 (lint run)
- **Issue:** Standard `mounted` pattern using `useEffect(() => setMounted(true), [])` triggered `react-hooks/set-state-in-effect` ESLint error
- **Fix:** Replaced with `useSyncExternalStore` — server snapshot returns `false` (unmounted), client snapshot returns `true` (mounted), no setState needed
- **Files modified:** `src/components/theme-toggle.tsx`
- **Verification:** `npm run lint` passes with 0 errors
- **Committed in:** 91752ec (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs)
**Impact on plan:** Both fixes necessary for build/lint to pass. No scope creep.

## Issues Encountered
- Next.js create-next-app failed when run in the "PatchNotes" directory due to npm naming restrictions (capital letters). Scaffolded into a temp directory and copied files across. No impact on final output.

## User Setup Required

Before the app is fully functional, you need to:

1. **Create a free Neon account** at [neon.tech](https://neon.tech)
2. **Create a new project** (free tier: 0.5 GB storage)
3. **Copy the pooled connection string**
4. **Create `.env.local`** in project root:
   ```
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```
5. **Run initial migration:**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```
6. **Run dev server:** `npm run dev` — visit http://localhost:3000
7. **Connect repo to Vercel** at [vercel.com](https://vercel.com)
8. **Add DATABASE_URL** to Vercel Environment Variables (Settings > Environment Variables)
9. **Add DATABASE_URL** as a GitHub Actions secret (Settings > Secrets > Actions)

## Next Phase Readiness
- Task 2 (human-verify checkpoint) pending — user must verify: local dev server shows landing page, DB status green, Vercel deployment live, GitHub Actions CI passing
- Once verified, Phase 1 is complete and Phase 2 (data ingestion) can begin

---
*Phase: 01-foundation*
*Completed: 2026-03-11*
