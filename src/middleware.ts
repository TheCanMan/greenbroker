import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// ─── Routes that require authentication ───────────────────────────────────────
const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/auth/login", "/auth/signup"];
const CONTRACTOR_ROUTES = ["/dashboard/contractor"];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Build Supabase client with cookie passthrough ────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ─── IMPORTANT: Always call getUser() to refresh session ─────────────────
  // This is required by @supabase/ssr — don't skip this step.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── Rate limiting headers ────────────────────────────────────────────────
  // Basic rate limit signaling — real enforcement is in individual API routes
  if (pathname.startsWith("/api/")) {
    supabaseResponse.headers.set("X-RateLimit-Policy", "100;w=60");
  }

  // ─── Protect dashboard routes ─────────────────────────────────────────────
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Redirect logged-in users away from auth pages ───────────────────────
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ─── Contractor-only routes ───────────────────────────────────────────────
  // Defense-in-depth: verify role at the edge, not just in pages.
  if (CONTRACTOR_ROUTES.some((r) => pathname.startsWith(r)) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "CONTRACTOR") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ─── Admin routes ─────────────────────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ─── Security: block API routes from browser direct navigation ───────────
  // (Stripe webhook endpoint should only be called by Stripe)
  if (pathname === "/api/stripe/webhooks") {
    const stripeSignature = request.headers.get("stripe-signature");
    if (!stripeSignature) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match everything except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
