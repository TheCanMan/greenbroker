import { NextRequest, NextResponse } from "next/server";
import { API_INTERNAL_URL } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const upstream = await fetch(`${API_INTERNAL_URL}/onboarding/parse-bill`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
