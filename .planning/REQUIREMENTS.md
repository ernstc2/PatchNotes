# Requirements: PatchNotes

**Defined:** 2026-03-11
**Core Value:** Everyday people can quickly understand what their government actually changed today, with no political spin — just clear, structured facts.

## v1 Requirements

Requirements for the full rebuild. Each maps to roadmap phases.

### Data Ingestion

- [x] **DATA-01**: System ingests executive orders from Federal Register API on a daily schedule
- [x] **DATA-02**: System ingests congressional bills with recent action (floor votes, signings, vetoes) from Congress.gov API on a daily schedule
- [x] **DATA-03**: System ingests significant final rules and proposed rules from Federal Register API on a daily schedule
- [x] **DATA-04**: System stores lightweight records (title, date, type, source URL, status, topic) in Postgres with upsert-by-source-ID
- [x] **DATA-05**: System handles API rate limits and downtime with retry logic and graceful degradation
- [x] **DATA-06**: Daily ingestion volume is controlled to ~15-30 items/day through aggressive API filtering

### AI Summarization

- [x] **AI-01**: Each filtered item gets an AI-generated summary in structured patch-notes format (What changed / Who it affects / Why it matters)
- [ ] **AI-02**: Summaries are pre-generated at ingestion time using Gemini Flash free tier and cached permanently in the database
- [x] **AI-03**: Each summary includes impact framing — who is personally affected by the change
- [x] **AI-04**: Each item displays a severity/scope signal (broad national impact vs narrow administrative change)
- [x] **AI-05**: AI output uses structured JSON schema validated before storage
- [ ] **AI-06**: Items outside the daily filter get on-demand summarization when a user clicks them, then cached

### Feed & Digest

- [ ] **FEED-01**: User can view a daily digest page showing all changes from today in patch-notes format
- [ ] **FEED-02**: User can scroll a chronological feed of recent items
- [ ] **FEED-03**: User can filter feed by type (executive orders, bills, regulations)
- [ ] **FEED-04**: User can filter feed by topic category
- [ ] **FEED-05**: User can tap an item to see the full AI breakdown and link to official source
- [ ] **FEED-06**: Every item links to its official government source (Congress.gov, Federal Register, etc.)

### Search & Explore

- [ ] **SRCH-01**: User can search items by keyword
- [ ] **SRCH-02**: User can filter search results by topic and type
- [ ] **SRCH-03**: Search results show summary snippets for quick scanning

### User Accounts

- [ ] **USER-01**: User can create an account with email and password
- [ ] **USER-02**: User session persists across browser refresh
- [ ] **USER-03**: User can log in and log out

### Personalization

- [ ] **PERS-01**: User can select topics to follow during onboarding (healthcare, taxes, immigration, etc.)
- [ ] **PERS-02**: User can manage their topic watchlist from their profile
- [ ] **PERS-03**: User can bookmark items to save for later
- [ ] **PERS-04**: User can view all bookmarked items on their profile
- [ ] **PERS-05**: User receives email notifications when items match their watchlist topics

### UI & Design

- [ ] **UI-01**: App has a clean, modern responsive design (works on mobile and desktop)
- [ ] **UI-02**: App supports dark mode toggle
- [ ] **UI-03**: UI uses the "patch notes" metaphor consistently (changelog-style formatting)
- [ ] **UI-04**: App loads fast — no waiting for AI calls at request time (pre-generated summaries)

### Infrastructure

- [x] **INFRA-01**: App is deployed and publicly accessible with a real URL
- [ ] **INFRA-02**: CI/CD pipeline runs tests on every push
- [x] **INFRA-03**: App uses TypeScript throughout
- [ ] **INFRA-04**: App has meaningful test coverage (unit + E2E)
- [x] **INFRA-05**: All services run on free tiers ($0 total cost)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced AI

- **AI-V2-01**: "What changed vs before" delta view — show how a regulation amends a previous one
- **AI-V2-02**: AI chatbot — "ask about this bill" conversational interface

### Expanded Coverage

- **DATA-V2-01**: State/local government data sources
- **DATA-V2-02**: Supreme Court decisions and opinions

### Notifications

- **NOTF-V2-01**: Browser push notifications for watchlist items
- **NOTF-V2-02**: SMS notifications for high-impact changes

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Political commentary or spin | Core principle — PatchNotes reports facts only |
| Social features (comments, reactions, sharing) | Not core to literacy mission; moderation burden |
| Native mobile app | Responsive web sufficient for portfolio |
| Full legislative text in-app | Always link to official source; summary is the product |
| Vote predictions / outcome modeling | Speculative, politically charged |
| Party performance scoring / bias meter | Complex, contested, politically sensitive |
| Bulk CSV/export features | Researcher use case, not everyday user |
| Ingesting all government data unfiltered | Volume too high for free tiers; digest must be curated |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| DATA-05 | Phase 2 | Complete |
| DATA-06 | Phase 2 | Complete |
| AI-01 | Phase 3 | Complete |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Complete |
| AI-04 | Phase 3 | Complete |
| AI-05 | Phase 3 | Complete |
| AI-06 | Phase 3 | Pending |
| FEED-01 | Phase 4 | Pending |
| FEED-02 | Phase 4 | Pending |
| FEED-03 | Phase 4 | Pending |
| FEED-04 | Phase 4 | Pending |
| FEED-05 | Phase 4 | Pending |
| FEED-06 | Phase 4 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| SRCH-01 | Phase 5 | Pending |
| SRCH-02 | Phase 5 | Pending |
| SRCH-03 | Phase 5 | Pending |
| USER-01 | Phase 6 | Pending |
| USER-02 | Phase 6 | Pending |
| USER-03 | Phase 6 | Pending |
| PERS-01 | Phase 6 | Pending |
| PERS-02 | Phase 6 | Pending |
| PERS-03 | Phase 6 | Pending |
| PERS-04 | Phase 6 | Pending |
| PERS-05 | Phase 7 | Pending |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 8 | Pending |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 8 | Pending |
| INFRA-05 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 — traceability populated after roadmap creation*
