---
phase: 08-polish-portfolio
plan: "02"
subsystem: ci-readme
tags: [ci, github-actions, playwright, readme, portfolio]
dependency_graph:
  requires: ["08-01"]
  provides: ["ci-unit-tests", "ci-e2e-tests", "portfolio-readme"]
  affects: [".github/workflows/ci.yml", "README.md"]
tech_stack:
  added: ["@playwright/test (CI only, not installed locally)"]
  patterns: ["two-job CI pipeline (unit + E2E)", "CI badge in README"]
key_files:
  modified:
    - .github/workflows/ci.yml
    - README.md
decisions:
  - "E2E job depends on ci job via needs: ci — E2E only runs when unit tests pass, saves CI minutes on failures"
  - "All four required secrets passed to e2e job env block to prevent app crash at runtime in CI"
  - "README uses placeholder Vercel URL (patchnotes.vercel.app) — can be updated after deployment"
metrics:
  duration: "1 minute"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_modified: 2
---

# Phase 08 Plan 02: CI + README Summary

CI workflow extended with unit test and E2E jobs; README rewritten as a portfolio artifact with CI badge, live demo link, tech stack table, and engineering narrative.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend CI workflow with unit tests and E2E job | 5f03177 | .github/workflows/ci.yml |
| 2 | Rewrite README as portfolio artifact | 0d953ec | README.md |

## What Was Built

**Task 1 — CI workflow extension:**
- Added `npm run test` step (Vitest) to the existing `ci` job after lint, before build
- Added a new `e2e` job with `needs: ci` — E2E only runs when the main job passes
- E2E job installs Playwright chromium and runs `npx playwright test`
- All four required secrets passed to the `e2e` job env block: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `GEMINI_API_KEY`

**Task 2 — Portfolio README:**
- Replaced the default `create-next-app` boilerplate entirely
- CI badge at top linked to the workflow
- One-sentence pitch + project description paragraph
- Tech stack table covering all six layers (Frontend, Backend, AI, Auth, Email, CI/CD)
- "One Interesting Engineering Problem" section describing the lazy DB proxy pattern
- Development quick-start (install, copy env, migrate, dev)
- Testing section (unit tests via Vitest, E2E via Playwright)
- No Claude attribution — confirmed by verification check

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

- **E2E job dependency:** `needs: ci` ensures E2E tests only run after unit tests, lint, and TypeScript checks pass. This saves CI minutes when code has basic errors.
- **All secrets in e2e env block:** DATABASE_URL, BETTER_AUTH_SECRET, RESEND_API_KEY, and GEMINI_API_KEY are all required because `playwright.config.ts` webServer runs `npm run build && npm run start`. Missing env vars would cause the Next.js server to crash at runtime and all Playwright tests to fail with connection errors.
- **Placeholder Vercel URL:** The README uses `https://patchnotes.vercel.app` as the live demo link. This can be updated once the actual deployment URL is confirmed.

## Self-Check: PASSED

- FOUND: .github/workflows/ci.yml
- FOUND: README.md
- FOUND: .planning/phases/08-polish-portfolio/08-02-SUMMARY.md
- FOUND commit 5f03177 (Task 1)
- FOUND commit 0d953ec (Task 2)
