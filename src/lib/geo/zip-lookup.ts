// ─────────────────────────────────────────────────────────────────────────────
// ZIP → (state, county) lookup
//
// Why a hand-curated table:
//   - The intake form uses ZIP because users know it. We need to pin them to
//     a county for rebate eligibility.
//   - Real ZIP-to-county mapping is many-to-many (a single ZIP can span two
//     counties). The CENSUS ZCTA crosswalk is the gold standard but is a
//     ~1MB CSV. We don't need it on the edge for the pilot footprint.
//   - For now: seeded MD coverage for the counties where we have rebate data.
//
// Expansion path:
//   - When we ship to a new state, either extend ZIP_PREFIX_TO_COUNTY or
//     swap in a server-side endpoint backed by the Census crosswalk.
//   - For ZIPs that span multiple counties, return all candidates and let
//     the user pick during intake.
// ─────────────────────────────────────────────────────────────────────────────

import { COUNTY_BY_ID } from "./registry";
import type { CountyId, StateCode } from "./types";

/**
 * Coarse ZIP-prefix → county mapping. First-match wins, so order matters:
 * more specific prefixes should appear before less specific ones.
 *
 * Coverage today:
 *   - Maryland counties in the EmPOWER + Electrify MC service footprint.
 *   - DC.
 */
const ZIP_PREFIX_TO_COUNTY: Array<{ prefix: string; countyId: CountyId }> = [
  // Montgomery County, MD (208xx, 209xx — most of upper-NW MD)
  { prefix: "208", countyId: "MD:montgomery" },
  { prefix: "209", countyId: "MD:montgomery" },

  // Prince George's, MD (207xx)
  { prefix: "207", countyId: "MD:prince-georges" },

  // Frederick, MD (217xx)
  { prefix: "217", countyId: "MD:frederick" },

  // Howard, MD (210xx-ish — overlap with Anne Arundel; pick Howard for 210xx
  // Columbia / Ellicott City, AA for 211xx)
  { prefix: "210", countyId: "MD:howard" },

  // Anne Arundel, MD (211xx)
  { prefix: "211", countyId: "MD:anne-arundel" },

  // Baltimore City + County (212xx)
  { prefix: "212", countyId: "MD:baltimore-city" },

  // Charles, Calvert, St. Mary's (206xx — Southern Maryland)
  { prefix: "206", countyId: "MD:charles" },

  // DC (200xx, 202xx, 203xx, 204xx, 205xx)
  { prefix: "200", countyId: "DC:dc" },
  { prefix: "202", countyId: "DC:dc" },
  { prefix: "203", countyId: "DC:dc" },
  { prefix: "204", countyId: "DC:dc" },
  { prefix: "205", countyId: "DC:dc" },
];

/**
 * Resolve a ZIP code to its (state, county). Returns `null` for unknown ZIPs.
 *
 * For ZIPs that may legitimately span counties, this returns a single
 * best-guess; the intake form should let the user override.
 */
export function resolveZip(
  zip: string
): { state: StateCode; countyId: CountyId } | null {
  if (!/^\d{5}$/.test(zip)) return null;
  const match = ZIP_PREFIX_TO_COUNTY.find((entry) => zip.startsWith(entry.prefix));
  if (!match) return null;
  const county = COUNTY_BY_ID.get(match.countyId);
  if (!county) return null;
  return { state: county.state, countyId: match.countyId };
}

/** Whether a ZIP falls in any of our supported (active) states. */
export function isSupportedZip(zip: string): boolean {
  const resolved = resolveZip(zip);
  if (!resolved) return false;
  // We import lazily here to avoid a circular module init.
  const { STATE_BY_CODE } = require("./registry") as typeof import("./registry");
  const state = STATE_BY_CODE.get(resolved.state);
  return Boolean(state?.active);
}
