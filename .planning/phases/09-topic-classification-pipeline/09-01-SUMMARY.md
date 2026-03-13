---
phase: 09-topic-classification-pipeline
plan: "01"
subsystem: summarization
tags: [topic-classification, schema, gemini, backfill, tdd]
dependency_graph:
  requires: []
  provides:
    - TOPIC_VALUES enum as single source of truth in schema.ts
    - topic field in SummarySchema and summaryJsonSchema
    - topic written to policy_items.topic on every summarizeItem call
    - backfill script for existing NULL-topic rows
  affects:
    - src/features/summarization/schema.ts
    - src/features/summarization/prompt.ts
    - src/features/summarization/summarize.ts
    - src/features/feed/options.ts
tech_stack:
  added: []
  patterns:
    - TOPIC_VALUES as const array driving both schema enum and UI options (single source of truth)
    - buildRawExcerpt fallback includes topic: 'other' to satisfy SummaryOutput shape
key_files:
  created:
    - src/scripts/backfill-topics.ts
  modified:
    - src/features/summarization/schema.ts
    - src/features/summarization/schema.test.ts
    - src/features/summarization/prompt.ts
    - src/features/summarization/summarize.ts
    - src/features/summarization/summarize.test.ts
    - src/features/feed/options.ts
    - src/features/feed/queries.test.ts
decisions:
  - TOPIC_VALUES as const array exported from schema.ts — options.ts and prompt.ts import from there for single source of truth
  - 'other' excluded from TOPIC_OPTIONS UI filter — it is an internal fallback classification only
  - Backfill script re-calls summarizeItem (not a direct DB update) — re-generates full summary with updated schema including topic
metrics:
  duration: "~3 minutes"
  completed: "2026-03-13"
  tasks: 2
  files_modified: 7
---

# Phase 9 Plan 01: Topic Classification Pipeline Summary

Added topic classification to the summarization pipeline using a `TOPIC_VALUES` const array as a single source of truth, extended `SummarySchema` with a required topic enum field, updated `summarizeItem` to write the topic column to the DB, and created a backfill script for existing NULL-topic rows.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend SummarySchema with topic enum, update prompt, update options.ts | cebc5bc | schema.ts, schema.test.ts, prompt.ts, options.ts |
| 2 | Update summarizeItem to write topic to DB, add backfill script | b51888e | summarize.ts, summarize.test.ts, backfill-topics.ts, queries.test.ts |

## What Was Built

- `TOPIC_VALUES` const array with 8 values: healthcare, taxes, immigration, environment, defense, education, economy, other
- `TopicValue` type derived from `TOPIC_VALUES`
- `SummarySchema` now has 6 required fields including `topic: z.enum(TOPIC_VALUES)`
- `summaryJsonSchema` auto-updates to include topic (pre-computed at module load)
- `buildPrompt` includes explicit topic selection instruction listing all allowed values
- `TOPIC_OPTIONS` in options.ts derived from `TOPIC_VALUES.filter(t => t !== 'other')` — 'other' excluded from UI filters
- `summarizeItem` writes `topic: summaryData.topic` to DB alongside summary
- `buildRawExcerpt` returns `topic: 'other'` as fallback
- Backfill script at `src/scripts/backfill-topics.ts` — run with `npx tsx src/scripts/backfill-topics.ts` or `--limit N`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed queries.test.ts parseSummary test missing topic in fixture**
- **Found during:** Task 2 full suite verification
- **Issue:** `parseSummary` uses `SummarySchema.safeParse()`. The existing test fixture for "valid JSON matching schema" omitted the now-required `topic` field, causing it to return null and fail assertion.
- **Fix:** Added `topic: 'healthcare'` to the valid fixture and `topic: 'healthcare'` to the invalid-severity fixture in queries.test.ts. Updated comment in missing-fields test.
- **Files modified:** src/features/feed/queries.test.ts
- **Commit:** b51888e (included in Task 2 commit)

## Self-Check: PASSED

All files exist and commits are present in git history.

## Verification Results

- `npx vitest run src/features/summarization` — 32 tests pass (2 test files)
- `npx vitest run` — 75 tests pass (7 test files, no regressions)
- `npx tsc --noEmit` — No TypeScript errors
- Backfill script exists at `src/scripts/backfill-topics.ts`
