// ─────────────────────────────────────────────────────────────────────────────
// GreenBroker geo model
//
// Three orthogonal dimensions:
//   1. State + County — administrative geography (primary)
//   2. Utility territory — who delivers electrons/therms (cuts across counties)
//   3. Metro region — informal grouping used only for contractor service areas
//
// Rebate scoping = intersection of constraints (all scopes must match).
// Contractor service area = where they will physically perform work.
//
// Expansion to a new state should require ONLY data additions (registry +
// rebate scopes). Adding new scope kinds requires touching `eligibility.ts`.
// ─────────────────────────────────────────────────────────────────────────────

/** ISO 3166-2 US subdivision code, sans the "US-" prefix (e.g. "MD", "VA"). */
export type StateCode = string;

/** Stable county identifier: `${StateCode}:${slug}` — e.g. "MD:montgomery". */
export type CountyId = `${string}:${string}`;

/** Stable utility identifier — e.g. "pepco-md", "bge", "washington-gas-md". */
export type UtilityId = string;

/** Stable metro identifier — e.g. "dmv", "baltimore-metro". */
export type MetroId = string;

export interface State {
  code: StateCode;
  name: string;
  /** Whether GreenBroker actively serves this state today. */
  active: boolean;
  /** All counties we have data for in this state (may be a subset of reality). */
  countyIds: CountyId[];
}

export interface County {
  id: CountyId;
  state: StateCode;
  /** kebab-case slug (no "county" suffix) — e.g. "montgomery". */
  slug: string;
  /** Display name including "County" suffix where appropriate. */
  name: string;
  /** 5-digit FIPS code (state + county). Optional but recommended. */
  fips?: string;
  /** ZIPs we have explicitly mapped to this county. Lookup is via zip-lookup.ts. */
  zips?: string[];
}

export type UtilityServiceType = "electric" | "gas" | "dual";

export interface Utility {
  id: UtilityId;
  name: string;
  state: StateCode;
  serviceType: UtilityServiceType;
  /** Counties this utility serves within `state`. Multi-state utilities should
   *  be declared once per state (e.g. "pepco-md" + "pepco-dc"). */
  countyIds: CountyId[];
  /** Display URL for the utility's homepage / rebate program. */
  url?: string;
}

export interface Metro {
  id: MetroId;
  name: string;
  /** Counties (across one or more states) that make up this metro region. */
  countyIds: CountyId[];
}

/**
 * A user's resolved location. The intake form collects (zip, electricUtilityId,
 * gasUtilityId); the server resolves (state, countyId) from the ZIP via
 * zip-lookup.ts. UtilityId fields are required because the same county can
 * span multiple utility territories.
 */
export interface UserLocation {
  state: StateCode;
  countyId: CountyId;
  zip: string;
  electricUtilityId?: UtilityId;
  gasUtilityId?: UtilityId;
}

// ─── Rebate scope ─────────────────────────────────────────────────────────────

export type RebateScope =
  | { kind: "federal" }
  | { kind: "state"; stateCode: StateCode }
  | { kind: "county"; countyIds: CountyId[] }
  | { kind: "utility"; utilityIds: UtilityId[] };

// ─── Contractor service area ──────────────────────────────────────────────────

export type ServiceArea =
  | { kind: "state"; stateCode: StateCode }
  | { kind: "counties"; countyIds: CountyId[] }
  | { kind: "metro"; regionId: MetroId };
