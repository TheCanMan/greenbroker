import { NextRequest, NextResponse } from "next/server";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { getLowestPriceForProduct, getVendorsForProduct } from "@/lib/data/vendors";

// GET /api/catalog — search across all products and their vendors
// Query params:
//   category  — product category (heat-pump, water-heater, etc.)
//   tier      — efficiency tier
//   zip       — filter vendors by service ZIP
//   maxPrice  — max price in dollars
//   brand     — filter by brand (case-insensitive)
//   energyStar — "true" to filter to EnergyStar Most Efficient only
//   sort      — price-low | price-high | efficiency | savings

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const tier = searchParams.get("tier");
  const zip = searchParams.get("zip") ?? undefined;
  const maxPrice = searchParams.get("maxPrice");
  const brand = searchParams.get("brand");
  const energyStar = searchParams.get("energyStar") === "true";
  const sort = searchParams.get("sort") ?? "savings";

  let products = ALL_PRODUCTS.filter((p) => {
    if (category && p.category !== category) return false;
    if (tier && p.tier !== tier) return false;
    if (brand && !p.brand.toLowerCase().includes(brand.toLowerCase())) return false;
    if (energyStar && !p.energyStarMostEfficient) return false;
    return true;
  });

  // Enrich with vendor data
  const enriched = products.map((product) => {
    const listings = getVendorsForProduct(product.id);
    // If ZIP is provided, filter listings to vendors servicing that ZIP
    const filteredListings = zip
      ? listings.filter(
          ({ vendor }) =>
            vendor.nationalShipping ||
            (vendor.servicesZips && vendor.servicesZips.includes(zip))
        )
      : listings;

    const lowestPrice = getLowestPriceForProduct(product.id);

    return {
      product,
      lowestPrice,
      vendorCount: filteredListings.length,
      vendors: filteredListings.map((l) => ({
        id: l.vendor.id,
        name: l.vendor.name,
        type: l.vendor.type,
        price: l.listing.price,
        priceNote: l.listing.priceNote,
        stockStatus: l.listing.stockStatus,
        includesInstallation: l.listing.includesInstallation,
      })),
    };
  });

  // Filter by maxPrice (based on lowest vendor price, falling back to MSRP)
  const maxP = maxPrice ? Number(maxPrice) : undefined;
  let filtered = enriched;
  if (maxP !== undefined && !Number.isNaN(maxP)) {
    filtered = enriched.filter(({ product, lowestPrice }) => {
      const price = lowestPrice ?? product.installedCostMin ?? product.msrpMin;
      return price <= maxP;
    });
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sort) {
      case "price-low":
        return (a.lowestPrice ?? a.product.msrpMin) - (b.lowestPrice ?? b.product.msrpMin);
      case "price-high":
        return (b.lowestPrice ?? b.product.msrpMin) - (a.lowestPrice ?? a.product.msrpMin);
      case "savings":
        return (b.product.annualSavingsVsBaseline ?? 0) - (a.product.annualSavingsVsBaseline ?? 0);
      case "efficiency": {
        // Rank: most-efficient > best > better > good
        const rank: Record<string, number> = { "most-efficient": 4, best: 3, better: 2, good: 1 };
        return (rank[b.product.tier] ?? 0) - (rank[a.product.tier] ?? 0);
      }
      default:
        return 0;
    }
  });

  return NextResponse.json({
    count: filtered.length,
    results: filtered,
  });
}
