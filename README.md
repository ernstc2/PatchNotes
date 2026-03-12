# PatchNotes

[![CI](https://github.com/ernstc2/PatchNotes/actions/workflows/ci.yml/badge.svg)](https://github.com/ernstc2/PatchNotes/actions/workflows/ci.yml)

**[Live Demo](https://patchnotes.vercel.app)** — Government policy changes, explained clearly.

Everyday people can quickly understand what their government changed today — no political spin, just clear, structured facts. PatchNotes ingests executive orders, congressional bills, and federal regulations daily, generates AI-powered summaries in patch-notes format (What changed / Who it affects / Why it matters), and sends personalized email digests to subscribers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui |
| Backend | Next.js API Routes, Drizzle ORM, Neon PostgreSQL |
| AI | Google Gemini Flash (structured JSON summaries) |
| Auth | better-auth |
| Email | Resend + React Email |
| CI/CD | GitHub Actions, Vercel |

## One Interesting Engineering Problem

**The lazy DB proxy pattern.** Neon's serverless Postgres client requires a `DATABASE_URL` at module import time. In a Next.js build, every route module is imported during the build step — where that env var isn't set. The solution: a module-level `db` export that is a JavaScript `Proxy` wrapping a `getDb()` factory. The real client is only instantiated on first method access at runtime, never at import time. This lets `npm run build` complete cleanly on Vercel without a live database connection.

## Development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, GEMINI_API_KEY, etc.
npm run db:migrate
npm run dev
```

## Testing

```bash
npm run test          # unit tests (Vitest)
npx playwright test   # E2E tests (requires built app)
```
