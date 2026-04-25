# GreenBroker

A two-sided energy platform piloting in **Rockville, MD (ZIP 20850)**:

- **Residential** — Labdoor-style product rankings + Angi-style contractor marketplace for home electrification (heat pumps, HPWH, solar, batteries, weatherization).
- **Commercial** — FDD ("Entropy") dashboard for K-12 schools and small commercial buildings: ingest BAS trends + utility bills, run rule-based fault detection, surface ranked findings with $ impact.

Both surfaces live in this Next.js app under `/` (residential) and `/commercial` (commercial). The commercial dashboard talks to a separate FastAPI backend ("entropy-api") deployed on Railway.

**Live:** <https://greenbroker.oskoui-amin.workers.dev>

---

## Stage (April 2026)

Pilot-ready for both surfaces. End-to-end demo flow works in production:

| Surface | Status |
|---|---|
| Residential intake → savings plan | ✅ live |
| Contractor signup, subscription, leads | ✅ live |
| Stripe subscriptions + per-lead PaymentIntents | ✅ live |
| Commercial onboarding + Tier 1 trend upload | ✅ live |
| Commercial rule-based FDD + findings | ✅ live (10 rules, ~24 findings on demo building) |
| Commercial bill-parse (PDF → MinIO → Gotenberg → Anthropic) | ✅ wired, untested at scale |
| HEEHRA / HOMES rebate routing | ⏸ blocked on MD program launch (late 2026+) |

Deployed-as-of-today demo: <https://greenbroker.oskoui-amin.workers.dev/commercial/demo> redirects to a seeded "Maple Ridge Elementary" building and renders 24 findings + Grade D scorecard.

---

## Architecture

```
                ┌───────────────────────────────────────┐
                │ Cloudflare Workers                    │
  Browser ────► │ greenbroker.oskoui-amin.workers.dev   │
                │ Next.js 15 (App Router) via OpenNext  │
                └──────────┬──────────────┬─────────────┘
                           │              │
           Supabase        │              │   server-side fetch (private)
           (auth + DB)  ◄──┘              ▼
           Stripe                ┌─────────────────────────────┐
           Resend                │ Railway (Docker)            │
           Uploadthing           │  ├─ entropy-api (FastAPI)   │
                                 │  ├─ timescaledb 2.17 / pg16 │
                                 │  ├─ minio (S3-compatible)   │
                                 │  └─ gotenberg (PDF → image) │
                                 └─────────────────────────────┘
                                            │
                                            └─► Anthropic API (bill-parse)
```

- **Frontend** — Next.js 15, App Router, TypeScript strict, Tailwind, Radix, Recharts. Deployed to Cloudflare Workers via `@opennextjs/cloudflare`. See `wrangler.toml`.
- **Residential backend** — Supabase Postgres with RLS (`prisma/migrations/001_rls_policies.sql`), Stripe webhooks, Resend email, Uploadthing.
- **Commercial backend** — FastAPI + SQLAlchemy + Alembic + TimescaleDB hypertables. Source lives in the sibling repo (`../entropy-dashboard/apps/api`), deployed to Railway.
- **Worker → API auth** — shared secret in `ENTROPY_AUTH_SHARED_SECRET`; private fetches via `ENTROPY_API_INTERNAL_URL` from server components only.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Env vars
cp .env.local.example .env.local
# Fill in Supabase, Stripe, Resend, Uploadthing, Mapbox, NREL keys.

# 3. DB
npm run db:generate
npm run db:push                 # pushes Prisma schema to Supabase
# Apply RLS in the Supabase SQL editor: prisma/migrations/001_rls_policies.sql
npm run db:seed                 # sample contractors + assessment

# 4. Run
npm run dev                     # http://localhost:3000
```

For the commercial dashboard locally, also run the entropy stack:

```bash
cd ../entropy-dashboard
docker compose up               # postgres + minio + gotenberg + api on :8000
```

Then set `ENTROPY_API_INTERNAL_URL=http://localhost:8000` in `.env.local`.

---

## Deployment

### Frontend → Cloudflare Workers

```bash
export CLOUDFLARE_API_TOKEN=...
npm run deploy:cf
```

Deployment uses `@opennextjs/cloudflare` to bundle Next.js into a Worker. Bindings (`wrangler.toml`):

| Binding | Purpose |
|---|---|
| `ASSETS` | Static asset namespace |
| `ENTROPY_API_INTERNAL_URL` | Public Railway URL of entropy-api |
| `ENTROPY_AUTH_SHARED_SECRET` | Shared secret for Worker → entropy-api admin paths |

All Supabase / Stripe / Resend / Uploadthing keys are stored as **secrets** (`wrangler secret put`), not in `[vars]`. **Do not put real secrets in `wrangler.toml`** — they are committed to git.

### Commercial backend → Railway

Project: `entropy-production`. Services:

| Service | Image | Notes |
|---|---|---|
| `timescaledb` | `timescale/timescaledb:2.17.2-pg16` | Volume mounted at `/var/lib/postgresql/data`, `PGDATA=/var/lib/postgresql/data/pgdata` (subdir required) |
| `api` | Built from `apps/api/Dockerfile` | Runs `alembic upgrade head` on boot, then uvicorn |
| `minio` | `minio/minio:latest` | S3 bucket for uploaded utility bills |
| `gotenberg` | `gotenberg/gotenberg:8` | PDF → image rasterization for bill-parse |

API env (Railway → api service):

```
DATABASE_URL=postgresql+psycopg://entropy:...@timescaledb.railway.internal:5432/entropy
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-7
MINIO_ENDPOINT=http://minio.railway.internal:9000
MINIO_ROOT_USER=entropy
MINIO_ROOT_PASSWORD=...
MINIO_BUCKET=entropy
GOTENBERG_URL=http://gotenberg.railway.internal:3000
WEB_AUTH_SHARED_SECRET=...                # must match wrangler.toml
```

Note `postgresql+psycopg://` (psycopg3) — the default `postgresql://` would resolve to psycopg2, which isn't installed.

---

## Repo layout

```
greenbroker/
├── prisma/                          # Residential schema, RLS, seed
├── src/
│   ├── middleware.ts                # Session refresh, role gating, Stripe webhook guard
│   ├── lib/
│   │   ├── env.ts                   # Build-time env validation (@t3-oss/env-nextjs)
│   │   ├── supabase/                # client/server/admin Supabase factories
│   │   ├── stripe/                  # Stripe client + product/tier table
│   │   ├── data/                    # Real product DB, rebate DB, scenario DB
│   │   ├── calculations/savings.ts  # All savings math
│   │   └── commercial/
│   │       ├── utils.ts             # fetchEntropyJson(): server-side proxy to entropy-api
│   │       └── demo-data.ts         # Fallback slug if API is unreachable
│   └── app/
│       ├── (residential)            # /, /intake, /calculator, /products, /rebates, /contractors
│       ├── auth/                    # Supabase auth flows (password, magic link, Google OAuth)
│       ├── dashboard/               # Homeowner + contractor dashboards
│       ├── api/                     # Stripe webhooks, lead purchase, NREL/Mapbox proxies, uploadthing
│       └── commercial/              # /commercial, /commercial/demo, /commercial/buildings/[id], /commercial/onboarding, /commercial/rules, /commercial/admin/tag-queue
├── wrangler.toml                    # Cloudflare Worker config
├── next.config.js                   # CSP, HSTS, X-Frame-Options
├── vercel.json                      # Legacy — left for reference; primary deploy is Cloudflare
└── CLAUDE.md                        # Domain knowledge for AI assistants
```

The commercial backend lives in a sibling repo: `../entropy-dashboard/apps/api`. It is **not** a git submodule — they are deployed independently and communicate over HTTP.

---

## Domain rules (read these before touching numbers)

- The **One Big Beautiful Bill Act** (signed July 4, 2025) terminated **Section 25C** and **Section 25D** federal credits for property placed in service after Dec 31, 2025. **Do not surface the old "30% solar credit" copy.**
- **HEEHRA** (≤$8,000 heat pump) and **HOMES/HERO** are not yet live in Maryland. Always set `available: false` in `src/lib/data/rebates.ts`.
- Heat pump per-BTU economics in MD are still slightly worse than gas at current rates. Communicate honestly — do not oversell.
- All utility rates live in `src/lib/types/index.ts → UTILITY_RATES`. Cross-reference the foundation document before changing.

Full domain reference: see `CLAUDE.md`.

---

## Known gaps

See `CLAUDE.md` § "Known bugs / TODOs" for the live punch list. High-impact items still open:

- Mobile nav hamburger is inert (`src/app/layout.tsx`).
- Rate limiter resets on Cloudflare cold start (`src/lib/ratelimit.ts`); upgrade to Upstash for scale.
- `/dashboard/assessments`, `/dashboard/rebates`, `/dashboard/contractors`, `/dashboard/contractor/profile` are stubs.
- Cron handlers (`/api/cron/*`) for lead expiry + rebate reminders are not built.
- Commercial bill-parse pipeline works end-to-end but has not been load-tested.

---

## License & contact

Private — not yet open source. Contact: oskoui.amin@gmail.com.
