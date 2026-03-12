---
phase: 07-email-notifications
plan: 02
subsystem: notifications
tags: [notifications, email, resend, react-email, unsubscribe, ingest]
dependency_graph:
  requires:
    - src/features/notifications/types.ts (DigestRecipient, NotificationResult)
    - src/features/notifications/token.ts (generateUnsubToken, verifyUnsubToken)
    - src/features/notifications/queries.ts (getUsersWithMatchingItems)
    - src/lib/db/schema/notification-prefs.ts (notificationPrefs table)
    - src/features/ingestion/ingest.ts (runIngest pipeline)
  provides:
    - src/features/notifications/email.tsx (DigestEmail React Email template)
    - src/features/notifications/notify.ts (runNotifications orchestrator)
    - src/app/api/unsubscribe/route.ts (token-verified unsubscribe endpoint)
    - src/app/unsubscribed/page.tsx (confirmation page)
  affects:
    - src/features/ingestion/ingest.ts (extended with notification step)
tech_stack:
  added:
    - resend@6.9.3
    - "@react-email/components@1.0.9"
  patterns:
    - React Email function components (not arrow) for named preview support
    - Resend batch.send() for single API call covering all recipients
    - Day-scoped duplicate prevention via notifiedDate YYYY-MM-DD string
    - Graceful no-op when RESEND_API_KEY is missing (ingest never fails for email)
    - Upsert pattern (onConflictDoUpdate) for both notifiedDate and optedOut
key_files:
  created:
    - src/features/notifications/email.tsx
    - src/features/notifications/notify.ts
    - src/app/api/unsubscribe/route.ts
    - src/app/unsubscribed/page.tsx
  modified:
    - src/features/ingestion/ingest.ts
    - src/features/notifications/token.test.ts
decisions:
  - resend.batch.send() over individual sends — one API call covers all recipients, simpler error handling
  - from address uses onboarding@resend.dev (Resend shared domain) — custom domain requires DNS verification, not needed for portfolio
  - notifiedDate check via single DB query then Set lookup — O(1) per-recipient, one round-trip
  - appUrl sourced from NEXT_PUBLIC_APP_URL env var with localhost fallback
metrics:
  duration: 4 minutes
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
---

# Phase 7 Plan 02: Email Notification Pipeline Summary

**One-liner:** React Email digest template + Resend batch orchestrator + HMAC-verified unsubscribe route completing the end-to-end notification pipeline.

## What Was Built

### Task 1: React Email template and runNotifications orchestrator

- `DigestEmail` function component: renders a styled email with PatchNotes header, item list (each as a link with type/topic badges), and unsubscribe footer. Uses inline styles for email-safe rendering via @react-email/components.
- `runNotifications()`: full orchestrator that:
  - Returns gracefully if `RESEND_API_KEY` is missing (never throws — ingest is not blocked)
  - Calls `getUsersWithMatchingItems()` for the day's qualifying recipients
  - Queries `notificationPrefs` for users already notified today (YYYY-MM-DD), skips them
  - Warns if recipient count exceeds 95 (Resend free tier threshold)
  - Renders DigestEmail to HTML for each recipient with their unsubscribe URL
  - Sends all emails via `resend.batch.send()` (single API call)
  - Upserts `notifiedDate` for all sent recipients to prevent re-sends

### Task 2: Ingest pipeline extension, unsubscribe route, and confirmation page

- `ingest.ts` extended: calls `runNotifications()` after `runSummarization()`; surfaces `notified` and `notificationErrors` in `IngestResult`.
- `/api/unsubscribe` GET route: extracts token from query param, verifies HMAC via `verifyUnsubToken`, upserts `optedOut: true` in `notificationPrefs`, redirects to `/unsubscribed`.
- `/unsubscribed` page: centered confirmation with heading, message, and return-to-home link. Dark mode support via Tailwind `dark:` variants.
- DB migration applied: `notification_prefs` table created in Neon via `drizzle-kit push`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 74b498d | feat(07-02): install resend/react-email, create DigestEmail template and runNotifications orchestrator |
| 2 | bda6a40 | feat(07-02): extend ingest pipeline, add unsubscribe route and confirmation page |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing `vi` import in token.test.ts caused tsc to fail**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** `token.test.ts` used `vi.stubEnv()` but only imported `describe, it, expect, beforeAll` from vitest — missing `vi` import
- **Fix:** Added `vi` to the vitest import in `token.test.ts`
- **Files modified:** src/features/notifications/token.test.ts
- **Commit:** 74b498d (included in Task 1 commit)

## Self-Check: PASSED

All created files verified on disk. Both task commits verified in git log.
