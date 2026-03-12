# Phase 1: Foundation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy a Next.js app on a real Vercel URL with Neon Postgres connected, TypeScript enforced, and GitHub Actions CI running. No product features — just the infrastructure that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Project structure
- Next.js App Router (not Pages Router)
- Feature-based code organization: `src/features/feed/`, `src/features/search/`, `src/features/auth/` etc.
- All application code under `src/` directory — root stays clean for config files
- Single package (not monorepo) — one package.json, one deployable
- `src/app/` contains only routes; business logic lives in `src/features/` and `src/lib/`
- Shared UI components in `src/components/`

### Styling system
- Tailwind CSS for all styling
- shadcn/ui for pre-built accessible components (Button, Card, Badge, Dialog, etc.)
- Color palette: zinc/slate neutrals with blue accent (`blue-600` light / `blue-400` dark)
- Inter font via `next/font` — clean, professional, readable
- Dark mode infrastructure set up from Phase 1 (Tailwind `dark:` variant)

### Placeholder landing page
- Claude's discretion on exact design
- Must include: PatchNotes name, tagline "A changelog for your government", version badge
- Working dark mode toggle from day one
- DB connection status indicator (green/red) — validates full stack, removable in Phase 4
- Serves as visual proof that infrastructure is live

### Database setup
- Drizzle ORM with per-domain schema files: `src/lib/db/schema/items.ts`, `users.ts`, etc.
- Schema index file re-exports all tables
- Initial migration: a `system_status` health-check table (proves migrations work end-to-end)
- snake_case for all table and column names (Postgres convention; Drizzle maps to camelCase in TS)
- UUID primary keys on all tables
- Migrations directory: `src/lib/db/migrations/`

### Claude's Discretion
- Exact landing page layout and visual design
- ESLint/Prettier configuration details
- GitHub Actions workflow specifics
- next.config.ts settings
- Drizzle config file setup
- Health-check table exact schema

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is a greenfield rebuild. The old `project/` directory is a vanilla JS + Express + MongoDB monolith that will not be carried forward.

### Established Patterns
- Old codebase had government API files (`congressAPI.js`, `execOrderAPI.js`, `regulationAPI.js`, `geminiAPI.js`) — confirms the integration patterns Phase 2 will rebuild in TypeScript
- Old project used `bcrypt` + `express-session` for auth — Phase 6 will use a modern approach

### Integration Points
- Vercel deployment via GitHub integration (push to main = deploy)
- Neon Postgres via connection string in environment variables
- No secrets in repo — all credentials via env vars

</code_context>

<specifics>
## Specific Ideas

- Tagline is "A changelog for your government" — from PROJECT.md, captures the patch-notes metaphor
- The "patch notes" framing should feel approachable but not silly — informative tone
- Portfolio quality matters: clean code, proper TypeScript, no shortcuts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-11*
