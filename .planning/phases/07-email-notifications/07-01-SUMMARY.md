---
phase: 07-email-notifications
plan: 01
subsystem: notifications
tags: [notifications, schema, hmac, tokens, queries, drizzle, crypto]
dependency_graph:
  requires:
    - src/lib/db/schema/auth-schema.ts (user table)
    - src/lib/db/schema/user-data.ts (userTopics table)
    - src/lib/db/schema/items.ts (policyItems table)
  provides:
    - src/lib/db/schema/notification-prefs.ts (notification_prefs table)
    - src/features/notifications/token.ts (HMAC sign/verify)
    - src/features/notifications/queries.ts (getUsersWithMatchingItems)
    - src/features/notifications/types.ts (DigestRecipient, NotificationResult)
  affects:
    - src/lib/db/schema/index.ts (new export)
    - .env.example (3 new vars)
tech_stack:
  added: []
  patterns:
    - HMAC-SHA256 with timingSafeEqual for stateless unsubscribe tokens
    - Pure function extraction (groupRecipientsFromRows) for DB-layer testability
    - Left join notificationPrefs so null rows (no pref) are treated as subscribed
key_files:
  created:
    - src/lib/db/schema/notification-prefs.ts
    - src/features/notifications/types.ts
    - src/features/notifications/token.ts
    - src/features/notifications/token.test.ts
    - src/features/notifications/queries.ts
    - src/features/notifications/queries.test.ts
  modified:
    - src/lib/db/schema/index.ts
    - .env.example
decisions:
  - groupRecipientsFromRows extracted as pure function for testability — avoids fragile Drizzle chain mocks; tests run without any DB connection
  - Opt-out filter applied in application layer inside groupRecipientsFromRows — left join returns null for users without pref rows, null treated as subscribed
  - drizzle-orm mock removed from queries.test.ts — only @/lib/db mocked; drizzle-orm stays real to avoid breaking auth-schema.ts relations export
metrics:
  duration: 4 minutes
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
---

# Phase 7 Plan 01: Notification Infrastructure Summary

**One-liner:** HMAC-SHA256 unsubscribe token module and watchlist-matching query layer with notification_prefs schema, 12 passing unit tests, no external dependencies.

## What Was Built

### Task 1: notification_prefs schema, types, and HMAC token module

- `notification_prefs` table: `userId` (PK, FK to user.id with cascade), `optedOut` (boolean, default false), `notifiedDate` (text "YYYY-MM-DD" for duplicate-send prevention), `createdAt`, `updatedAt`.
- `DigestRecipient` and `NotificationResult` interfaces in `types.ts`.
- `generateUnsubToken(userId)`: HMAC-SHA256 over userId, encodes as `base64url(userId:signature)`.
- `verifyUnsubToken(token)`: decodes, splits, re-derives HMAC, uses `timingSafeEqual` for constant-time comparison. Returns userId on match, null on failure. Wrapped in try/catch.
- Fail-loudly guard: throws if `UNSUBSCRIBE_SECRET` is missing.
- `.env.example` extended with `UNSUBSCRIBE_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`.

**Tests (5 passing):**
- generateUnsubToken returns non-empty base64url string
- generateUnsubToken produces different tokens for different userIds
- verifyUnsubToken round-trips correctly
- verifyUnsubToken returns null for garbage input
- verifyUnsubToken returns null for tampered signature

### Task 2: Notification query layer

- `getUsersWithMatchingItems()`: queries policy_items since UTC midnight, extracts today's topics, inner-joins user_topics + user, left-joins notificationPrefs, delegates to `groupRecipientsFromRows()`.
- `groupRecipientsFromRows(rows, todaysItems)`: pure function that groups subscriber rows into DigestRecipient array, excludes opted-out users, deduplicates items by sourceId.

**Tests (7 passing):**
- Empty when no subscriber rows
- Empty when todaysItems is empty
- Returns only users whose topics match today's items
- Excludes users where optedOut is true
- Includes users where optedOut is null (no pref row = subscribed)
- Deduplicates items per user watching multiple matching topics
- Deduplicates items when same topic row appears twice

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 19cf576 | feat(07-01): create notification_prefs schema, types, and HMAC token module |
| 2 | c852edb | feat(07-01): add notification query layer with groupRecipientsFromRows and tests |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] drizzle-orm mock broke auth-schema.ts relations import**
- **Found during:** Task 2, GREEN phase
- **Issue:** The initial queries.test.ts mocked all of drizzle-orm including `relations`, which caused auth-schema.ts to throw "No 'relations' export is defined on the mock"
- **Fix:** Removed drizzle-orm mock entirely — only @/lib/db is mocked. Since tests only call the pure `groupRecipientsFromRows` function (no DB calls), the drizzle-orm mock was never needed.
- **Files modified:** src/features/notifications/queries.test.ts
- **Commit:** c852edb (included in Task 2 commit)

## Self-Check: PASSED

All created files verified on disk. Both task commits verified in git log.
