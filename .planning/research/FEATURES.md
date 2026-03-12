# Feature Landscape

**Domain:** Government policy digest / news summarization app
**Project:** PatchNotes v1.0 Full Rebuild
**Researched:** 2026-03-11
**Confidence note:** External research tools unavailable during this session. Findings are based on training data (cutoff August 2025) covering GovTrack, Congress.gov, Legiscan, Ground News, TLDR Newsletter, The Skimm, Axios, and similar apps. All claims flagged with confidence level. Verify competitor features before finalizing.

---

## Table Stakes

Features users expect in any digest or policy-tracking app. Missing = product feels broken or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scannable feed of recent changes | Core premise — users need a list of what happened | Low | Already in old version; rebuild cleaner |
| Plain-English AI summary per item | "Patch notes" metaphor only works if the summary is actually readable | Medium | Already in old version via Gemini; needs reliability work |
| Date-based filtering / "today's changes" | Users want to know what happened today vs last week | Low | Already in old version |
| Category/topic filtering | Users can't consume everything — must narrow by domain | Low | Already in old version ("collection filtering") |
| Item detail view | Tap on a summary to read the full AI breakdown + link to source | Low | Already in old version; rebuild with richer layout |
| Link to official source | Trust anchor — every item must link to Congress.gov, Federal Register, or whitehouse.gov | Low | Non-negotiable for credibility |
| Search | Users will search for specific topics, bill names, or keywords | Medium | Targeted rebuild feature |
| Responsive design / mobile-usable | Most news consumption is on mobile | Low | Already in old version |
| Dark mode | Expected by modern users | Low | Already in old version |
| Fast load time | Slow digest = abandoned digest | Medium | Cold-start AI latency is the main risk |

---

## Differentiators

Features that set PatchNotes apart from Congress.gov, GovTrack, and generic news apps. Not universally expected, but highly valued by the target user (non-wonks who want clarity).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Patch notes" structured format | Each item formatted like a software changelog: What changed / Who it affects / Why it matters | Low-Medium | The core brand differentiator — structured prompting enforces this format |
| Daily digest view | "Here's everything that changed today" as a single curated page, not just a paginated feed | Medium | Targeted rebuild feature; requires scheduled data refresh + digest assembly |
| Topic watchlist | Follow "healthcare," "immigration," "taxes" — changes in that topic surface prominently | Medium | Targeted rebuild feature; requires topic taxonomy + user preference storage |
| Email/in-app notification for watchlist topics | "Something changed in immigration today" — drives return visits | Medium | Scoped to email only for v1 per PROJECT.md; requires queue/cron |
| Impact framing in summary | Every summary includes "Who this affects" — makes abstract policy feel personal | Low | Prompt engineering, not engineering complexity |
| Severity/scope signal | Visual indicator: broad national impact vs. narrow administrative change | Medium | Requires AI classification + display component; adds strong scannability |
| "What changed vs before" framing | Regulations often amend previous ones — showing delta is more useful than just the new text | High | Requires diffing or AI delta summarization; defer to post-v1 unless feasible |
| Onboarding topic selection | First-run flow: "What do you care about?" — immediately personalizes experience | Low-Medium | 5-10 topic cards, saves to profile; makes watchlist sticky from day one |
| Bookmark / save for later | Save an item to read more carefully; builds habit loop | Low | Already in old version; rebuild with cleaner UI |

---

## Anti-Features

Features to explicitly NOT build in v1. Noted here to prevent scope creep.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Political commentary or spin | Violates core principle; alienates half the audience; creates liability | Strict factual summaries; "this is what changed, not whether it's good" |
| Real-time push notifications (browser/SMS) | High complexity, infrastructure cost, out of scope per PROJECT.md | Email digests for v1; revisit in v2 |
| State/local government data | Dozens of separate APIs, inconsistent formats, exponential scope growth | Federal-only for v1; model the architecture to allow expansion later |
| Social features (comments, reactions, sharing) | Not core to literacy mission; moderation burden; out of scope per PROJECT.md | Clean sharable URLs so users can share manually |
| Vote predictions / outcome modeling | Speculative, politically charged, high ML complexity | Show bill status (introduced, committee, floor, signed) — factual only |
| Party performance scoring / bias meter | Ground News-style bias rating is complex, contested, and politically sensitive | Factual source attribution only |
| Full legislative text in-app | Federal Register docs can be hundreds of pages — rendering them is not the value add | Always link to official source; summary is the product |
| Native mobile app | Out of scope per PROJECT.md; responsive web is sufficient for portfolio | Responsive web with good mobile UX |
| Bulk CSV/export features | Researcher use case, not everyday user; low value for v1 | Consider as power-user feature in v2 |
| AI chatbot / "ask about this bill" | High cost, latency, moderation surface area | Static AI summaries are faster, cheaper, and more reliable for v1 |

---

## Feature Dependencies

```
User Auth
  └── Bookmarks (requires user identity)
  └── Topic Watchlist (requires user preference storage)
       └── Watchlist Notifications (requires watchlist + email queue)
       └── Onboarding flow (sets initial watchlist)

Government Data Ingestion (cron/scheduled)
  └── Feed / Daily Digest (requires fresh data)
  └── Search Index (requires indexed data)

AI Summarization
  └── Feed items (each item needs a summary)
  └── Daily Digest assembly (aggregate summary of the day)
  └── Search result snippets (summary previeds in results)

Topic Taxonomy
  └── Category filtering (applies taxonomy to feed)
  └── Topic Watchlist (maps user prefs to taxonomy)
  └── Search facets (filter by topic in search)
```

---

## MVP Recommendation

For v1.0 full rebuild, prioritize in this order:

**Must ship:**
1. Feed with AI patch-notes summaries (the core product; everything else builds on it)
2. Item detail view with structured format (What changed / Who it affects / Why it matters)
3. Daily digest view (the "what happened today" page — the primary landing experience)
4. Search with keyword + topic filter (required rebuild target per PROJECT.md)
5. Topic watchlist with onboarding flow (required rebuild target; drives retention)
6. User auth + bookmarks (required for watchlist; already exists in old version)
7. Email notification for watchlist topics (completes the watchlist loop; scoped to email only)

**Defer to post-v1:**
- Severity/scope signal — valuable differentiator but requires AI classification work; add in v1.1
- "What changed vs before" delta view — high complexity, requires diffing strategy; v2 candidate
- Mobile push notifications — out of scope per PROJECT.md
- State/local data — out of scope per PROJECT.md

---

## What Makes a Digest App Sticky

Based on patterns from TLDR Newsletter, The Skimm, Axios, and GovTrack (MEDIUM confidence — training data):

1. **Daily habit formation** — A consistent "here's today" page trains users to return daily. The digest view is the most important retention feature.
2. **Personalization from day one** — Apps that ask "what do you care about?" during onboarding retain users 2-3x better than generic feeds. The watchlist onboarding flow is high-leverage, low-complexity.
3. **Email as the re-engagement channel** — For a policy app, email digests or watchlist alerts are the primary re-engagement mechanism. Push notification permission rates are low; email works reliably.
4. **Trust signals** — Policy content requires source attribution. Users abandon apps that feel like they're getting summaries without knowing where the information comes from. Every item must link to the official source.
5. **Speed of comprehension** — The faster a user can understand an item (via structured format, clear headers, plain language), the more items they read, and the more they trust the product.
6. **"Just the facts" positioning** — In a politically polarized environment, a tool that explicitly avoids commentary builds a broader audience and stronger trust than one that signals a lean.

---

## Competitive Gap Analysis

Apps in this space and where PatchNotes differs (MEDIUM confidence — training data, verify against current state of these products):

| App | What They Do Well | What They Don't Do | PatchNotes Opportunity |
|-----|------------------|--------------------|------------------------|
| GovTrack | Deep bill data, voting records, legislator pages, email alerts | Dense for non-experts, no plain-English framing, UI is old | AI plain-language summaries + patch-notes metaphor |
| Congress.gov | Authoritative official source, full text, committee data | Zero summarization, built for staffers not citizens, no personalization | Lay-person digest layer on top of the same data |
| Legiscan | Good API, state + federal, developer-friendly | No consumer product, purely B2B/developer tool | Consumer-facing product using same underlying data |
| Ground News | Bias meter, story comparison, strong personalization | News articles, not primary government sources; political framing can feel biased | Primary source-only, factual framing, no media intermediary |
| The Skimm / TLDR | High readability, strong daily habit, large audience | General news not policy; no drill-down; no personalization beyond newsletter | Policy-specific depth + drill-down + watchlist |
| Axios | "Smart brevity" format, strong topic pages | Paywalled, politically positioned, media company not civic tool | Free, unspun, structured format for everyday people |

**Core gap PatchNotes fills:** No app combines (1) primary government source data, (2) AI plain-language summarization, (3) structured patch-notes format, (4) topic watchlist, and (5) zero political spin. The closest is GovTrack but it's not built for everyday people.

---

## Phase-Specific Feature Flags

| Phase | Features | Research Needed? |
|-------|----------|-----------------|
| Foundation / Data layer | Government API ingestion, scheduled cron, data models | LOW — patterns are well established; main risk is API rate limits and downtime handling |
| Core feed + AI summaries | Feed display, AI prompt design, detail view | MEDIUM — AI prompt engineering for structured patch-notes format needs iteration; test several prompt strategies |
| Search + Explore | Keyword search, topic filters, search UX | LOW — standard full-text search patterns; Postgres FTS or Algolia both well-documented |
| Daily Digest view | Digest assembly, "today" page, aggregate summary | LOW-MEDIUM — digest assembly logic (what to include, how to order) needs a decision; no external research required |
| User accounts + Bookmarks | Auth, sessions, bookmark storage | LOW — standard auth patterns; use existing library (NextAuth, Clerk, etc.) |
| Topic Watchlist | Taxonomy design, user prefs, onboarding flow | MEDIUM — topic taxonomy for federal policy needs careful design; affects all personalization downstream |
| Email notifications | Email queue, watchlist trigger, digest email | MEDIUM — email deliverability, scheduling, and template design have known gotchas; use established service (Resend, SendGrid) |

---

## Sources

- Training data knowledge of GovTrack (govtrack.us), Congress.gov, Legiscan, Ground News, The Skimm, TLDR Newsletter, Axios — MEDIUM confidence, knowledge cutoff August 2025
- PROJECT.md (PatchNotes project context) — HIGH confidence
- External research tools (WebSearch, WebFetch, Brave API) were unavailable during this session — all competitor feature claims should be verified against current product state before finalizing roadmap
