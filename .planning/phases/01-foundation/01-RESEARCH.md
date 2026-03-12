# Phase 1: Foundation - Research

**Researched:** 2026-03-11
**Domain:** Next.js 16 App Router, Drizzle ORM + Neon Postgres, shadcn/ui, GitHub Actions CI, Vercel Hobby deployment
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Next.js App Router (not Pages Router)
- Feature-based code organization: `src/features/feed/`, `src/features/search/`, `src/features/auth/` etc.
- All application code under `src/` directory — root stays clean for config files
- Single package (not monorepo) — one package.json, one deployable
- `src/app/` contains only routes; business logic lives in `src/features/` and `src/lib/`
- Shared UI components in `src/components/`
- Tailwind CSS for all styling
- shadcn/ui for pre-built accessible components (Button, Card, Badge, Dialog, etc.)
- Color palette: zinc/slate neutrals with blue accent (`blue-600` light / `blue-400` dark)
- Inter font via `next/font` — clean, professional, readable
- Dark mode infrastructure set up from Phase 1 (Tailwind `dark:` variant)
- Drizzle ORM with per-domain schema files: `src/lib/db/schema/items.ts`, `users.ts`, etc.
- Schema index file re-exports all tables
- Initial migration: a `system_status` health-check table (proves migrations work end-to-end)
- snake_case for all table and column names (Postgres convention; Drizzle maps to camelCase in TS)
- UUID primary keys on all tables
- Migrations directory: `src/lib/db/migrations/`
- Vercel deployment via GitHub integration (push to main = deploy)
- Neon Postgres via connection string in environment variables
- No secrets in repo — all credentials via env vars

### Claude's Discretion
- Exact landing page layout and visual design
- ESLint/Prettier configuration details
- GitHub Actions workflow specifics
- next.config.ts settings
- Drizzle config file setup
- Health-check table exact schema

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | App is deployed and publicly accessible with a real URL | Vercel Hobby free tier, GitHub integration, `push to main = deploy` pattern |
| INFRA-03 | App uses TypeScript throughout | `create-next-app` with `--typescript`, `tsc --noEmit` in CI, Next.js 16 built-in TS support |
| INFRA-05 | All services run on free tiers ($0 total cost) | Vercel Hobby (free), Neon free tier (0.5 GB storage, 100 CU-hours/month), no paid services |
</phase_requirements>

---

## Summary

Phase 1 establishes the complete infrastructure stack: Next.js 16 on Vercel, Neon Postgres accessed via Drizzle ORM, TypeScript enforcement, and a GitHub Actions CI pipeline. This is a greenfield setup — the old project (vanilla JS + Express + MongoDB) is being discarded entirely.

The stack is mature and well-documented. Next.js 16 (released October 2025, current stable as of March 2026) uses Turbopack as the default bundler and ships with React 19. The `create-next-app` scaffolding handles TypeScript, Tailwind, ESLint, App Router, and src-directory layout in a single command. Drizzle ORM with the `@neondatabase/serverless` HTTP driver is the standard pairing for Neon Postgres on Vercel serverless. shadcn/ui works with Next.js 16 + React 19 via the `npx shadcn@latest init` CLI.

The key risk is the Tailwind v3 vs v4 decision: shadcn/ui supports both, but v4 uses CSS-first configuration (no `tailwind.config.js`) and may have edge-case compatibility issues with some shadcn components. v3 is more stable for new projects and remains the default when running `create-next-app`. Given portfolio quality requirements, the recommendation is Tailwind v3 (stable, widely documented) unless shadcn/ui has fully migrated to v4 by implementation time.

**Primary recommendation:** Scaffold with `npx create-next-app@latest` using defaults (TypeScript, Tailwind v3, ESLint, App Router, src dir, Turbopack), then add shadcn/ui, Drizzle + Neon, next-themes, and Inter font. Establish the full directory structure before writing any product code.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.x (latest stable) | React framework with App Router, server components, routing | Deployed decision; Vercel's own framework |
| react / react-dom | 19.x | UI rendering | Bundled with Next.js 16 |
| typescript | 5.x | Static typing throughout | Locked decision; Next.js 16 has first-class support |
| tailwindcss | 3.x (recommended) | Utility CSS | Locked decision; v3 is stable default for shadcn/ui |
| @shadcn/ui | latest (CLI-driven) | Pre-built accessible UI components | Locked decision; components are copied into project, not versioned |
| drizzle-orm | latest | Type-safe ORM for Postgres | Locked decision; serverless-friendly, TypeScript-native |
| drizzle-kit | latest | Migration generation and running | Paired with drizzle-orm; CLI tooling |
| @neondatabase/serverless | latest | Neon HTTP driver for Vercel serverless | Required for Neon + serverless; avoids WebSocket issues |
| next-themes | latest | Dark mode toggle without flash | Standard pairing with shadcn/ui for App Router dark mode |
| dotenv | latest | Load .env in drizzle.config.ts | Required for drizzle-kit CLI to read DATABASE_URL |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @next/font (built-in) | built into Next.js | Inter font loading with display-swap | For `next/font/google` Inter setup |
| clsx / tailwind-merge | latest | `cn()` utility for conditional classes | Installed automatically by shadcn/ui init |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v3 | Tailwind v4 | v4 uses CSS-first config (no tailwind.config.js); shadcn/ui has some edge-case issues with v4; v3 is stable default — use v3 for portfolio stability |
| Drizzle ORM | Prisma | Prisma requires a query engine binary; Drizzle is pure TypeScript, lighter for serverless |
| Neon HTTP driver | Neon WebSocket driver | HTTP driver works on all Vercel serverless functions; WebSocket driver can time out in edge runtime |
| ESLint | Biome | Biome is faster but has fewer rules; ESLint is better documented and more commonly understood |

**Installation (after scaffolding):**
```bash
# ORM + Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit dotenv tsx

# Dark mode
npm install next-themes

# shadcn/ui (interactive init, adds components.json, cn utility, globals.css tokens)
npx shadcn@latest init
```

---

## Architecture Patterns

### Recommended Project Structure
```
patchnotes/
├── src/
│   ├── app/                    # Next.js App Router: routes ONLY
│   │   ├── layout.tsx          # Root layout with ThemeProvider, Inter font
│   │   ├── page.tsx            # Landing page (placeholder)
│   │   └── globals.css         # Tailwind directives + shadcn/ui CSS vars
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # shadcn/ui copied components (Button, Card, etc.)
│   │   └── theme-provider.tsx  # next-themes ThemeProvider wrapper (client)
│   ├── features/               # Future feature domains (feed, search, auth)
│   └── lib/
│       └── db/
│           ├── index.ts        # Drizzle client singleton
│           ├── migrations/     # drizzle-kit generated SQL migrations
│           └── schema/
│               ├── index.ts    # Re-exports all table definitions
│               └── system.ts   # system_status health-check table
├── drizzle.config.ts           # Drizzle Kit config (schema path, migrations out, dialect)
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config (paths: @/*)
├── eslint.config.mjs           # ESLint config (generated by create-next-app)
├── tailwind.config.ts          # Tailwind config (v3)
├── .env.local                  # Local secrets (git-ignored)
├── .env.example                # Documented env var template (committed)
└── .github/
    └── workflows/
        └── ci.yml              # Type check + lint + build on every push
```

### Pattern 1: Drizzle Client Singleton for Next.js

Drizzle with Neon HTTP driver must be initialized once and exported. In Next.js serverless environments, avoid creating a new connection per request.

```typescript
// Source: https://orm.drizzle.team/docs/get-started/neon-new
// src/lib/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema, casing: 'snake_case' });
```

The `casing: 'snake_case'` option tells Drizzle to map camelCase TypeScript property names to snake_case database columns automatically — no per-column aliases needed.

### Pattern 2: Schema Definition with UUID PKs

```typescript
// Source: https://orm.drizzle.team/docs/sql-schema-declaration
// src/lib/db/schema/system.ts
import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

export const systemStatus = pgTable('system_status', {
  id: uuid().primaryKey().defaultRandom(),
  service: text().notNull(),
  status: text().notNull(),
  checkedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
```

Note: `defaultRandom()` uses `gen_random_uuid()` under the hood — no need to call `sql\`gen_random_uuid()\`` manually.

### Pattern 3: Dark Mode with next-themes (App Router)

App Router requires a client-side ThemeProvider wrapper. The `suppressHydrationWarning` on `<html>` prevents React from warning about server/client class mismatch during hydration.

```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/next
// src/components/theme-provider.tsx
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// src/app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Pattern 4: Drizzle Config File

```typescript
// Source: https://orm.drizzle.team/docs/get-started/neon-new
// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/lib/db/migrations',
  schema: './src/lib/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Pattern 5: GitHub Actions CI Workflow

```yaml
# Source: Next.js CI best practices, 2025-2026
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run build
    env:
      # Build requires DATABASE_URL to be set (even if Neon unreachable at build time)
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Pattern 6: .env.example (committed, .env.local git-ignored)

```bash
# .env.example — commit this; document all required env vars
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

```bash
# .gitignore additions
.env
.env.local
.env.*.local
```

### Anti-Patterns to Avoid
- **Drizzle client inside React components:** Creates a new Neon HTTP connection per render. Export a singleton from `src/lib/db/index.ts`.
- **Secrets in next.config.ts or committed .env files:** All credentials must flow through environment variables. Use `.env.local` locally, Vercel Environment Variables in production.
- **Skipping `suppressHydrationWarning` on `<html>`:** Next-themes modifies the class attribute server-to-client; without this prop, React will warn on every page load.
- **Using `next lint` command:** Deprecated in Next.js 15.5, removed in Next.js 16. Use `eslint` directly via `npm run lint`.
- **Running migrations at app startup:** Run migrations as a separate step (`npx drizzle-kit migrate`) in CI or deployment hooks — not inside `getServerSideProps` or route handlers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dark mode toggle without flash | Custom cookie/localStorage reader | `next-themes` | Handles SSR hydration mismatch, respects system preference, no flash |
| Class name merging | Custom string concatenation | `cn()` from `lib/utils` (clsx + tailwind-merge) | shadcn/ui generates this automatically; handles Tailwind class conflicts |
| Accessible UI components | Custom Button, Dialog, Badge | shadcn/ui components | Radix UI primitives underneath handle a11y, focus trapping, keyboard nav |
| DB schema migrations | Manual SQL files | `drizzle-kit generate` + `drizzle-kit migrate` | Drizzle tracks schema snapshots, generates correct diffs |
| UUID generation | `crypto.randomUUID()` in app code | `uuid().defaultRandom()` in schema | Delegated to Postgres `gen_random_uuid()` — safer, no app-layer dependency |
| camelCase ↔ snake_case mapping | Custom transform functions | `casing: 'snake_case'` in drizzle client | Built-in to Drizzle, zero friction |

**Key insight:** The entire UI primitive layer (buttons, cards, dialogs, badges) is solved by shadcn/ui + Radix. The database schema evolution problem is solved by drizzle-kit. Building either from scratch introduces accessibility bugs and migration conflicts that compound across phases.

---

## Common Pitfalls

### Pitfall 1: DATABASE_URL not available during Vercel build
**What goes wrong:** `npm run build` on Vercel pulls env vars from Vercel's Environment Variables settings, but if DATABASE_URL is missing, the build fails with a crypto/connection error.
**Why it happens:** Drizzle schema is imported at build time for TypeScript inference; if the client is instantiated at module level, it tries to connect during bundling.
**How to avoid:** The Drizzle Neon HTTP client only connects when a query is actually run, not at instantiation. Keep `const db = drizzle(...)` lazy (module-level is fine — Neon HTTP is lazy). Add DATABASE_URL to Vercel's Environment Variables (Settings > Environment Variables) before first deploy.
**Warning signs:** Build error mentioning "neon" or "DATABASE_URL" — check Vercel env var configuration.

### Pitfall 2: React 19 peer dependency conflicts with shadcn/ui components
**What goes wrong:** `npm install` shows peer dependency warnings or errors for some shadcn/ui component packages that haven't updated their peerDependencies to include React 19.
**Why it happens:** Component authors declare `"react": "^18"` in peerDependencies; npm 7+ treats this as an error by default.
**How to avoid:** Use `--legacy-peer-deps` flag when installing shadcn components: `npx shadcn@latest add button --legacy-peer-deps`. Alternatively, pnpm/bun handle this more gracefully.
**Warning signs:** `npm error ERESOLVE` during `npx shadcn@latest add`.

### Pitfall 3: Tailwind dark mode class not applied on first render
**What goes wrong:** Page flashes light mode before switching to dark, even with `defaultTheme="dark"`.
**Why it happens:** ThemeProvider is client-side; the server renders without knowing the theme. Without `suppressHydrationWarning`, React warns. Without `disableTransitionOnChange`, CSS transitions fire on initial load.
**How to avoid:** Use `suppressHydrationWarning` on `<html>`, set `attribute="class"` on ThemeProvider, and set `disableTransitionOnChange`. This is exactly the pattern in the shadcn/ui dark mode docs.
**Warning signs:** Flash of wrong theme on page load, or React hydration warnings in browser console.

### Pitfall 4: Drizzle migrations out-of-sync with schema
**What goes wrong:** Developer edits schema file but doesn't run `drizzle-kit generate` — migrations directory diverges from actual schema.
**Why it happens:** There's no auto-migration; Drizzle requires explicit `drizzle-kit generate` to snapshot changes.
**How to avoid:** Treat migrations as source-controlled artifacts. Always run `npx drizzle-kit generate` after any schema change, commit the generated SQL. Add a CI step or npm script: `"db:generate": "drizzle-kit generate"`.
**Warning signs:** `drizzle-kit push` reports unexpected differences; production Postgres columns don't match TypeScript schema.

### Pitfall 5: Vercel Hobby plan restriction on GitHub org repos
**What goes wrong:** Attempting to connect a GitHub organization repository to Vercel Hobby fails.
**Why it happens:** Vercel Hobby does not support deploying from repositories owned by GitHub organizations — personal repos only.
**How to avoid:** Keep the repository under a personal GitHub account. This is a portfolio project, so a personal repo is appropriate.
**Warning signs:** Vercel import wizard shows no repositories after connecting GitHub.

### Pitfall 6: `next lint` removed in Next.js 16
**What goes wrong:** CI workflow uses `npm run lint` mapped to `next lint` — fails with "command not found" or deprecation error.
**Why it happens:** `next lint` was deprecated in 15.5 and removed in 16. `create-next-app` for Next.js 16 generates scripts using `eslint` directly.
**How to avoid:** Ensure `package.json` scripts use `"lint": "eslint"` not `"lint": "next lint"`. Next.js 16 scaffolding handles this correctly — only a risk if manually configuring.
**Warning signs:** CI lint step fails on Next.js 16 projects.

---

## Code Examples

### Drizzle system_status table (health-check)
```typescript
// Source: https://orm.drizzle.team/docs/sql-schema-declaration
// src/lib/db/schema/system.ts
import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

export const systemStatus = pgTable('system_status', {
  id: uuid().primaryKey().defaultRandom(),
  service: text().notNull(),          // e.g. 'database'
  status: text().notNull(),           // e.g. 'ok' | 'error'
  message: text(),                    // optional detail
  checkedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export type SystemStatus = typeof systemStatus.$inferSelect;
export type NewSystemStatus = typeof systemStatus.$inferInsert;
```

### Schema index (re-exports all tables)
```typescript
// src/lib/db/schema/index.ts
export * from './system';
// Add more as phases add tables:
// export * from './items';
// export * from './users';
```

### DB connection indicator (server component — API route approach)
```typescript
// src/app/api/health/route.ts
import { db } from '@/lib/db';
import { systemStatus } from '@/lib/db/schema';

export async function GET() {
  try {
    await db.select().from(systemStatus).limit(1);
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
```

### Inter font with next/font
```typescript
// Source: Next.js 16 official docs
// src/app/layout.tsx (partial)
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Apply: <body className={inter.variable}>
```

### Migration commands (npm scripts)
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Webpack bundler (default) | Turbopack (default in Next.js 16) | Oct 2025 (Next.js 16) | 2-5x faster builds, no config change needed |
| `next lint` command | `eslint` CLI directly | Deprecated 15.5, removed 16 | `package.json` scripts must use `eslint` not `next lint` |
| React 18 | React 19 (bundled with Next.js 16) | Oct 2025 | Improved hydration, Actions API, concurrent improvements |
| `tailwind.config.js` + PostCSS (v4) | CSS-first config in `globals.css` (Tailwind v4) | Jan 2025 | Tailwind v3 still standard for shadcn/ui; v4 is opt-in |
| `unstable_cache` / `unstable_cacheTag` | `cacheLife` / `cacheTag` stable | Next.js 16 | Caching APIs are stable, no longer `unstable_` prefix |

**Deprecated/outdated:**
- `next lint` command: Deprecated in 15.5, removed in 16. Use `eslint` CLI.
- Pages Router: Still supported but App Router is the standard for all new projects.
- `legacyBehavior` on `<Link>`: Removed in Next.js 16.
- Prisma on Vercel serverless: Works but requires query engine binary — Drizzle is lighter.

---

## Open Questions

1. **Tailwind v3 vs v4 in practice for this project**
   - What we know: shadcn/ui officially supports both; `create-next-app` defaults to v3; v4 uses CSS-first config
   - What's unclear: Whether `npx create-next-app@latest` as of March 2026 defaults to v3 or v4
   - Recommendation: During setup, explicitly confirm version. If v4 is scaffolded, verify shadcn/ui init works without issue. If any friction, downgrade to v3.

2. **DATABASE_URL format for Neon (pooled vs direct)**
   - What we know: Neon provides two connection strings — pooled (PgBouncer, recommended for serverless) and direct (for migrations)
   - What's unclear: Whether drizzle-kit migrate works with the pooled connection or needs the direct URL
   - Recommendation: Use the **pooled** URL for the Drizzle client (`src/lib/db/index.ts`) and the **direct** URL for `drizzle-kit migrate`. Store both in env vars: `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected in existing project — Wave 0 must establish |
| Config file | None — see Wave 0 |
| Quick run command | `npx tsc --noEmit` (type check as proxy for correctness) |
| Full suite command | `npm run build` (build must pass with zero TS errors) |

Note: INFRA-02 (CI/CD with tests) and INFRA-04 (meaningful test coverage) are mapped to Phase 8, not Phase 1. Phase 1's validation is structural: TypeScript compiles, migrations run, Vercel returns 200, CI passes. No unit/E2E tests are required in Phase 1.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | App returns 200 at public Vercel URL | smoke | `curl -f $VERCEL_URL` (manual post-deploy) | ❌ Wave 0 (manual check) |
| INFRA-03 | TypeScript compiles with zero errors | type-check | `npx tsc --noEmit` | ❌ Wave 0 (CI step) |
| INFRA-05 | All services on free tiers | config audit | Manual verification of Vercel/Neon plan | manual-only |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (type safety gate)
- **Per wave merge:** `npm run build` (full build must pass)
- **Phase gate:** `npm run build` green + Vercel URL returns 200 before marking Phase 1 complete

### Wave 0 Gaps
- [ ] `.github/workflows/ci.yml` — type check + lint + build on push/PR
- [ ] `src/lib/db/migrations/` directory — needs first migration after `drizzle-kit generate`
- [ ] `.env.example` — document all required env vars before first commit

---

## Sources

### Primary (HIGH confidence)
- [Next.js Installation Docs](https://nextjs.org/docs/app/getting-started/installation) — create-next-app flags, TypeScript setup, Node 20.9 minimum, linting changes
- [Next.js 15.5 Release Blog](https://nextjs.org/blog/next-15-5) — `next lint` deprecation, TypeScript improvements, Next.js 16 deprecation warnings
- [Drizzle ORM + Neon get-started](https://orm.drizzle.team/docs/get-started/neon-new) — exact installation, drizzle.config.ts format, migration commands
- [Drizzle ORM schema declaration](https://orm.drizzle.team/docs/sql-schema-declaration) — `uuid().defaultRandom()`, `casing: 'snake_case'` option
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) — `npx shadcn@latest init`, components.json, cn utility

### Secondary (MEDIUM confidence)
- [shadcn/ui dark mode docs](https://ui.shadcn.com/docs/dark-mode/next) — ThemeProvider pattern, suppressHydrationWarning
- [Neon connection pooling docs](https://neon.com/docs/connect/connection-pooling) — pooled vs direct URL distinction
- [Next.js 16 release notes](https://nextjs.org/blog/next-16) — Turbopack as default, React Compiler stable, `next lint` removal

### Tertiary (LOW confidence — verify during implementation)
- WebSearch results on Vercel Hobby limits — 100GB transfer, 1M function invocations/month (confirm on Vercel dashboard)
- WebSearch results on Neon free tier — 0.5 GB storage, 100 CU-hours/month (confirm on Neon dashboard)
- WebSearch on `create-next-app` defaulting to Tailwind v3 vs v4 in March 2026 — run the command and observe to confirm

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via official Next.js, Drizzle, shadcn/ui docs
- Architecture: HIGH — follows Next.js App Router conventions and locked user decisions directly
- Pitfalls: MEDIUM — verified from official changelogs and docs; env var / peer dep pitfalls are community-confirmed patterns
- Free tier limits: LOW — numbers from WebSearch; verify on service dashboards during implementation

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable ecosystem — 30 day window; Next.js patch releases unlikely to break this)
