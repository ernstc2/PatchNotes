---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [nextjs, typescript, tailwind, shadcn, drizzle, neon, postgres, next-themes]

# Dependency graph
requires: []
provides:
  - Next.js 16 App Router project with TypeScript and Tailwind CSS v4
  - Drizzle ORM client singleton connected to Neon Postgres via HTTP driver
  - system_status table schema with UUID PK (health check table)
  - Dark mode infrastructure via next-themes ThemeProvider
  - Health check API route at /api/health
  - shadcn/ui component library initialized with button component
affects: [02-ingestion, 03-ai, 04-digest, 05-search, 06-auth, 07-email, 08-deploy]

# Tech tracking
tech-stack:
  added:
    - next@16.1.6
    - react@19.2.3
    - typescript@5
    - tailwindcss@4 (CSS-first config, no tailwind.config.ts)
    - drizzle-orm@0.45.1
    - "@neondatabase/serverless@1.0.2"
    - next-themes@0.4.6
    - drizzle-kit@0.31.9
    - shadcn/ui (base-nova style, Tailwind v4 compatible)
    - clsx + tailwind-merge (via shadcn)
    - lucide-react
  patterns:
    - Drizzle DB client as lazy-loading singleton with Proxy pattern
    - ThemeProvider wrapping root layout with class attribute strategy
    - snake_case column names via Drizzle casing option
    - src/ directory structure with App Router

key-files:
  created:
    - src/lib/db/index.ts
    - src/lib/db/schema/system.ts
    - src/lib/db/schema/index.ts
    - src/app/api/health/route.ts
    - src/components/theme-provider.tsx
    - src/components/ui/button.tsx
    - src/lib/utils.ts
    - src/features/.gitkeep
    - drizzle.config.ts
    - .env.example
    - components.json
  modified:
    - package.json
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "Tailwind v4 CSS-first config (no tailwind.config.ts) — scaffolded by create-next-app, shadcn/ui supports both v3 and v4"
  - "DB client uses lazy-loading Proxy singleton pattern to avoid DATABASE_URL errors at import time in serverless"
  - "Health route uses force-dynamic to ensure it queries DB on every request instead of being statically cached"

patterns-established:
  - "DB singleton: export const db = Proxy wrapping lazy-initialized NeonHttpDatabase"
  - "Schema: each domain gets its own schema file, barrel-exported from src/lib/db/schema/index.ts"
  - "API routes: use Response.json() directly, not NextResponse"
  - "Dark mode: ThemeProvider attribute='class' with defaultTheme='system'"

requirements-completed: [INFRA-03, INFRA-05]

# Metrics
duration: 7min
completed: "2026-03-11"
---

# Phase 1 Plan 01: Next.js Foundation Summary

**Next.js 16 App Router scaffolded with Tailwind v4, shadcn/ui, Drizzle ORM on Neon Postgres, dark mode ThemeProvider, and /api/health endpoint — full build passes with zero TypeScript errors**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-11T22:00:38Z
- **Completed:** 2026-03-11T22:07:52Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Scaffolded Next.js 16 with TypeScript, Tailwind CSS v4, ESLint, App Router, Turbopack
- Initialized shadcn/ui with base-nova style, CSS variables, cn() utility
- Created Drizzle schema for system_status health-check table with UUID PK
- Created Drizzle DB client singleton with Neon HTTP driver and lazy initialization
- Created /api/health route querying system_status with error handling
- Wired next-themes ThemeProvider in root layout with class attribute strategy
- Added db:generate/migrate/studio/push npm scripts, drizzle.config.ts, .env.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project and install all dependencies** - `4dcf8b4` (feat)
2. **Task 2: Create Drizzle schema, database client, and health API route** - `ef8f704` (feat)

**Plan metadata:** (docs commit - see below)

## Files Created/Modified
- `src/lib/db/index.ts` - Drizzle client singleton with Neon HTTP driver, lazy Proxy pattern
- `src/lib/db/schema/system.ts` - system_status table: UUID PK, service, status, message, checkedAt
- `src/lib/db/schema/index.ts` - Schema barrel export
- `src/app/api/health/route.ts` - GET endpoint querying system_status, returns JSON status
- `src/components/theme-provider.tsx` - next-themes ThemeProvider wrapper (use client)
- `src/components/ui/button.tsx` - shadcn/ui Button component
- `src/lib/utils.ts` - cn() utility (clsx + tailwind-merge)
- `drizzle.config.ts` - Drizzle Kit config pointing to Neon Postgres
- `.env.example` - Documents DATABASE_URL environment variable
- `package.json` - Added db:* scripts, updated name to patchnotes
- `src/app/layout.tsx` - Inter font, ThemeProvider, PatchNotes metadata, suppressHydrationWarning
- `src/app/globals.css` - shadcn/ui CSS variable tokens for light/dark mode (Tailwind v4)

## Decisions Made
- Tailwind v4 CSS-first config: create-next-app scaffolded with v4 (no tailwind.config.ts). shadcn/ui supports both v3 and v4; proceeded as planned.
- DB client lazy-loading Proxy pattern: avoids DATABASE_URL runtime errors at import time in serverless contexts (better than a simple `const sql = neon(process.env.DATABASE_URL!)` at module load).
- Health route `force-dynamic`: prevents Next.js from statically caching the health endpoint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] DB client lazy-loading with DATABASE_URL validation**
- **Found during:** Task 2 (DB client creation)
- **Issue:** Plan's simple `const sql = neon(process.env.DATABASE_URL!)` would throw at import time in environments without DATABASE_URL set (build time, other API routes during static generation)
- **Fix:** Wrapped initialization in `getDb()` function with explicit error, exported `db` as Proxy that calls `getDb()` on first use
- **Files modified:** src/lib/db/index.ts
- **Verification:** tsc --noEmit passes, npm run build succeeds
- **Committed in:** ef8f704 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added force-dynamic to health route**
- **Found during:** Task 2 (health API route creation)
- **Issue:** Without force-dynamic, Next.js may attempt to statically render /api/health at build time when DATABASE_URL is unavailable
- **Fix:** Added `export const dynamic = 'force-dynamic'`
- **Files modified:** src/app/api/health/route.ts
- **Verification:** Route shows as (Dynamic) in build output
- **Committed in:** ef8f704 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 - missing critical)
**Impact on plan:** Both fixes prevent runtime errors in serverless/build environments. No scope creep.

## Issues Encountered
- `create-next-app` rejected the `PatchNotes` directory name (capital letters in npm package names). Scaffolded to `patchnotes-temp`, copied files, cleaned up temp directory.
- Tailwind v4 installed (CSS-first, no tailwind.config.ts) instead of v3. shadcn/ui compatible — proceeded per plan guidance.

## User Setup Required

Database connection required before using the health endpoint or running migrations:

1. Create a Neon database at https://neon.tech (free tier)
2. Copy connection string to `.env.local`: `DATABASE_URL=postgresql://...`
3. Run `npm run db:push` to create the system_status table
4. Visit `/api/health` to verify database connectivity

## Next Phase Readiness
- Foundation complete — all subsequent phases can import from `@/lib/db` and `@/lib/db/schema`
- Schema pattern established: add new tables to `src/lib/db/schema/`, export from barrel
- No blockers for Phase 1 Plan 02 (landing page / initial UI)

## Self-Check: PASSED

All required files verified present:
- src/lib/db/index.ts: FOUND
- src/lib/db/schema/system.ts: FOUND
- src/lib/db/schema/index.ts: FOUND
- src/app/api/health/route.ts: FOUND
- src/components/theme-provider.tsx: FOUND
- drizzle.config.ts: FOUND
- .env.example: FOUND

All task commits verified:
- 4dcf8b4: feat(01-01): scaffold Next.js project with dependencies and config — FOUND
- ef8f704: feat(01-01): add Drizzle schema, DB client singleton, and health API route — FOUND

---
*Phase: 01-foundation*
*Completed: 2026-03-11*
