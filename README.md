# LeakGuard AI

Privacy-first AI subscription leak detector. Detects recurring subscriptions,
duplicates, silent price hikes, and unused spend from uploaded bank
statements, then generates AI recommendations (cancel / downgrade / keep /
alternative / family plan / cashback / switch plan).

## Architecture

```
leakguard-ai/
├── frontend/     Next.js 16 + React 19 + Tailwind + shadcn UI (your uploaded UI, now wired to live data)
├── backend/      FastAPI — parsing, detection engine, Gemini recommendations
└── database/     Supabase SQL: schema, RLS, views, functions, seed data
```

**Flow:** Login → Upload statement → Parse (CSV/PDF/Excel) → Normalize
merchant (RapidFuzz) → Detect recurring → Detect duplicate → Detect price
hike → Compute leak score → Generate AI recommendation (Gemini) → Dashboard.

Statements are parsed **in-memory only** — the raw file is never written to
disk or object storage. Only the derived transactions/subscriptions are
persisted, scoped to the user via Supabase Row Level Security, and raw
transaction rows auto-purge after 90 days (`purge_old_transactions()`).

## Setup

### 1. Database
1. Create a Supabase project.
2. In the SQL editor, run `database/schema.sql` in full.
3. (Optional) Schedule the retention purge via `pg_cron`:
   `select cron.schedule('purge-transactions', '0 3 * * *', 'select public.purge_old_transactions()');`

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in Supabase + Gemini keys
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs at `http://localhost:8000/docs`. Deploy with the included
`Dockerfile` / `render.yaml` on Render.

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local   # fill in Supabase URL/anon key + API URL
pnpm install
pnpm dev
```
Deploy to Vercel; set the same env vars there, pointing `NEXT_PUBLIC_API_URL`
at your deployed Render backend.

## What's wired end-to-end right now

- **Database**: complete schema, RLS, views, triggers, seed merchant directory.
- **Backend**: every router (upload, dashboard, subscriptions, recommendations,
  reports, history, settings) is implemented and calls real detection logic —
  not stubs. The parser, merchant normalizer, recurring/duplicate/price-hike
  detectors, and leak-score engine are unit-tested against synthetic data (see
  below) and produce correct results.
- **Frontend**: `lib/api.ts` + `lib/supabase.ts` give every page a typed
  client for the full API surface. **Every app page** — Dashboard, Upload,
  Subscriptions, Recommendations, Leak Analysis, Processing, and History —
  is wired to live data with graceful fallback to the original demo data
  when signed out or offline, so the UI never breaks mid-build. Each
  data-backed page shows a small "Live data / Demo data" badge so it's
  obvious which you're looking at.
- **Auth**: `/sign-in` and `/sign-up` pages calling `signInWithPassword` /
  `signUpWithPassword` from `lib/supabase.ts`, sharing an auth layout with
  the bundled login illustration. The navbar's account menu now reflects
  real signed-in/out state (`lib/use-auth.ts`) with a working sign-out
  button, instead of the hardcoded "Aarav Sharma" placeholder.
- **History page** (`/history`): didn't exist in the uploaded UI at all —
  built from scratch using the existing design language (statement table +
  spending-forecast chart), wired to `GET /api/history/statements` and
  `GET /api/history/forecast`.
- **Processing page**: now polls `GET /api/history/statements` for the
  statement's `status` when a real `statementId` is present (redirecting to
  `/dashboard` on `completed`, showing an error state on `failed`); falls
  back to the original timed demo animation for the "Use Demo Statement"
  flow.
- Fixed a few pre-existing bugs uncovered while wiring: `PageHeader` was
  missing the `eyebrow` prop that 3 pages already passed it, and the
  Subscriptions page passed `SubscriptionTable` a prop (`items`) it didn't
  accept — both were TypeScript errors before this pass. Verified with a
  clean `tsc --noEmit` and a full `next build`.

## Honest gaps that remain

- **Settings and Help pages don't exist.** The sidebar nav links to
  `/settings` and `/help`, but neither page was ever built, even though the
  backend already has a working `settings` router. Same pattern as
  everything above (`api.settings.getProfile()` / `updateProfile()` /
  `deleteAccountData()` are ready in `lib/api.ts`) — just needs the page.
- **No password-reset flow.** Sign-in/sign-up cover the basic flow; "forgot
  password" isn't wired.
- **No route protection.** Pages don't redirect to `/sign-in` when signed
  out — by design, so the app stays fully browsable with demo data — but
  that means there's no gate forcing auth before reaching, e.g., `/upload`.
  Worth deciding deliberately rather than assuming.

## Verifying the detection engine

The core algorithms were tested against synthetic transaction data during
the build (merchant normalization, recurring detection, price-hike
detection, leak scoring, duplicate detection) — all passed. Run
`backend/app` locally with `pytest` (add test files under `backend/tests/`)
to keep these guarantees as you extend it.
