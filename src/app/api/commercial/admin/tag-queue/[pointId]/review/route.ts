import { NextRequest, NextResponse } from "next/server";
import { getUser, getUserProfile } from "@/lib/supabase/server";
import { API_INTERNAL_URL } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pointId: string }> },
) {
  const { pointId } = await params;
  const user = await getUser();
  if (!user) return new NextResponse("sign in required", { status: 401 });
  const profile = await getUserProfile();
  if (!profile || profile.role !== "ADMIN") {
    return new NextResponse("staff access required", { status: 403 });
  }

  const payload = await req.json();
  const upstream = await fetch(
    `${API_INTERNAL_URL}/admin/tag-queue/${encodeURIComponent(pointId)}/review`,
    {
      method: "POST",
      headers: {
        "x-entropy-auth-secret":
          process.env.ENTROPY_AUTH_SHARED_SECRET ?? "entropy-local-web-auth-secret",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, reviewer_user_id: user.id }),
      cache: "no-store",
    },
  );
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
