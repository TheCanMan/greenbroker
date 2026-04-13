import { NextRequest, NextResponse } from "next/server";
import { searchVendors } from "@/lib/data/vendors";

// GET /api/vendors — search the vendor directory
// Query params: category, type, zip, verifiedOnly
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const results = searchVendors({
    category: searchParams.get("category") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    zip: searchParams.get("zip") ?? undefined,
    verifiedOnly: searchParams.get("verifiedOnly") === "true",
  });
  return NextResponse.json({ count: results.length, vendors: results });
}
