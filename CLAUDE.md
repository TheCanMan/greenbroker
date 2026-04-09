# GreenBroker — Claude Code Context

## What this is

GreenBroker is a full-stack SaaS platform combining **Labdoor-style product rankings** with an **Angi-style contractor marketplace** for residential energy efficiency, piloting in **Rockville, MD (ZIP 20850 / Montgomery County)**. It is a Next.js 14 App Router app with TypeScript, Tailwind, Supabase (DB + auth), Stripe (subscriptions + per-lead payments), and Vercel (hosting).

The research foundation document (`../GreenBroker foundation document...`) contains the authoritative source data for all product specs, utility rates, rebate amounts, and savings projections. **Do not change any numbers without checking that document.**

---

## Critical domain knowledge

### The policy shift that defines everything

The **One Big Beautiful Bill Act** (signed July 4, 2025) **eliminated** the two largest federal homeowner energy incentives:
- **Section 25C** (Energy Efficient Home Improvement Credit): **terminated** for property placed in service after December 31, 2025
- **Section 25D** (Residential Clean Energy Credit): **terminated** for expenditures after December 31, 2025

Many online sources still show "30% solar credit available through 2032" — **this is outdated**. State and local programs are now the primary financial drivers.

### Active primary incentives (April 2026)

| Program | Max Amount | Notes |
|---------|-----------|-------|
| PEPCO EmPOWER (electrification) | $15,000 | 75% of cost, no income req, requires audit |
| PEPCO EmPOWER (non-electrification) | $10,000 | Insulation/air sealing |
| PEPCO EmPOWER Make-Ready | $3,000 | Ductwork/panel for heat pump |
| PEPCO EmPOWER HPWH | $1,600 | Heat pump water heater |
| PEPCO EmPOWER Thermostat | $100 | ecobee or Nest |
| Electrify MC (heat pump) | $2,500 | Montgomery County |
| Electrify MC (HPWH) | $1,500 | Stacks with PEPCO HPWH |
| Maryland MSAP (solar) | $7,500 | $750/kW, income-qualified ≤150% AMI |
| Maryland RCES (battery) | $5,000 | 30% of cost, limited $2M budget |
| Maryland SRECs | ~$70/credit | 1.5x multiplier through Jan 2028 |

### NOT YET available (but in law)
- HEEHRA (heat pump up to $8,000, HPWH up to $1,750) — Maryland RFP issued July 2025, expected late 2026+
- HOMES/HERO whole-home rebate — also not yet live in Maryland

### Utility rates (used throughout all calculations)
```
PEPCO electricity: $0.217/kWh (blended all-in, April 2026)
Washington Gas: $1.40/therm (all-in, December 2024)
SREC price: $70/credit certified (1.5x multiplier), ~$49 standard
Peak sun hours Rockville: 4.5 hours/day
Solar specific yield: 1,300 kWh/kW/year
Net metering: 1:1 retail rate
```

### Baseline home for all scenarios
2,000 sq ft, built 1980, 3BR/2BA Rockville home:
- Annual electricity: 11,000 kWh ($2,493/year)
- Annual gas: 940 therms ($1,316/year)
- Total energy cost: $3,809/year

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Row Level Security) |
| ORM | Prisma 5 (pooler URL for runtime, direct URL for migrations) |
| Auth | Supabase Auth via `@supabase/ssr` (cookie-based, SSR-safe) |
| Payments | Stripe (subscriptions + per-lead PaymentIntents) |
| Email | Resend (transactional) |
| File uploads | Uploadthing (utility bills, photos, contractor logos) |
| Solar API | NREL PVWatts V8 (proxied, 24-hour cache) |
| Geocoding | Mapbox Geocoding V5 (proxied) |
| Hosting | Vercel (region: iad1) |
| Charts | Recharts |
| Icons | Lucide React |
| UI Primitives | Radix UI |
| Env validation | @t3-oss/env-nextjs + Zod |

---

## Project structure

```
greenbroker/
├── prisma/
│   ├── schema.prisma               # Full schema: Profile, HomeAssessment, Contractor, Lead, Review, etc.
│   ├── seed.ts                     # Seed script: sample contractors + homeowner assessment
│   └── migrations/
│       └── 001_rls_policies.sql    # Supabase RLS policies + triggers + storage buckets
│
├── supabase/
│   └── migrations/                 # (symlinked from prisma/migrations for CLI usage)
│
├── src/
│   ├── middleware.ts               # Session refresh, route protection, Stripe webhook guard
│   │
│   ├── lib/
│   │   ├── env.ts                  # @t3-oss/env-nextjs schema — validates ALL env vars at build time
│   │   ├── ratelimit.ts            # In-process sliding window rate limiter (upgrade to Upstash for scale)
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts           # createBrowserClient (use client only)
│   │   │   ├── server.ts           # createServerClient, createAdminClient, getUser, getUserProfile
│   │   │   └── types.ts            # Manual Database interface for TypeScript
│   │   │
│   │   ├── stripe/
│   │   │   ├── client.ts           # Stripe singleton (apiVersion: 2024-06-20)
│   │   │   └── products.ts         # STRIPE_PRODUCTS: subscription tiers + per-lead pricing
│   │   │
│   │   ├── email/
│   │   │   └── resend.ts           # sendEmail, sendAssessmentConfirmationEmail, sendLeadNotificationEmail
│   │   │
│   │   ├── calculations/
│   │   │   └── savings.ts          # All calculation functions + formatCurrency
│   │   │
│   │   ├── data/
│   │   │   ├── products.ts         # Real product database (heat pumps, HPWHs, solar, batteries, etc.)
│   │   │   ├── rebates.ts          # Full rebate database with stacking logic
│   │   │   └── scenarios.ts        # 5 savings scenarios with real numbers
│   │   │
│   │   ├── types/index.ts          # Core TypeScript types + UTILITY_RATES constants
│   │   │
│   │   └── validations/
│   │       ├── assessment.ts       # AssessmentSchema (Zod)
│   │       └── contractor.ts       # ContractorApplicationSchema (Zod)
│   │
│   └── app/
│       ├── layout.tsx              # Root layout with nav + footer
│       ├── page.tsx                # Home page
│       │
│       ├── auth/
│       │   ├── callback/route.ts   # Supabase OAuth code exchange
│       │   ├── login/page.tsx      # Login (password + magic link + Google OAuth)
│       │   ├── signup/page.tsx     # Signup (homeowner vs contractor selection)
│       │   └── reset-password/page.tsx
│       │
│       ├── dashboard/
│       │   ├── layout.tsx          # Dashboard shell: role-based nav (homeowner vs contractor)
│       │   ├── page.tsx            # Homeowner dashboard: energy stats, rebate tracker, history
│       │   └── contractor/
│       │       ├── page.tsx        # Contractor overview: stats, leads, subscription
│       │       ├── billing/page.tsx # Subscription plans, Stripe portal, credit info
│       │       └── leads/page.tsx  # Leads list with status filter, pagination, status updates
│       │
│       ├── api/
│       │   ├── assessments/route.ts    # POST (save + calc) / GET (list user's assessments)
│       │   ├── solar-estimate/route.ts # GET — NREL PVWatts V8 proxy
│       │   ├── geocode/route.ts        # GET — Mapbox geocoding proxy
│       │   ├── leads/
│       │   │   └── purchase/route.ts   # POST — buy a lead (credits or Stripe PaymentIntent)
│       │   ├── uploadthing/
│       │   │   ├── core.ts             # UploadThing file router (4 routes)
│       │   │   └── route.ts
│       │   └── stripe/
│       │       ├── create-checkout/route.ts  # POST — create subscription checkout session
│       │       ├── portal/route.ts           # POST — create billing portal session
│       │       └── webhooks/route.ts         # POST — handle all Stripe events (idempotent)
│       │
│       ├── intake/page.tsx         # Multi-step homeowner intake → personalized plan
│       ├── calculator/page.tsx     # Interactive savings calculator
│       ├── rebates/page.tsx        # Full rebate database + stacking scenarios
│       ├── products/               # Product category hub + individual category pages
│       └── contractors/            # Contractor marketplace + apply flow
│
├── .env.local.example              # Full documentation of all required env vars
├── .gitignore                      # Standard Next.js + env file ignores
├── next.config.js                  # Security headers (CSP, HSTS, X-Frame-Options, etc.)
├── vercel.json                     # Deployment config: regions, function timeouts, crons
├── package.json                    # All production deps; `prisma.seed` configured
└── CLAUDE.md                       # This file
```

---

## Database schema (Prisma)

Models: `Profile`, `HomeAssessment`, `Contractor`, `Lead`, `Review`, `RebateApplication`, `StripeEvent`, `ContactRequest`

Key enums:
- `Role`: HOMEOWNER | CONTRACTOR | ADMIN
- `ContractorTier`: STANDARD | PREFERRED | ELITE
- `ContractorStatus`: PENDING_REVIEW | ACTIVE | SUSPENDED | REJECTED
- `SubscriptionTier`: BASIC | PROFESSIONAL | ELITE
- `LeadStatus`: NEW | CONTACTED | QUOTED | WON | LOST | EXPIRED

Row Level Security is enforced at the Postgres level via `supabase/migrations/001_rls_policies.sql`. A trigger `handle_new_user()` auto-creates a `profiles` row on every Supabase auth signup.

---

## Stripe subscription tiers

| Tier | Price | Leads/month | Extra lead cost |
|------|-------|-------------|-----------------|
| BASIC | $99/mo | 5 | $40 |
| PROFESSIONAL | $199/mo | 12 | $35 |
| ELITE | $299/mo | 25 | $25 |

All new subscriptions start with a **7-day free trial**.

Per-lead pricing (when credits run out or bought à la carte):
- STANDARD: $40
- PRE_QUALIFIED: $65
- PREMIUM: $75

---

## Authentication flow

1. User signs up at `/auth/signup` → email confirmation link sent
2. User clicks link → `/auth/callback` exchanges code for Supabase session
3. Supabase trigger creates `profiles` row with role (HOMEOWNER or CONTRACTOR)
4. Middleware refreshes session on every request, protects routes by role
5. Contractors go to `/dashboard/contractor`, homeowners to `/dashboard`
6. Google OAuth supported on both login and signup pages

---

## Rate limiting

In-process Map-based sliding window — works on Vercel's Edge Network but resets on cold start. For production scale, upgrade to Upstash Redis (`@upstash/ratelimit`). Current limits:
- Standard API routes: 60 req/min per IP
- Auth routes: 10 req/min per IP
- External API proxies (solar, geocode): 20 req/min per IP
- Purchase routes: 5 req per 10 min per user

---

## Security measures

- **CSP headers** in `next.config.js`: covers Stripe, Mapbox, Supabase, Uploadthing
- **HSTS** with 1-year max-age + includeSubDomains + preload
- **X-Frame-Options DENY** — blocks clickjacking
- **RLS** on all Supabase tables — users can only read/write their own data
- **Stripe webhook signature verification** — all events verified before processing
- **Stripe event idempotency** — `StripeEvent` table prevents duplicate processing
- **Env validation at build time** — `src/lib/env.ts` fails the build if any required env var is missing
- **Admin client gated** — `createAdminClient()` only used server-side for cross-user reads (e.g. lead purchase fetching assessment data)
- **Route protection in middleware** — `/dashboard/contractor/*` redirects non-contractors; `/api/stripe/webhooks` blocks requests without `stripe-signature` header

---

## Running the project

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in all values in .env.local

# Generate Prisma client
npm run db:generate

# Push schema to Supabase (development)
npm run db:push

# Apply RLS policies (run in Supabase SQL Editor)
# — supabase/migrations/001_rls_policies.sql

# Seed sample data
npm run db:seed

# Start development server
npm run dev

# Type check
npm run type-check
```

---

## Vercel deployment checklist

1. Push to GitHub and import project in Vercel
2. Set all env vars from `.env.local.example` in Vercel Dashboard → Settings → Environment Variables
3. For `DATABASE_URL`: use Supabase **pooler** connection string (port 6543)
4. For `DIRECT_URL`: use Supabase **direct** connection string (port 5432)
5. Set Stripe webhook endpoint to `https://yourdomain.com/api/stripe/webhooks`
6. Subscribe to webhook events: `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`, `checkout.session.completed`
7. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`
8. Set `NEXT_PUBLIC_APP_URL` to your production domain (no trailing slash)
9. `vercel.json` configures `iad1` region (closest to Rockville, MD)

---

## Known bugs / TODOs

| Issue | Location | Fix |
|-------|----------|-----|
| `BatteryProduct` has `lifespanYears` twice | `src/lib/data/products.ts` | Remove duplicate field |
| `ProductCategory` missing "dryer" | `src/lib/types/index.ts` | Add `"dryer"` to the union type |
| Pool pumps use `ev-charger` category | `src/lib/data/products.ts` | Add `"pool-pump"` category |
| Intake page HVAC urgency buttons | `src/app/intake/page.tsx` | Wire buttons to update state |
| Mobile nav hamburger is inert | `src/app/layout.tsx` | Create `src/components/MobileNav.tsx` client component |
| Rate limiter resets on cold start | `src/lib/ratelimit.ts` | Upgrade to Upstash Redis for production |
| Contractor profile page missing | `/dashboard/contractor/profile` | Build profile edit form |
| Homeowner assessments page missing | `/dashboard/assessments` | Build detailed assessment view |
| Homeowner rebates page missing | `/dashboard/rebates` | Build personalized rebate tracker |
| Homeowner contractors page missing | `/dashboard/contractors` | Build hired contractors list |
| Cron routes missing | `/api/cron/*` | Build expire-leads and rebate-reminders cron handlers |

---

## Data integrity rules

1. **Never change utility rates** without updating the research document reference. Current rates are locked in `src/lib/types/index.ts` → `UTILITY_RATES`.
2. **Never show federal 25C/25D credits as available** — they were eliminated Jan 1, 2026.
3. **Always mark HEEHRA/HOMES as `available: false`** in rebates data.
4. **SREC price note**: The 1.5x Brighter Tomorrow multiplier runs through January 2028. Standard price after is ~$40–$59. Conservative long-term average: ~$45/SREC.
5. **Heat pump economics**: At current Maryland rates, gas heating is still slightly cheaper per BTU than heat pump electric. This must be communicated honestly — do not oversell heat pump savings.

---

## Licensing requirements (Montgomery County contractors)

| Contractor Type | Required Licenses | Critical Notes |
|----------------|-------------------|----------------|
| Any contractor | MHIC | Now requires $500K GL insurance (since June 2024) |
| HVAC | HVACR Board license + EPA 608 Universal | 608 explicitly required for heat pumps |
| Electrician | Maryland Statewide Master Electrician | $300K GL + $100K property damage |
| Plumber | State Board + WSSC Water License | State license alone NOT sufficient for Montgomery County |
| Solar | MHIC + Master Electrician; NABCEP recommended | NABCEP not legally required but gold standard |
| Energy Auditor | BPI HEP Energy Auditor | Required for EmPOWER HPwES program |

Verification URL: `labor.maryland.gov/pq/` — no API, searchable programmatically.

---

## Revenue model

1. **Contractor lead fees** ($40–$75/lead + $99–$299/month subscription) — primary MVP revenue
2. **Rebate processing fees** ($50–$200 flat, full-service navigation) — validated by Sealed Pro pivot
3. **Energy supply brokerage** ($30–$50/customer/year recurring) — requires Maryland PSC license
4. **Financing referral fees** (0.5–2% of green loan value) — partner with MC Green Bank
5. **Carbon credit aggregation** — long-term; track data now
