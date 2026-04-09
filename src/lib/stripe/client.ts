import "server-only";
import Stripe from "stripe";

/**
 * Stripe server-side client (singleton).
 * Never import this in client components.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
  appInfo: {
    name: "GreenBroker",
    version: "0.1.0",
    url: "https://greenbroker.com",
  },
});

/**
 * Format Stripe amounts (cents → dollars)
 */
export function formatStripeAmount(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
