import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/ratelimit";

const schema = z.object({
  q: z.string().min(3).max(200),
  types: z.string().default("postcode,address"),
  country: z.string().default("US"),
  proximity: z.string().default("-77.1945,39.1437"), // Center of Montgomery County, MD
});

/**
 * GET /api/geocode?q=123+Main+Street+Rockville
 *
 * Proxies Mapbox Geocoding API for address autocomplete.
 * Keeps the Mapbox token server-side for addresses beyond simple autocomplete.
 *
 * Note: For the frontend autocomplete widget, use the PUBLIC Mapbox token directly.
 * This endpoint is for server-side address validation and ZIP extraction.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(ip, RATE_LIMITS.external);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const { q, types, country, proximity } = schema.parse(
      Object.fromEntries(searchParams)
    );

    const mapboxUrl = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
    );
    mapboxUrl.searchParams.set("access_token", process.env.MAPBOX_SECRET_TOKEN!);
    mapboxUrl.searchParams.set("types", types);
    mapboxUrl.searchParams.set("country", country);
    mapboxUrl.searchParams.set("proximity", proximity);
    mapboxUrl.searchParams.set("limit", "5");
    mapboxUrl.searchParams.set("autocomplete", "true");

    const res = await fetch(mapboxUrl.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Mapbox API error: ${res.status}`);
    }

    const data = await res.json();

    // Return simplified format
    const results = data.features?.map((f: any) => ({
      id: f.id,
      text: f.text,
      placeName: f.place_name,
      center: f.center, // [lng, lat]
      zip: f.context?.find((c: any) => c.id?.startsWith("postcode"))?.text ?? null,
      city: f.context?.find((c: any) => c.id?.startsWith("place"))?.text ?? null,
      state: f.context?.find((c: any) => c.id?.startsWith("region"))?.short_code?.replace("US-", "") ?? null,
    }));

    return NextResponse.json({ results: results ?? [] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("Geocode error:", error);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
