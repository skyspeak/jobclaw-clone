# DearCC presents JobClaw Notes

This repo now includes DearCC presents JobClaw, a small hosted app around the original
OpenClaw skill. The app intentionally ships chat-to-search-request first. Live job
search execution should be added only after provider, compliance, reliability,
and cost decisions are made.

## Stack Selected

- App framework: Next.js and TypeScript
- Hosting target: Vercel
- Current browser persistence: `localStorage` for in-progress chat sessions
- Production submission storage: Postgres through `DATABASE_URL`
- Auth recommendation: Clerk or Supabase Auth
- Search recommendation: free outbound search links first; API-backed search later
- Email recommendation: Resend
- Payments recommendation: Stripe

## Accounts Needed

For the current app, you only need a GitHub account and a Vercel account to host
it. To operate DearCC presents JobClaw as a full platform, add these in roughly this order:

1. Vercel for hosting and preview deployments.
2. Supabase or Neon for Postgres.
3. Clerk or Supabase Auth for user accounts.
4. OpenAI, Anthropic, Gemini, or another LLM provider only when replacing the
   deterministic inference.
5. Resend for email capture and notifications.
6. Stripe for paid plans.
7. Sentry or another monitoring provider before public launch.

## Environment Variables

See `.env.example`. The intake generator and free outbound search links work
without environment variables because the first pass uses deterministic inference.

Completed intake submissions use Postgres when `DATABASE_URL` or `POSTGRES_URL`
is configured. Neon, Supabase Postgres, Vercel Postgres, and other
Postgres-compatible providers should work. Without a database URL, local
development falls back to `data/intake-submissions.json`; do not rely on that
fallback for production hosting.

The submissions table is created automatically on first read/write:

```sql
create table if not exists intake_submissions (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contact jsonb not null,
  answers jsonb not null,
  defaults jsonb not null,
  result jsonb not null,
  profile_draft jsonb
);
```

## Search Execution Plan

Live search should be treated as a worker service, not a direct request from the
chat UI.

Recommended stages:

1. Free outbound search links: generate Google, career-page, LinkedIn, Indeed,
   and Idealist URLs from the generated search request.
2. Manual handoff: generate an editable JSON request and let users copy or use it
   with a compatible browser agent.
3. Job-search API: test vendors that provide job listings and links without
   browser scraping.
4. Managed browser automation: use OpenClaw, Browserbase, Playwright, Apify, or
   a similar runner with queues, retries, rate limits, and terms review.

Suggested future tables:

- `users`
- `intake_sessions`
- `intake_answers`
- `search_requests`
- `search_runs`
- `job_matches`
- `subscriptions`

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
