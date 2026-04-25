// ─────────────────────────────────────────────────────────────────────────────
// Eligibility selectors
//
// A rebate's `scopes` is an array — ALL scopes must match (intersection).
// Empty array == universally eligible (federal-style, anyone in any state).
//
// A contractor's `serviceArea` is a single value (no intersection) — we say
// "this contractor serves location L" if the area covers L's countyId.
// ─────────────────────────────────────────────────────────────────────────────

import type { Rebate } from "@/lib/types";
import { METRO_BY_ID } from "./registry";
import type { CountyId, RebateScope, ServiceArea, UserLocation } from "./types";

/** Returns true if a single scope matches the user's location. */
export function scopeMatches(scope: RebateScope, loc: UserLocation): boolean {
  switch (scope.kind) {
    case "federal":
      return true;
    case "state":
      return loc.state === scope.stateCode;
    case "county":
      return scope.countyIds.includes(loc.countyId);
    case "utility":
      // Match against either electric or gas utility — rebate scopes know
      // which kind they care about by the utility IDs they list.
      return Boolean(
        (loc.electricUtilityId && scope.utilityIds.includes(loc.electricUtilityId)) ||
        (loc.gasUtilityId && scope.utilityIds.includes(loc.gasUtilityId))
      );
  }
}

/** A rebate qualifies for a location iff every scope matches. */
export function rebateMatchesLocation(rebate: Rebate, loc: UserLocation): boolean {
  if (!rebate.scopes || rebate.scopes.length === 0) return true; // federal default
  return rebate.scopes.every((scope) => scopeMatches(scope, loc));
}

/** Filter a rebate list by location, then by `available: true` flag. */
export function findRebatesFor(
  rebates: Rebate[],
  loc: UserLocation,
  opts: { onlyAvailable?: boolean } = { onlyAvailable: true }
): Rebate[] {
  return rebates.filter((r) => {
    if (opts.onlyAvailable && !r.available) return false;
    return rebateMatchesLocation(r, loc);
  });
}

// ─── Contractor service area ──────────────────────────────────────────────────

/** Does this contractor serve `countyId`? */
export function serviceAreaCovers(area: ServiceArea, countyId: CountyId): boolean {
  switch (area.kind) {
    case "state":
      return countyId.startsWith(`${area.stateCode}:`);
    case "counties":
      return area.countyIds.includes(countyId);
    case "metro": {
      const metro = METRO_BY_ID.get(area.regionId);
      return Boolean(metro?.countyIds.includes(countyId));
    }
  }
}

/** All countyIds covered by a service area — useful for indexing in DB queries. */
export function expandServiceArea(area: ServiceArea, allCountyIds: CountyId[]): CountyId[] {
  switch (area.kind) {
    case "state":
      return allCountyIds.filter((id) => id.startsWith(`${area.stateCode}:`));
    case "counties":
      return [...area.countyIds];
    case "metro": {
      const metro = METRO_BY_ID.get(area.regionId);
      return metro ? [...metro.countyIds] : [];
    }
  }
}
