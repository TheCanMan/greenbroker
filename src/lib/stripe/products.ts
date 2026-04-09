/**
 * GreenBroker Stripe Product Configuration
 * Prices are created in the Stripe Dashboard and referenced by ID via env vars.
 *
 * Contractor Subscription Tiers:
 * ─────────────────────────────────────────────────────────────────────────────
 * BASIC       $99/month  — 10 leads/month, basic profile, standard listing
 * PROFESSIONAL $199/month — 25 leads/month, preferred badge, priority placement
 * ELITE       $299/month — Unlimited leads, elite badge, post-install verification
 *
 * Per-Lead Pricing (no subscription):
 * ─────────────────────────────────────────────────────────────────────────────
 * Standard lead:   $40 one-time
 * Pre-qualified:   $65 one-time (homeowner has completed full intake + audit booked)
 * Premium lead:    $75 one-time (full solar design, audit done, income-qualified)
 */

export const STRIPE_PRODUCTS = {
  subscriptions: {
    BASIC: {
      priceId: process.env.STRIPE_PRICE_BASIC_MONTHLY!,
      name: "Basic",
      monthlyPrice: 99,
      features: [
        "10 qualified leads per month",
        "Basic contractor profile",
        "Standard marketplace listing",
        "Email lead notifications",
      ],
      leadCreditsPerMonth: 10,
      leadPricePerExtra: 4000, // $40 in cents per extra lead
    },
    PROFESSIONAL: {
      priceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
      name: "Professional",
      monthlyPrice: 199,
      features: [
        "25 qualified leads per month",
        "Preferred badge on listing",
        "Priority search placement",
        "SMS + email lead notifications",
        "Review response tools",
      ],
      leadCreditsPerMonth: 25,
      leadPricePerExtra: 3500, // $35 per extra lead (discounted)
    },
    ELITE: {
      priceId: process.env.STRIPE_PRICE_ELITE_MONTHLY!,
      name: "Elite",
      monthlyPrice: 299,
      features: [
        "Unlimited leads",
        "Elite badge + top placement",
        "Post-installation verification program",
        "GreenBroker $2,500 workmanship guarantee",
        "Dedicated account manager",
        "Featured in homeowner reports",
      ],
      leadCreditsPerMonth: Infinity,
      leadPricePerExtra: 0,
    },
  },

  // One-time lead purchases (for non-subscribers or extra leads)
  leads: {
    STANDARD: {
      priceInCents: 4000,
      name: "Standard Lead",
      description: "Homeowner completed intake, basic qualification",
    },
    PRE_QUALIFIED: {
      priceInCents: 6500,
      name: "Pre-Qualified Lead",
      description: "Full intake + energy audit booked, specific project scope",
    },
    PREMIUM: {
      priceInCents: 7500,
      name: "Premium Lead",
      description: "Income-qualified, solar design ready, immediate project",
    },
  },
} as const;

export type SubscriptionTierKey = keyof typeof STRIPE_PRODUCTS.subscriptions;
export type LeadTierKey = keyof typeof STRIPE_PRODUCTS.leads;
