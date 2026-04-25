// ─────────────────────────────────────────────────────────────────────────────
// GreenBroker Rebate & Incentive Database
// Accurate as of April 2026, Rockville MD (ZIP 20850 / Montgomery County)
//
// CRITICAL: Federal 25C and 25D credits were ELIMINATED by the One Big Beautiful
// Bill Act (signed July 4, 2025) for installations after December 31, 2025.
// Many online sources are outdated — GreenBroker must show current reality.
// ─────────────────────────────────────────────────────────────────────────────

import type { Rebate } from "@/lib/types";
import type { UserLocation } from "@/lib/geo/types";
import { findRebatesFor } from "@/lib/geo/eligibility";

export const REBATES: Rebate[] = [
  // ─── EmPOWER Maryland (PEPCO) ─────────────────────────────────────────────
  {
    id: "empower-electrification",
    name: "EmPOWER Home Performance — Electrification Path",
    administrator: "PEPCO",
    type: "rebate",
    available: true,
    maxAmount: 15000,
    minAmount: 0,
    coveragePct: 0.75, // up to 75% of project cost
    incomeQualified: false,
    stackableWith: [
      "electrify-mc-heat-pump",
      "msap-solar",
      "rces-battery",
      "maryland-srec",
      "green-bank-solar-loan",
    ],
    requiresAudit: true,
    requiresMEAContractor: true,
    description:
      "PEPCO's most valuable rebate for replacing fossil fuel heating with a heat pump. Covers up to 75% of project cost, up to $15,000. Requires a $100 energy audit by a BPI-certified contractor (audit valued at $400). No income requirement.",
    url: "https://www.pepco.com/MyAccount/MyBillUsage/Pages/PEPCOEmPOWER.aspx",
    applicableCategories: ["heat-pump", "insulation"],
    notes:
      "This is the single most valuable incentive for heat pump conversion in Rockville. Stack with Electrify MC for maximum savings.",
    scopes: [
      { kind: "state", stateCode: "MD" },
      { kind: "utility", utilityIds: ["pepco-md"] },
    ],
  },
  {
    id: "empower-non-electrification",
    name: "EmPOWER Home Performance — Non-Electrification Path",
    administrator: "PEPCO",
    type: "rebate",
    available: true,
    maxAmount: 10000,
    incomeQualified: false,
    stackableWith: ["electrify-mc-heat-pump", "msap-solar", "rces-battery"],
    requiresAudit: true,
    requiresMEAContractor: true,
    description:
      "For insulation, air sealing, duct sealing, and other non-electrification efficiency improvements. Up to $10,000.",
    url: "https://www.pepco.com/MyAccount/MyBillUsage/Pages/PEPCOEmPOWER.aspx",
    applicableCategories: ["insulation", "window"],
    scopes: [
      { kind: "state", stateCode: "MD" },
      { kind: "utility", utilityIds: ["pepco-md"] },
    ],
  },
  {
    id: "empower-make-ready",
    name: "EmPOWER Make-Ready Enablement",
    administrator: "PEPCO",
    type: "rebate",
    available: true,
    maxAmount: 3000,
    coveragePct: 0.75,
    incomeQualified: false,
    stackableWith: ["empower-electrification"],
    description:
      "Covers ductwork, wiring, and electrical panel upgrades needed to enable heat pump installation. Up to $3,000 / 75% of cost.",
    url: "https://www.pepco.com/MyAccount/MyBillUsage/Pages/PEPCOEmPOWER.aspx",
    applicableCategories: ["heat-pump"],
    scopes: [
      { kind: "state", stateCode: "MD" },
      { kind: "utility", utilityIds: ["pepco-md"] },
    ],
  },
  {
    id: "empower-hpwh",
    name: "PEPCO EmPOWER — Heat Pump Water Heater Rebate",
    administrator: "PEPCO",
    type: "rebate",
    available: true,
    maxAmount: 1600,
    incomeQualified: false,
    stackableWith: ["electrify-mc-hpwh"],
    description:
      "Point-of-sale rebate for heat pump water heater installation. $1,600 — the single largest appliance rebate available.",
    url: "https://www.pepco.com/MyAccount/MyBillUsage/Pages/PEPCOEmPOWER.aspx",
    applicableCategories: ["water-heater"],
    scopes: [
      { kind: "state", stateCode: "MD" },
      { kind: "utility", utilityIds: ["pepco-md"] },
    ],
  },
  {
    id: "empower-thermostat",
    name: "PEPCO EmPOWER — Smart Thermostat Rebate",
    administrator: "PEPCO",
    type: "rebate",
    available: true,
    maxAmount: 100,
    incomeQualified: false,
    stackableWith: [],
    description:
      "Instant rebate for qualifying smart thermostat (ecobee or Nest). At $100 off, the ecobee Premium is effectively free after rebate.",
    url: "https://www.pepco.com/MyAccount/MyBillUsage/Pages/PEPCOEmPOWER.aspx",
    applicableCategories: ["smart-thermostat"],
    scopes: [
      { kind: "state", stateCode: "MD" },
      { kind: "utility", utilityIds: ["pepco-md"] },
    ],
  },
  {
    id: "empower-recycling",
    name: "PEPCO EmPOWER — Old Appliance Recycling",
    administrator: "PEPCO",
    type: "rebate",
    available: true,
    maxAmount: 50,
    incomeQualified: false,
    stackableWith: [],
    description:
      "Free pickup and $50 rebate for retiring an old, working refrigerator or freezer. Secondary units in garages/basements qualify.",
    url: "https://www.pepco.com/MyAccount/MyBillUsage/Pages/PEPCOEmPOWER.aspx",
    applicableCategories: ["refrigerator"],
    scopes: [
      { kind: "state", stateCode: "MD" },
      { kind: "utility", utilityIds: ["pepco-md"] },
    ],
  },

  // ─── Montgomery County: Electrify MC ─────────────────────────────────────
  {
    id: "electrify-mc-heat-pump",
    name: "Electrify MC — Heat Pump Incentive",
    administrator: "Montgomery County (administered by Elysian Energy)",
    type: "rebate",
    available: true,
    maxAmount: 2500,
    minAmount: 1000,
    incomeQualified: false,
    stackableWith: [
      "empower-electrification",
      "empower-make-ready",
      "msap-solar",
      "rces-battery",
    ],
    description:
      "Point-of-sale incentive for heat pump HVAC installation. $1,000–$2,500 depending on system type. Designed to complement EmPOWER — both programs stack. Must use Electrify MC approved contractor (Elysian Energy is sole administrator).",
    url: "https://www.electrifymc.com",
    applicableCategories: ["heat-pump"],
    notes: "Elysian Energy is the sole contractor for Electrify MC as of April 2026.",
    scopes: [{ kind: "county", countyIds: ["MD:montgomery"] }],
  },
  {
    id: "electrify-mc-hpwh",
    name: "Electrify MC — Heat Pump Water Heater",
    administrator: "Montgomery County (Elysian Energy)",
    type: "rebate",
    available: true,
    maxAmount: 1500, // $500 base + $1,000 if replacing shared-flue furnace
    minAmount: 500,
    incomeQualified: false,
    stackableWith: ["empower-hpwh"],
    description:
      "$500 for HPWH installation (+$1,000 bonus if replacing a gas furnace that shares a flue). Stacks with PEPCO's $1,600 HPWH rebate for up to $2,100 combined.",
    url: "https://www.electrifymc.com",
    applicableCategories: ["water-heater"],
    scopes: [{ kind: "county", countyIds: ["MD:montgomery"] }],
  },
  {
    id: "electrify-mc-stove",
    name: "Electrify MC — Induction/Electric Stove",
    administrator: "Montgomery County (Elysian Energy)",
    type: "rebate",
    available: true,
    maxAmount: 500,
    incomeQualified: false,
    stackableWith: [],
    description: "$500 for switching from gas to induction or electric cooking.",
    url: "https://www.electrifymc.com",
    applicableCategories: ["smart-thermostat"], // Using as placeholder
    scopes: [{ kind: "county", countyIds: ["MD:montgomery"] }],
  },
  {
    id: "electrify-mc-dryer",
    name: "Electrify MC — Heat Pump Dryer",
    administrator: "Montgomery County (Elysian Energy)",
    type: "rebate",
    available: true,
    maxAmount: 250,
    incomeQualified: false,
    stackableWith: [],
    description: "$250 for heat pump dryer installation (switching from gas dryer).",
    url: "https://www.electrifymc.com",
    applicableCategories: ["dryer"],
    scopes: [{ kind: "county", countyIds: ["MD:montgomery"] }],
  },

  // ─── Maryland State Programs ──────────────────────────────────────────────
  {
    id: "msap-solar",
    name: "Maryland Solar Access Program (MSAP)",
    administrator: "Maryland Energy Administration (MEA)",
    type: "rebate",
    available: true,
    maxAmount: 7500,
    incomeQualified: true,
    incomeLimitAMIPct: 150,
    incomeLimit: 163900, // ~150% AMI for 3-person household, Montgomery County 2026
    stackableWith: [
      "rces-battery",
      "maryland-srec",
      "green-bank-solar-loan",
      "switch-together-discount",
      "empower-electrification",
    ],
    cannotStackWith: [], // Cannot combine with previous MEA Clean Energy Rebates
    description:
      "$750/kW, up to $7,500 for solar installation. Income-qualified (≤150% AMI). First-come, first-served — FY26 portal open through June 5, 2026. Apply BEFORE installation.",
    url: "https://energy.maryland.gov/residential/Pages/solar_access.aspx",
    applicableCategories: ["solar-panel"],
    notes:
      "CRITICAL: Apply before installation begins. First-come, first-served — funds run out. FY26 deadline June 5, 2026.",
    scopes: [{ kind: "state", stateCode: "MD" }],
  },
  {
    id: "rces-battery",
    name: "Maryland Energy Storage Grant (RCES)",
    administrator: "Maryland Energy Administration (MEA)",
    type: "rebate",
    available: true,
    maxAmount: 5000,
    coveragePct: 0.30,
    incomeQualified: false,
    stackableWith: [
      "msap-solar",
      "maryland-srec",
      "green-bank-solar-loan",
      "empower-electrification",
    ],
    description:
      "30% of battery storage cost, up to $5,000. Limited $2M total budget — apply early. Stacks with everything.",
    url: "https://energy.maryland.gov/residential/Pages/storage.aspx",
    applicableCategories: ["battery-storage"],
    notes: "Limited $2M budget — first-come, first-served. Apply immediately.",
    scopes: [{ kind: "state", stateCode: "MD" }],
  },
  {
    id: "maryland-srec",
    name: "Maryland Solar Renewable Energy Credits (SRECs)",
    administrator: "PJM-GATS / Maryland PSC",
    type: "srec",
    available: true,
    maxAmount: 0, // ongoing income, not a one-time rebate
    incomeQualified: false,
    stackableWith: [
      "msap-solar",
      "rces-battery",
      "green-bank-solar-loan",
      "switch-together-discount",
    ],
    description:
      "Ongoing income: 1 SREC per MWh generated. Certified SRECs currently ~$70/credit under Brighter Tomorrow Act 1.5x multiplier (systems July 2024–January 2028). Standard SRECs: ~$40–$59. A 10 kW system earns ~10–13 SRECs/year = $400–$950/year in ongoing income. SREC prices will decline as Solar ACP drops from $55 (2025) to $22.50 (2030).",
    url: "https://psc.state.md.us/electricity/md-srec-program/",
    applicableCategories: ["solar-panel"],
    notes:
      "Requires PSC certification + PJM-GATS registration. GreenBroker can help automate this process.",
    scopes: [{ kind: "state", stateCode: "MD" }],
  },
  {
    id: "green-bank-solar-loan",
    name: "Montgomery County Green Bank — Access Solar Loan",
    administrator: "Montgomery County Green Bank / Climate First Bank",
    type: "loan",
    available: true,
    maxAmount: 0, // loan amount varies
    incomeQualified: true,
    incomeLimit: 163900, // ≤$163,900 (income limit)
    stackableWith: [
      "msap-solar",
      "rces-battery",
      "maryland-srec",
      "switch-together-discount",
      "empower-electrification",
    ],
    description:
      "Subsidized solar loans at 2.99% interest for first 15 years through Climate First Bank. Can bundle solar + battery + roof replacement. For households earning ≤$163,900.",
    url: "https://www.mcgreenbank.org",
    applicableCategories: ["solar-panel", "battery-storage"],
    // The Green Bank's loan program is administered for Montgomery County
    // residents; income limits + program rules are county-specific.
    scopes: [{ kind: "county", countyIds: ["MD:montgomery"] }],
  },
  {
    id: "switch-together-discount",
    name: "Capital Area Solar Switch Together — Group Purchase Discount",
    administrator: "Capital Area Solar Switch Together",
    type: "discount",
    available: true,
    maxAmount: 0, // percentage discount, not fixed
    incomeQualified: false,
    stackableWith: [
      "msap-solar",
      "rces-battery",
      "maryland-srec",
      "green-bank-solar-loan",
    ],
    description:
      "15–25% group purchase discount on solar and battery installations through collective bargaining. Typical savings: $5,000–$8,000 on a standard residential install.",
    url: "https://www.solarswitchtogether.org",
    applicableCategories: ["solar-panel", "battery-storage"],
    // Capital Area program covers the DMV metro counties.
    scopes: [
      {
        kind: "county",
        countyIds: ["MD:montgomery", "MD:prince-georges", "MD:frederick", "DC:dc"],
      },
    ],
  },

  // ─── PENDING / NOT YET AVAILABLE ─────────────────────────────────────────
  {
    id: "heehra-heat-pump",
    name: "HEEHRA — Heat Pump HVAC Rebate (PENDING LAUNCH)",
    administrator: "Maryland Energy Administration",
    type: "rebate",
    available: false, // NOT YET AVAILABLE in Maryland
    maxAmount: 8000,
    incomeQualified: true,
    incomeLimitAMIPct: 150,
    stackableWith: ["empower-electrification", "electrify-mc-heat-pump"],
    description:
      "Part of the IRA Home Electrification and Appliance Rebate Act. Up to $8,000 for heat pump HVAC. Income-qualified: 100% coverage below 80% AMI, 50% coverage for 80–150% AMI. Point-of-sale rebate. MEA issued RFP July 2025 — NOT YET AVAILABLE. Expected launch: late 2026 or beyond.",
    url: "https://energy.maryland.gov/residential/Pages/hear.aspx",
    applicableCategories: ["heat-pump"],
    notes:
      "When available, income-qualified households could stack this with EmPOWER for near-zero cost heat pump installation.",
    scopes: [{ kind: "state", stateCode: "MD" }],
  },
  {
    id: "heehra-hpwh",
    name: "HEEHRA — Heat Pump Water Heater Rebate (PENDING LAUNCH)",
    administrator: "Maryland Energy Administration",
    type: "rebate",
    available: false,
    maxAmount: 1750,
    incomeQualified: true,
    incomeLimitAMIPct: 150,
    stackableWith: ["empower-hpwh", "electrify-mc-hpwh"],
    description:
      "Up to $1,750 for HPWH installation under HEEHRA. NOT YET AVAILABLE in Maryland.",
    url: "https://energy.maryland.gov/residential/Pages/hear.aspx",
    applicableCategories: ["water-heater"],
    scopes: [{ kind: "state", stateCode: "MD" }],
  },
  {
    id: "heehra-panel",
    name: "HEEHRA — Electrical Panel Upgrade (PENDING LAUNCH)",
    administrator: "Maryland Energy Administration",
    type: "rebate",
    available: false,
    maxAmount: 4000,
    incomeQualified: true,
    incomeLimitAMIPct: 150,
    stackableWith: ["empower-make-ready"],
    description:
      "Up to $4,000 for electrical panel upgrades under HEEHRA. NOT YET AVAILABLE in Maryland.",
    url: "https://energy.maryland.gov/residential/Pages/hear.aspx",
    applicableCategories: ["heat-pump"],
    scopes: [{ kind: "state", stateCode: "MD" }],
  },
  {
    id: "homes-rebate",
    name: "HOMES/HERO Whole-Home Rebate (PENDING LAUNCH)",
    administrator: "Maryland Energy Administration",
    type: "rebate",
    available: false,
    maxAmount: 8000,
    minAmount: 2000,
    incomeQualified: false,
    stackableWith: ["empower-electrification", "empower-non-electrification"],
    description:
      "IRA HOMES rebate: $2,000–$8,000 for whole-home energy savings of 20–35%+ (doubled for low-income). NOT YET AVAILABLE in Maryland.",
    url: "https://energy.maryland.gov/residential/Pages/homes.aspx",
    applicableCategories: ["insulation", "heat-pump", "window"],
    scopes: [{ kind: "state", stateCode: "MD" }],
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getAvailableRebates(): Rebate[] {
  return REBATES.filter((r) => r.available);
}

export function getRebatesByCategory(category: string): Rebate[] {
  return REBATES.filter((r) => r.applicableCategories.includes(category as any));
}

export function getRebateById(id: string): Rebate | undefined {
  return REBATES.find((r) => r.id === id);
}

/**
 * Returns rebates the user is geographically eligible for, given their resolved
 * (state, county, utility) location. Filters to `available: true` by default.
 */
export function getRebatesForLocation(
  location: UserLocation,
  opts: { onlyAvailable?: boolean } = { onlyAvailable: true }
): Rebate[] {
  return findRebatesFor(REBATES, location, opts);
}

export function getMaxStackableRebates(
  categories: string[],
  amiBracket: "below-80" | "80-150" | "above-150" | "unknown"
): { total: number; rebates: Rebate[] } {
  const eligible = REBATES.filter(
    (r) =>
      r.available &&
      r.applicableCategories.some((c) => categories.includes(c)) &&
      (!r.incomeQualified || amiBracket === "below-80" || amiBracket === "80-150")
  );

  const total = eligible.reduce((sum, r) => sum + r.maxAmount, 0);
  return { total, rebates: eligible };
}

// ─── Rebate Stacking Scenarios (from research) ─────────────────────────────

export const STACKING_SCENARIOS = {
  heatPump: {
    grossProjectCost: 15000,
    rebates: [
      { id: "empower-electrification", amount: 7500, label: "EmPOWER (electrification, min)" },
      { id: "electrify-mc-heat-pump", amount: 2000, label: "Electrify MC (midpoint)" },
    ],
    totalRebates: 9500,
    netCostMin: 0,
    netCostMax: 6500,
    note: "$8,500–$17,500 in currently available rebates. Realistic net cost: $0–$6,500.",
  },
  solarBattery: {
    grossProjectCost: 35000,
    rebates: [
      { id: "msap-solar", amount: 7500, label: "MSAP (income-qualified)", incomeQualifiedOnly: true },
      { id: "rces-battery", amount: 5000, label: "Maryland RCES battery grant" },
      { id: "switch-together-discount", amount: 7000, label: "Switch Together discount (est.)" },
      { id: "maryland-srec", amount: 0, label: "SREC income ~$700–$950/year (ongoing)" },
    ],
    salesTaxExemption: 2100,
    netCostStandard: 20900,
    netCostIncomeQualified: 13400,
    note: "Plus $1,200–$1,800/year net metering savings + $700–$950/year SREC income.",
  },
  fullElectrification: {
    grossProjectCost: 60750,
    totalIncentivesMin: 31300,
    totalIncentivesMax: 41300,
    netCostMin: 18700,
    netCostMax: 28700,
    note: "When HEEHRA launches for income-qualified: could approach $0 net cost.",
  },
};
