import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  SUPPLIER_OFFERS as SEED_OFFERS,
  type SupplierOffer,
} from "@/lib/data/supplier-offers";

export const dynamic = "force-dynamic";

/**
 * GET /api/supplier-offers?commodity=electricity
 *
 * Returns curated supplier offers from the supplier_offers Postgres table.
 * Falls back to the file-based seed (src/lib/data/supplier-offers.ts) when
 * the table is missing or empty so the comparison page never goes blank.
 *
 * Response is normalized to camelCase regardless of source.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commodity = searchParams.get("commodity") ?? "electricity";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("supplier_offers" as never)
    .select(
      "id, supplier_name, license_number, commodity, rate, fixed_or_variable, " +
        "term_months, monthly_fee, early_termination_fee, renewable_percent, " +
        "intro_rate, intro_months, url, source_url, last_verified, warnings"
    )
    .eq("commodity", commodity);

  // Schema-missing or empty → seed fallback (with a flag so the UI can warn).
  const tableUnavailable =
    error?.code === "42P01" ||
    error?.code === "PGRST116" ||
    error?.message?.includes("schema cache");

  if (error && !tableUnavailable) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  if (rows.length > 0) {
    const offers = rows.map(rowToOffer);
    return NextResponse.json({
      source: "db" as const,
      offers,
    });
  }

  return NextResponse.json({
    source: tableUnavailable ? "seed_table_missing" : "seed_empty_table",
    offers: SEED_OFFERS.filter((o) => o.commodity === commodity),
    notice:
      "Showing seed data. Curated supplier offers will appear once the supplier_offers table is populated via POST /api/admin/supplier-offers.",
  });
}

function rowToOffer(r: Record<string, unknown>): SupplierOffer {
  return {
    id: String(r.id),
    supplierName: String(r.supplier_name),
    licenseNumber: String(r.license_number),
    commodity: r.commodity as SupplierOffer["commodity"],
    rate: Number(r.rate),
    rateType: r.fixed_or_variable as SupplierOffer["rateType"],
    termMonths: Number(r.term_months),
    monthlyFee: Number(r.monthly_fee ?? 0),
    earlyTerminationFee: Number(r.early_termination_fee ?? 0),
    renewablePercent: Number(r.renewable_percent ?? 0),
    introRate: r.intro_rate != null ? Number(r.intro_rate) : undefined,
    introMonths: r.intro_months != null ? Number(r.intro_months) : undefined,
    url: r.url ? String(r.url) : undefined,
    lastVerified: r.last_verified
      ? new Date(String(r.last_verified)).toISOString().slice(0, 10)
      : "unknown",
  };
}
