import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Supabase Auth callback handler.
 *
 * On Cloudflare Workers, the PKCE code verifier is stored by the browser
 * client but can't be reliably read server-side. So this route simply
 * redirects to a client-side page that completes the code exchange
 * using the browser's Supabase client (which has access to its own storage).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Pass all query params through to the client-side handler
  const code = searchParams.get("code") ?? "";
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error") ?? "";
  const errorDescription = searchParams.get("error_description") ?? "";

  // If there's an error from the OAuth provider, redirect to login immediately
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Redirect to client-side handler that can do PKCE exchange
  const confirmUrl = new URL("/auth/confirm", origin);
  if (code) confirmUrl.searchParams.set("code", code);
  confirmUrl.searchParams.set("next", next);

  return NextResponse.redirect(confirmUrl);
}
