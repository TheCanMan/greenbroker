// ─────────────────────────────────────────────────────────────────────────────
// Geo registry — single source of truth for states, counties, utilities, metros.
//
// To add a new state:
//   1. Add an entry to STATES (active: true once we have rebate data).
//   2. Add the relevant counties to COUNTIES.
//   3. Add utilities (one entry per state-territory) to UTILITIES.
//   4. (optional) Add metro regions if contractors will use "metro" service areas.
//   5. Add rebates to src/lib/data/rebates.ts with the right `scopes`.
//
// IDs are stable strings — never renumber once they reach production data.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CountyId,
  Metro,
  State,
  Utility,
  UtilityId,
} from "./types";

// ─── States ───────────────────────────────────────────────────────────────────

export const STATES: State[] = [
  {
    code: "MD",
    name: "Maryland",
    active: true,
    countyIds: [
      "MD:montgomery",
      "MD:prince-georges",
      "MD:howard",
      "MD:anne-arundel",
      "MD:baltimore",
      "MD:baltimore-city",
      "MD:frederick",
      "MD:carroll",
      "MD:harford",
      "MD:charles",
      "MD:calvert",
      "MD:st-marys",
      "MD:washington",
      "MD:allegany",
      "MD:garrett",
      "MD:cecil",
      "MD:kent",
      "MD:queen-annes",
      "MD:talbot",
      "MD:caroline",
      "MD:dorchester",
      "MD:wicomico",
      "MD:worcester",
      "MD:somerset",
    ],
  },
  // Inactive but pre-registered for upcoming expansion. Flip `active: true`
  // once rebate scopes + intake validations are populated.
  { code: "DC", name: "District of Columbia", active: false, countyIds: ["DC:dc"] },
  {
    code: "VA",
    name: "Virginia",
    active: false,
    // Populated as we add VA counties — empty for now.
    countyIds: [],
  },
];

// ─── Counties ─────────────────────────────────────────────────────────────────
// Maryland is the launch market. Every other state starts empty until we
// commit rebate data for it.

export const COUNTIES = [
  // Maryland — DMV
  { id: "MD:montgomery",     state: "MD", slug: "montgomery",     name: "Montgomery County",        fips: "24031" },
  { id: "MD:prince-georges", state: "MD", slug: "prince-georges", name: "Prince George's County",   fips: "24033" },
  { id: "MD:howard",         state: "MD", slug: "howard",         name: "Howard County",            fips: "24027" },
  { id: "MD:frederick",      state: "MD", slug: "frederick",      name: "Frederick County",         fips: "24021" },
  { id: "MD:charles",        state: "MD", slug: "charles",        name: "Charles County",           fips: "24017" },
  { id: "MD:calvert",        state: "MD", slug: "calvert",        name: "Calvert County",           fips: "24009" },
  { id: "MD:st-marys",       state: "MD", slug: "st-marys",       name: "St. Mary's County",        fips: "24037" },

  // Maryland — Baltimore metro
  { id: "MD:anne-arundel",   state: "MD", slug: "anne-arundel",   name: "Anne Arundel County",      fips: "24003" },
  { id: "MD:baltimore",      state: "MD", slug: "baltimore",      name: "Baltimore County",         fips: "24005" },
  { id: "MD:baltimore-city", state: "MD", slug: "baltimore-city", name: "Baltimore City",           fips: "24510" },
  { id: "MD:carroll",        state: "MD", slug: "carroll",        name: "Carroll County",           fips: "24013" },
  { id: "MD:harford",        state: "MD", slug: "harford",        name: "Harford County",           fips: "24025" },

  // Maryland — Western
  { id: "MD:washington",     state: "MD", slug: "washington",     name: "Washington County",        fips: "24043" },
  { id: "MD:allegany",       state: "MD", slug: "allegany",       name: "Allegany County",          fips: "24001" },
  { id: "MD:garrett",        state: "MD", slug: "garrett",        name: "Garrett County",           fips: "24023" },

  // Maryland — Eastern Shore
  { id: "MD:cecil",          state: "MD", slug: "cecil",          name: "Cecil County",             fips: "24015" },
  { id: "MD:kent",           state: "MD", slug: "kent",           name: "Kent County",              fips: "24029" },
  { id: "MD:queen-annes",    state: "MD", slug: "queen-annes",    name: "Queen Anne's County",      fips: "24035" },
  { id: "MD:talbot",         state: "MD", slug: "talbot",         name: "Talbot County",            fips: "24041" },
  { id: "MD:caroline",       state: "MD", slug: "caroline",       name: "Caroline County",          fips: "24011" },
  { id: "MD:dorchester",     state: "MD", slug: "dorchester",     name: "Dorchester County",        fips: "24019" },
  { id: "MD:wicomico",       state: "MD", slug: "wicomico",       name: "Wicomico County",          fips: "24045" },
  { id: "MD:worcester",      state: "MD", slug: "worcester",      name: "Worcester County",         fips: "24047" },
  { id: "MD:somerset",       state: "MD", slug: "somerset",       name: "Somerset County",          fips: "24039" },

  // DC
  { id: "DC:dc",             state: "DC", slug: "dc",             name: "District of Columbia",     fips: "11001" },
] as const;

// ─── Utilities ────────────────────────────────────────────────────────────────
// Coverage is approximate at the county level. Real territory edges are sub-
// county and ZIP-based; refine via zip-lookup as we get more granular data.

export const UTILITIES: Utility[] = [
  // ─── Maryland electric ────────────────────────────────────────────
  {
    id: "pepco-md",
    name: "PEPCO (Maryland)",
    state: "MD",
    serviceType: "electric",
    countyIds: ["MD:montgomery", "MD:prince-georges"],
    url: "https://www.pepco.com",
  },
  {
    id: "bge",
    name: "Baltimore Gas & Electric (BGE)",
    state: "MD",
    serviceType: "dual",
    countyIds: [
      "MD:anne-arundel",
      "MD:baltimore",
      "MD:baltimore-city",
      "MD:carroll",
      "MD:harford",
      "MD:howard",
      "MD:calvert",
      "MD:charles",
      "MD:prince-georges",
    ],
    url: "https://www.bge.com",
  },
  {
    id: "potomac-edison-md",
    name: "Potomac Edison (Maryland)",
    state: "MD",
    serviceType: "electric",
    countyIds: [
      "MD:frederick",
      "MD:washington",
      "MD:allegany",
      "MD:garrett",
      "MD:carroll",
    ],
    url: "https://www.firstenergycorp.com/potomac_edison.html",
  },
  {
    id: "delmarva-power-md",
    name: "Delmarva Power (Maryland)",
    state: "MD",
    serviceType: "dual",
    countyIds: [
      "MD:cecil",
      "MD:kent",
      "MD:queen-annes",
      "MD:talbot",
      "MD:caroline",
      "MD:dorchester",
      "MD:wicomico",
      "MD:worcester",
      "MD:somerset",
    ],
    url: "https://www.delmarva.com",
  },
  {
    id: "smeco",
    name: "Southern Maryland Electric Cooperative (SMECO)",
    state: "MD",
    serviceType: "electric",
    countyIds: ["MD:calvert", "MD:charles", "MD:st-marys", "MD:prince-georges"],
    url: "https://www.smeco.coop",
  },

  // ─── Maryland gas ─────────────────────────────────────────────────
  {
    id: "washington-gas-md",
    name: "Washington Gas (Maryland)",
    state: "MD",
    serviceType: "gas",
    countyIds: [
      "MD:montgomery",
      "MD:prince-georges",
      "MD:frederick",
      "MD:charles",
      "MD:st-marys",
      "MD:calvert",
    ],
    url: "https://www.washingtongas.com",
  },
  {
    id: "columbia-gas-md",
    name: "Columbia Gas of Maryland",
    state: "MD",
    serviceType: "gas",
    countyIds: ["MD:washington", "MD:allegany", "MD:garrett"],
    url: "https://www.columbiagasmd.com",
  },

  // ─── DC ───────────────────────────────────────────────────────────
  {
    id: "pepco-dc",
    name: "PEPCO (DC)",
    state: "DC",
    serviceType: "electric",
    countyIds: ["DC:dc"],
    url: "https://www.pepco.com",
  },
  {
    id: "washington-gas-dc",
    name: "Washington Gas (DC)",
    state: "DC",
    serviceType: "gas",
    countyIds: ["DC:dc"],
    url: "https://www.washingtongas.com",
  },
];

// ─── Metro regions (for contractor service areas) ─────────────────────────────

export const METROS: Metro[] = [
  {
    id: "dmv",
    name: "DC / Maryland / Virginia",
    countyIds: ["MD:montgomery", "MD:prince-georges", "MD:frederick", "MD:howard", "DC:dc"],
  },
  {
    id: "baltimore-metro",
    name: "Baltimore Metro",
    countyIds: [
      "MD:baltimore",
      "MD:baltimore-city",
      "MD:anne-arundel",
      "MD:howard",
      "MD:carroll",
      "MD:harford",
    ],
  },
];

// ─── Quick-lookup indexes ─────────────────────────────────────────────────────

export const STATE_BY_CODE = new Map(STATES.map((s) => [s.code, s]));
export const COUNTY_BY_ID = new Map(COUNTIES.map((c) => [c.id as CountyId, c]));
export const UTILITY_BY_ID = new Map<UtilityId, Utility>(
  UTILITIES.map((u) => [u.id, u])
);
export const METRO_BY_ID = new Map(METROS.map((m) => [m.id, m]));

/** Utilities a given county is served by (any service type). */
export function utilitiesForCounty(countyId: CountyId): Utility[] {
  return UTILITIES.filter((u) => u.countyIds.includes(countyId));
}

/** Electric utilities serving a county. */
export function electricUtilitiesForCounty(countyId: CountyId): Utility[] {
  return utilitiesForCounty(countyId).filter(
    (u) => u.serviceType === "electric" || u.serviceType === "dual"
  );
}

/** Gas utilities serving a county. */
export function gasUtilitiesForCounty(countyId: CountyId): Utility[] {
  return utilitiesForCounty(countyId).filter(
    (u) => u.serviceType === "gas" || u.serviceType === "dual"
  );
}

/** Active states only — for intake form dropdowns. */
export function activeStates(): State[] {
  return STATES.filter((s) => s.active);
}
