// @ts-check

// Enable Cloudflare bindings during `next dev` — gracefully skipped if the
// package isn't installed yet (e.g. fresh clone before npm install).
try {
  const { initOpenNextCloudflareForDev } = require("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
} catch {
  // @opennextjs/cloudflare not installed yet — run `npm install` to enable
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "utfs.io" }, // uploadthing
    ],
  },

  // ─── Security Headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // XSS protection (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — deny unnecessary browser APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          // HSTS — force HTTPS (1 year, include subdomains)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Next.js inline scripts + Stripe + Mapbox
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://api.mapbox.com https://cdn.jsdelivr.net",
              // Styles: self + inline (Tailwind) + Google Fonts + Mapbox
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
              // Fonts: self + Google + Mapbox
              "font-src 'self' https://fonts.gstatic.com data:",
              // Images: self + data URIs + Supabase storage + Uploadthing + Stripe + Mapbox tiles
              "img-src 'self' data: blob: https://*.supabase.co https://utfs.io https://*.stripe.com https://api.mapbox.com https://*.mapbox.com",
              // Connections: self + Supabase + Stripe + Uploadthing + NREL + Mapbox
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://uploadthing.com https://utfs.io https://developer.nrel.gov https://api.mapbox.com https://events.mapbox.com",
              // Frames: Stripe only
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              // Workers: self + blob for Mapbox GL
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
      // Stripe webhook endpoint — must not have CSRF restrictions
      {
        source: "/api/stripe/webhooks",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },

  // ─── Redirects ──────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect logged-out users from dashboard
      // (handled in middleware, but belt-and-suspenders)
    ];
  },
};

module.exports = nextConfig;
