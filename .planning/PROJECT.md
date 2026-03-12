# PatchNotes

## What This Is

PatchNotes makes U.S. government policy changes understandable for everyday people. It aggregates executive orders, federal bills, and regulations, then uses AI to distill them into scannable "patch notes" — structured summaries that show what changed, in plain English. Think of it as a changelog for your government.

## Core Value

Everyday people can quickly understand what their government actually changed today, with no political spin — just clear, structured facts.

## Current Milestone: v1.0 Full Rebuild

**Goal:** Rebuild PatchNotes from scratch with a modern stack, portfolio-grade code quality, and three core features.

**Target features:**
- Daily digest of government changes in patch-notes format
- Search and explore individual bills, orders, and regulations
- Topic watchlist with notifications for areas you care about

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — full rebuild, starting fresh)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Daily digest — AI-summarized government changes in patch-notes format
- [ ] Search/explore — drill into any bill, order, or regulation with AI summary
- [ ] Topic watchlist — follow areas like healthcare, taxes, immigration
- [ ] User accounts — auth, saved preferences, bookmarks
- [ ] Modern, accessible UI — clean design, responsive, dark mode
- [ ] Live government data — executive orders, bills, regulations from official APIs
- [ ] Deployed and live — publicly accessible with a real URL

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Political bias/commentary — core principle, PatchNotes reports facts only
- Real-time push notifications — email/in-app is sufficient for v1
- State/local government data — federal only for v1, keeps scope manageable
- Mobile native app — responsive web is sufficient for portfolio
- Social features (comments, sharing) — not core to the literacy mission

## Context

- Originally a college group project (Team 3), now being rebuilt solo as a portfolio/resume piece
- Previous version used vanilla HTML/CSS + React UMD, Node/Express monolith, MongoDB Atlas
- Previous version had working government API integrations (Congress API, Federal Register, Executive Orders)
- The "patch notes" metaphor is intentional creative framing — approachable but not silly, informative tone
- Target audience: everyday people who want to understand policy changes without wading through legalese
- Must demonstrate real engineering skill to hiring managers: clean architecture, tests, CI/CD, deployment

## Constraints

- **$0 budget**: All services must be free tier — no paid hosting, database, or AI API costs
- **Portfolio quality**: Code must be clean, well-structured, and demonstrate modern best practices
- **AI dependency**: Summarization is the core feature — AI integration must be reliable and fast
- **Government APIs**: Dependent on public government data sources — must handle rate limits and downtime gracefully
- **Data volume**: Government APIs return thousands of items — must filter aggressively at ingestion to control storage and AI costs
- **Solo developer**: One person building and maintaining — architecture should be simple enough to manage alone

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full rebuild over incremental improvement | Original codebase is a college monolith, not portfolio-grade | — Pending |
| Patch-notes metaphor for UI framing | Makes policy approachable without being silly, shows creativity | — Pending |
| Federal-only scope for v1 | Keeps data sources manageable for solo dev | — Pending |
| Gemini Flash over Claude for AI | Gemini free tier (1,500 req/day) far exceeds needs; $0 budget constraint | — Pending |
| Tiered ingestion + selective summarization | Filter APIs aggressively (~15-30 items/day), AI-summarize only filtered items, on-demand + cache for rest | — Pending |
| $0 budget — all free tiers | Portfolio project, no revenue — Vercel Hobby, Neon free, Gemini free | — Pending |

---
*Last updated: 2026-03-11 after requirements scoping*
