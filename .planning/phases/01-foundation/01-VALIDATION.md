---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Phase 1 uses structural validation (tsc, build, deploy) |
| **Config file** | None — Wave 0 establishes CI pipeline |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | INFRA-01 | smoke | `curl -f $VERCEL_URL` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | INFRA-03 | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | INFRA-03 | build | `npm run build` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | INFRA-05 | config-audit | Manual verification | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/ci.yml` — type check + lint + build on push/PR
- [ ] `src/lib/db/migrations/` — first migration after `drizzle-kit generate`
- [ ] `.env.example` — document all required env vars

*Wave 0 establishes CI pipeline and migration infrastructure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App returns 200 at Vercel URL | INFRA-01 | Requires live deployment | Deploy to Vercel, `curl -f <URL>` |
| All services on free tiers | INFRA-05 | Configuration audit | Check Vercel plan (Hobby) and Neon plan (Free) in dashboards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
