import { NextRequest, NextResponse } from "next/server";
import { API_INTERNAL_URL } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${API_INTERNAL_URL}/onboarding/tier0`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
