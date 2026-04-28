import { NextResponse } from "next/server";
import {
  getCommercialDemoTrend,
  isCommercialDemoFindingId,
} from "@/lib/commercial/demo-data";
import { API_INTERNAL_URL } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (isCommercialDemoFindingId(id)) {
    return NextResponse.json(getCommercialDemoTrend(id));
  }

  const upstream = await fetch(
    `${API_INTERNAL_URL}/findings/${encodeURIComponent(id)}/trend`,
    { cache: "no-store" },
  );
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
