import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * GreenBroker Environment Variable Validation
 * Validates all env vars at build time — fails fast rather than runtime errors.
 * Run: npx tsx src/lib/env.ts to test outside Next.js
 */
export const env = createEnv({
  server: {
    // ─── Supabase (server-side) ────────────────────────────────────────────
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),

    // ─── Stripe ────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
    STRIPE_PRICE_BASIC_MONTHLY: z.string().startsWith("price_"),
    STRIPE_PRICE_PROFESSIONAL_MONTHLY: z.string().startsWith("price_"),
    STRIPE_PRICE_ELITE_MONTHLY: z.string().startsWith("price_"),

    // ─── Resend (email) ────────────────────────────────────────────────────
    RESEND_API_KEY: z.string().startsWith("re_"),
    EMAIL_FROM: z.string().email().default("noreply@greenbroker.com"),

    // ─── NREL PVWatts ──────────────────────────────────────────────────────
    NREL_API_KEY: z.string().min(1),

    // ─── Uploadthing ───────────────────────────────────────────────────────
    UPLOADTHING_SECRET: z.string().startsWith("sk_"),
    UPLOADTHING_APP_ID: z.string().min(1),

    // ─── Mapbox (server geocoding) ─────────────────────────────────────────
    MAPBOX_SECRET_TOKEN: z.string().startsWith("sk."),

    // ─── App ───────────────────────────────────────────────────────────────
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_URL: z.string().url().default("http://localhost:3000"),
  },

  client: {
    // ─── Supabase (public) ─────────────────────────────────────────────────
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

    // ─── Stripe (public) ───────────────────────────────────────────────────
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),

    // ─── Mapbox (public) ───────────────────────────────────────────────────
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().startsWith("pk."),

    // ─── Uploadthing (public) ──────────────────────────────────────────────
    NEXT_PUBLIC_UPLOADTHING_APP_ID: z.string().min(1),

    // ─── App (public) ──────────────────────────────────────────────────────
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  },

  runtimeEnv: {
    // Server
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_BASIC_MONTHLY: process.env.STRIPE_PRICE_BASIC_MONTHLY,
    STRIPE_PRICE_PROFESSIONAL_MONTHLY: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    STRIPE_PRICE_ELITE_MONTHLY: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NREL_API_KEY: process.env.NREL_API_KEY,
    UPLOADTHING_SECRET: process.env.UPLOADTHING_SECRET,
    UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
    MAPBOX_SECRET_TOKEN: process.env.MAPBOX_SECRET_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    // Client
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_UPLOADTHING_APP_ID: process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
