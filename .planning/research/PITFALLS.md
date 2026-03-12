# Domain Pitfalls

**Domain:** Government data aggregation + AI summarization app (portfolio rebuild)
**Researched:** 2026-03-11
**Confidence note:** Web search tools unavailable during this research session. Findings are based on training knowledge (cutoff August 2025) covering government API behavior, AI cost patterns, and portfolio development anti-patterns. Confidence is rated per section. Validate government API specifics against current docs before implementing.

---

## Critical Pitfalls

Mistakes that cause rewrites, runaway costs, or a dead portfolio project.

---

### Pitfall 1: Summarizing Everything on Ingest

**What goes wrong:** You fetch new government data and immediately pass every document to the AI for summarization — even documents no one will ever read. At 1,000 tokens/doc and $0.002/1K tokens (GPT-4o-mini), processing 500 daily Federal Register entries costs roughly $1/day unprompted, and some documents run 10,000+ tokens.

**Why it happens:** It feels cleaner to have "pre-summarized" data ready for instant display. The real cost is invisible until your first billing statement.

**Consequences:** OpenAI bills compound faster than expected. A busy legislative week (e.g., end of fiscal year, post-election) can spike volume 3-5x. At higher token counts or higher-tier models, costs scale directly.

**Prevention:**
- Summarize on-demand only: fetch and store raw text, generate AI summary when a user first views the document, cache result permanently.
- For the daily digest specifically, summarize only the top N items (e.g., 10) selected by a lightweight heuristic (recency + category).
- Set a hard OpenAI spend limit in the dashboard from day one. $10/month cap is reasonable for a portfolio project.
- Log tokens consumed per request from the start so you can see which documents are expensive.

**Detection:** Your OpenAI usage dashboard shows token burn. If tokens spike without user traffic, summarization is running in batch without a gate.

**Phase warning:** Dangerous in the data pipeline phase — the temptation is to "set it and forget it" as a background job.

---

### Pitfall 2: Treating Government APIs as Reliable Infrastructure

**What goes wrong:** You build data fetching as if it will always respond in <500ms and return well-formed data. Government APIs (Congress.gov, Federal Register, regulations.gov) go down without notice, return 500s during high-traffic periods, silently change response schemas, and have aggressive rate limits that are not well-documented.

**Why it happens:** During development your test calls work fine. Load is low, the endpoint is up, and you have no production data about failure rates.

**Consequences:** Your cron job silently fails, the daily digest shows no data, and you don't notice for two days. Or worse: your app crashes when a null field appears in a record that previously always had a value.

**Prevention:**
- Wrap every government API call in a retry with exponential backoff (3 attempts, 1s/2s/4s delays).
- Store raw API responses in your database before processing them. If processing fails, you can reprocess without re-fetching.
- Build a simple admin health check route that shows last-successful-fetch timestamps per data source.
- Write defensive parsers: treat every field as potentially absent, even ones that "always" exist.
- Federal Register API: be aware it returns large paginated result sets; always use `per_page` params defensively.
- Congress.gov API requires an API key; rate limit is 5,000 requests/hour (verified from their docs as of 2024). Track your request count.

**Detection:** No new data appearing in the digest for >24 hours. Add alerting (even a simple email via Resend) when the cron job last success timestamp is >25 hours old.

**Phase warning:** Critical in the data pipeline phase and in deployment — works locally, breaks in production if env vars (API keys) are not set or differ.

---

### Pitfall 3: Scope Creep Disguised as "Polish"

**What goes wrong:** Core features work but feel rough, so you add "just one more thing" — email templates, advanced filtering, analytics dashboards, a recommendation engine. Each addition is individually reasonable. Combined, they push launch out by months and the portfolio piece never ships.

**Why it happens:** Solo builders conflate "done" with "perfect." The patch-notes metaphor is creative and invites feature elaboration (versioning, changelogs per user, diff views...).

**Consequences:** An undeployed project with 80% of six features is worse for a portfolio than a deployed project with 100% of three features. Hiring managers cannot evaluate code they cannot see running.

**Prevention:**
- Define a strict v1 feature lock before writing code. PatchNotes has done this (PROJECT.md out-of-scope list) — treat it as a contract.
- When a new idea feels compelling, write it in a `BACKLOG.md` and explicitly defer it. This satisfies the creative impulse without expanding scope.
- Each milestone should produce something deployed and publicly visible. Never have two consecutive milestones that don't touch the deployed app.
- Time-box the entire v1 build. If you haven't shipped in 8 weeks, cut features, don't extend the timeline.

**Detection:** If your git commits are mostly in UI components and styling files when core features aren't complete, scope creep is happening.

**Phase warning:** Highest risk during frontend development — design rabbit holes are deep.

---

### Pitfall 4: Building Auth Before You Need It

**What goes wrong:** You implement user accounts, JWT refresh tokens, password reset flows, and email verification in week one — before any core feature works. This is 2-3 weeks of work that produces nothing visible. Auth bugs also create security vulnerabilities.

**Why it happens:** It feels like "foundation" work. It also appears to justify complexity that looks impressive on a portfolio.

**Consequences:** Time sink with no user-facing output. Auth systems are where security mistakes live (storing passwords in plain text, JWTs that never expire, missing CSRF protection). A portfolio evaluator testing your site and finding an auth bug will remember it.

**Prevention:**
- Build the daily digest and search features first, without auth (read-only, public).
- Add auth only when you implement the watchlist feature, which actually requires a user identity.
- Use a managed auth provider (Clerk, Auth0, NextAuth/Auth.js) instead of rolling your own. This is a portfolio-appropriate choice — it shows you know when not to build.
- If using Clerk or Auth0: zero custom auth code is a feature, not a shortcut.

**Detection:** If you're writing password hashing code before the digest page renders, you're out of order.

**Phase warning:** Auth is needed in exactly one phase (watchlist). Don't introduce it earlier.

---

### Pitfall 5: AI Prompt Design as an Afterthought

**What goes wrong:** You pass the raw document text directly to the AI with a generic prompt ("summarize this") and accept whatever comes back. The output is inconsistent — sometimes a paragraph, sometimes bullet points, sometimes a numbered list. The "patch notes" metaphor requires a specific structured format that generic prompts don't produce.

**Why it happens:** AI summarization seems simple. The hard part is invisible until you have 50 documents with inconsistent formats displayed side-by-side.

**Consequences:** The UI looks unprofessional because summaries are different lengths and styles. The "patch notes" brand promise is undermined. You end up retrofitting prompts later, invalidating cached summaries, and re-running expensive inference.

**Prevention:**
- Design your summary schema first (fields: `title`, `what_changed`, `who_is_affected`, `effective_date`, `significance_score`). This is your "patch note" format.
- Write the system prompt to enforce this schema using JSON mode (OpenAI structured outputs / Zod validation).
- Validate AI output against a Zod schema before storing. If it fails, retry once with a more explicit prompt, then fall back to a raw excerpt.
- Test prompts against 10 diverse real documents (a short executive order, a 200-page appropriations bill, a narrow regulation) before finalizing.

**Detection:** If summaries vary wildly in length or structure in your UI, prompt design is the root cause.

**Phase warning:** Must be solved before building the digest display — it affects every UI component that shows a summary.

---

## Moderate Pitfalls

---

### Pitfall 6: No Data Freshness Strategy

**What goes wrong:** You fetch data every 15 minutes to stay "current," burning through API rate limits and compute. Or you fetch once daily and your "daily digest" is stale by 18 hours when major news breaks.

**Prevention:**
- Federal Register publishes at ~7am ET daily. Schedule your fetch for 8am ET — no need to poll more often.
- Congress.gov bill updates are batched; a twice-daily fetch (8am + 6pm ET) covers most activity.
- Executive orders are rare (single digits per month). A once-daily check is sufficient.
- Cache all API responses aggressively. Government data does not change retroactively (new documents are added, existing ones rarely modified).
- Show a "last updated" timestamp in the UI so users know data freshness. This turns a limitation into a transparency feature.

---

### Pitfall 7: Ignoring Long Document Token Limits

**What goes wrong:** A major appropriations bill or omnibus regulation can be 100,000+ words. Passing this directly to any LLM either hits the context window limit (causing a crash) or costs $1+ per document (using GPT-4 at full context).

**Prevention:**
- Always chunk long documents before summarization. Use a sliding window or map-reduce approach: summarize each section, then summarize the summaries.
- Set a hard max_tokens for input to your summarization function. If the document exceeds it, use the first N tokens (typically the preamble and first sections contain the most important content for legislation).
- Log document token counts. If a document is >8,000 tokens, flag it for chunked processing.
- For the portfolio: you can note this limitation explicitly in your README — "Documents over X tokens use extractive summarization" — which shows architectural awareness.

---

### Pitfall 8: Deploying Secrets in the Repository

**What goes wrong:** OpenAI API key, database connection string, or government API key ends up in a `.env` file committed to a public GitHub repository. Bots scan GitHub for API keys within minutes of a commit.

**Prevention:**
- Add `.env` to `.gitignore` before writing a single environment variable to it. Do this on day one.
- Use `dotenv` locally. Use platform secrets (Vercel env vars, Railway secrets, Fly.io secrets) in production.
- If you accidentally commit a secret: rotate the key immediately (treat it as compromised), then use `git filter-repo` to scrub history.
- Set up a GitHub secret scanning alert — GitHub will warn you if it detects common API key patterns in commits.

---

### Pitfall 9: Database Schema That Doesn't Match Government Data Reality

**What goes wrong:** You design your schema assuming clean, consistent data. Government APIs return inconsistent formats: some bills have sponsors, some don't. Some executive orders have a `document_number`, others reference a prior order. Regulations have a completely different structure from bills.

**Prevention:**
- Store raw API response as a JSONB column alongside structured fields. This is your escape hatch when the schema is wrong.
- Use nullable columns liberally — never assume a field is always present.
- Model each data source as its own type (ExecutiveOrder, Bill, Regulation) rather than forcing them into a single "document" table. Polymorphism in the database causes more problems than it solves for querying.
- Write seed data with real examples from each API before finalizing the schema.

---

### Pitfall 10: Portfolio Anti-Pattern — No README or Demo

**What goes wrong:** The project is technically solid but has no README explaining the architecture, no demo link, and no screenshots. Hiring managers reviewing portfolios spend 2-3 minutes per project. If they can't see it working or understand the architecture in that time, they move on.

**Prevention:**
- Write the README as if a senior engineer who has never seen your code will spend 3 minutes on it.
- Include: what it is (one sentence), a live demo link, a screenshot/GIF of the UI, the tech stack, a brief architecture description, and "interesting problems solved" (e.g., "chunking long legislative documents for LLM summarization").
- The live demo link must actually work. A broken demo is worse than no demo. Set up uptime monitoring (UptimeRobot free tier) so you know if it goes down.
- Deploy early — even with placeholder data — so the URL exists and works while you continue building.

---

### Pitfall 11: No Error Boundaries in the Frontend

**What goes wrong:** An AI summary fails to generate (API timeout, token limit exceeded, malformed response). The entire daily digest page crashes instead of showing the other 9 summaries with a "Summary unavailable" placeholder for the failed one.

**Prevention:**
- Every AI-generated content area needs a fallback state: loading, error (show raw title + date), and success.
- In React: wrap each digest card in an error boundary or use `react-error-boundary`.
- In your API route: never let an AI failure propagate as a 500. Return a structured response with `{ success: false, fallback: { title, date, rawExcerpt } }`.
- Test the error state explicitly — deliberately break the AI call in dev to verify the UI handles it gracefully.

---

## Minor Pitfalls

---

### Pitfall 12: Over-Engineering the Architecture for a Solo Portfolio Project

**What goes wrong:** Microservices, message queues, event sourcing, and CQRS are patterns designed for team-scale systems. Building them solo adds complexity with no benefit and makes the codebase harder to navigate.

**Prevention:** A modular monolith (or Next.js app + background jobs) is the correct architecture for this scale. Separate concerns via modules/folders, not separate deployable services. Add complexity only when a specific problem demands it.

---

### Pitfall 13: Cron Job Reliability on Free-Tier Hosting

**What goes wrong:** Free-tier platforms (Vercel hobby, Render free) either don't support persistent cron jobs or spin down after inactivity. Your daily digest job silently stops running.

**Prevention:** Use a platform that explicitly supports cron jobs at your tier (Vercel Pro cron, Railway, Fly.io). Alternatively, use a free external cron trigger (cron-job.org, GitHub Actions scheduled workflow) that pings a secure endpoint on your app. Document which approach you use in the README.

---

### Pitfall 14: AI Model Version Lock

**What goes wrong:** You hardcode `gpt-4` in every call. OpenAI deprecates the specific snapshot version you're using, your prompts break, or costs increase with a new default version.

**Prevention:** Store the model name in an environment variable or config constant. Use `gpt-4o-mini` as default (cheapest capable model); allow override to `gpt-4o` for premium use cases. Pin a specific version snapshot (e.g., `gpt-4o-mini-2024-07-18`) if prompt stability matters more than accessing new features.

---

### Pitfall 15: Testing Gaps on the Data Pipeline

**What goes wrong:** You write tests for UI components but not for the data fetching, transformation, and storage pipeline. A government API schema change (a field renamed, a new required field added) causes silent data corruption that surfaces as display bugs weeks later.

**Prevention:** Write integration tests for your data pipeline using recorded API responses (fixtures). Test the transformation layer (raw API response → your schema) separately from the fetch layer. Even 5-10 fixture-based tests covering edge cases (empty results, missing fields, oversized documents) will catch 80% of future regressions.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data pipeline setup | Government API assumed reliable | Add retry logic, error logging, and store raw responses before any processing |
| AI summarization | Summarize-on-ingest cost explosion | Gate all summarization behind a cache-miss check; set OpenAI spend cap from day one |
| AI summarization | Inconsistent output format | Design and validate the summary schema (Zod) before building any UI that consumes it |
| Digest display | Frontend crash on AI failure | Error boundaries on every AI-generated content area; test degraded state explicitly |
| Auth / watchlist | Building auth too early | Auth only when watchlist feature requires it; use managed provider (Clerk/Auth.js) |
| Search feature | Long documents crashing context window | Token counting + chunking before any document hits the LLM |
| Deployment | Cron job unreliable on free tier | Verify hosting tier supports cron before committing to a platform |
| Deployment | Secrets in repository | `.gitignore` and platform secrets configured before first API key is written |
| Portfolio presentation | No README, broken demo | Deploy early with placeholder data; write README before "done" |
| All phases | Scope creep disguised as polish | BACKLOG.md for new ideas; milestone feature lock treated as a contract |

---

## Portfolio-Specific Advice

These pitfalls are unique to projects built primarily as resume/hiring artifacts.

**Build publicly from the start.** A private repo that goes public "when ready" usually never goes public. Hiring managers respect seeing commit history, including early rough commits — it shows your process.

**Name interesting technical problems explicitly.** "Handles government documents up to 100,000 words via chunked LLM summarization" is more impressive than "summarizes documents." The interesting engineering is in the constraints.

**Show failure handling, not just happy paths.** A portfolio project that gracefully degrades (API down? Here's cached data. AI fails? Here's the raw title) signals production-readiness better than one that works perfectly only in ideal conditions.

**Avoid the "just add more features" trap.** One feature that works, is tested, is deployed, and is documented well is worth three features that exist but have rough edges. The daily digest alone — done right — is a strong portfolio piece.

**Make deployment visible.** A live URL, a CI badge in the README, and a "deployed to Railway/Vercel/Fly.io" mention signal that you understand the full engineering lifecycle, which is rare in junior portfolio projects.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| AI cost management patterns | HIGH | Well-documented OpenAI billing behavior; token counting and caching strategies are standard |
| Government API behavior | MEDIUM | Based on public API docs and known patterns for Congress.gov and Federal Register; verify rate limits against current docs before implementing |
| Portfolio anti-patterns | HIGH | Based on widely-discussed hiring manager feedback and portfolio review patterns |
| Scope creep / solo dev risks | HIGH | Universal software project pattern; not domain-specific |
| Deployment / cron pitfalls | MEDIUM | Platform behaviors change; verify cron support on chosen platform before committing |
| Security (secrets) | HIGH | GitHub secret scanning and .gitignore patterns are well-established and stable |

---

## Gaps to Address

- **Congress.gov API current rate limits and schema**: Verify at https://api.congress.gov/ before implementation. Rate limits and available endpoints have changed in 2024-2025.
- **Federal Register API pagination behavior at scale**: Test with the actual endpoint during the data pipeline phase, not just the development/low-volume case.
- **OpenAI structured outputs stability**: JSON mode and `response_format: json_object` are stable as of mid-2025, but verify the specific structured output guarantees before relying on them for schema enforcement.
- **Chosen hosting platform cron support**: Research specific to Railway/Vercel/Fly.io during the deployment phase. Free vs. paid tier cron behavior varies significantly.

---

## Sources

- Training knowledge: OpenAI API documentation patterns (cost management, token limits, structured outputs) — HIGH confidence
- Training knowledge: Congress.gov API v3 documentation, Federal Register API documentation — MEDIUM confidence (verify against current docs)
- Training knowledge: Portfolio development anti-patterns from engineering hiring community discourse — HIGH confidence
- Training knowledge: Government API reliability patterns from public project post-mortems — MEDIUM confidence
- NOTE: Web search unavailable during this session. Claims marked MEDIUM confidence should be verified against current official documentation during the relevant implementation phase.
