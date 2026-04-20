import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/supabase/server";
import { API_INTERNAL_URL } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getUserProfile();
  if (!profile) return new NextResponse("sign in required", { status: 401 });
  if (profile.role !== "ADMIN") {
    return new NextResponse("staff access required", { status: 403 });
  }

  const upstream = await fetch(`${API_INTERNAL_URL}/admin/tag-queue`, {
    headers: {
      "x-entropy-auth-secret":
        process.env.ENTROPY_AUTH_SHARED_SECRET ?? "entropy-local-web-auth-secret",
    },
    cache: "no-store",
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
