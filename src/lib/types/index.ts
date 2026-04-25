// ─────────────────────────────────────────────
// GreenBroker Core Type Definitions
// ─────────────────────────────────────────────

export type ProductCategory =
  | "heat-pump"
  | "central-ac"
  | "furnace"
  | "water-heater"
  | "solar-panel"
  | "battery-storage"
  | "smart-thermostat"
  | "refrigerator"
  | "washer"
  | "dryer"
  | "dishwasher"
  | "insulation"
  | "window"
  | "ev-charger";

export type EfficiencyTier = "good" | "better" | "best" | "most-efficient";

export interface Product {
  id: string;
  category: ProductCategory;
  brand: string;
  model: string;
  name: string;
  tier: EfficiencyTier;
  energyStarMostEfficient: boolean;
  msrpMin: number;
  msrpMax: number;
  installedCostMin?: number;
  installedCostMax?: number;
  lifespanYears: number;
  annualKwhUsage?: number;
  annualOperatingCostDollars?: number; // at PEPCO $0.217/kWh
  annualSavingsVsBaseline?: number;
  paybackYears?: number;
  specs: Record<string, string | number | boolean>;
  highlights: string[];
  caveats?: string[];
}

export interface HeatPumpProduct extends Product {
  category: "heat-pump";
  seer2: number;
  hspf2: number;
  ceeTier: 1 | 2 | 3;
  coldClimatRated: boolean;
  type: "split" | "mini-split" | "packaged";
}

export interface WaterHeaterProduct extends Product {
  category: "water-heater";
  uef: number;
  type: "heat-pump" | "tankless-gas" | "tank-electric" | "tank-gas";
  gallons?: number;
  gpm?: number; // for tankless
}

export interface SolarPanelProduct extends Product {
  category: "solar-panel";
  efficiencyPercent: number;
  wattageW: number;
  degradationPctPerYear: number;
  warrantyYears: number;
  pricePerWatt: number;
  annualKwhPer440W?: number; // at Rockville 4.5 peak sun hours
}

export interface BatteryProduct extends Product {
  category: "battery-storage";
  usableKwh: number;
  continuousKw: number;
  roundTripEfficiencyPct: number;
  warrantyYears: number;
  cycleRating?: number;
}

// ─── Rebate Programs ───────────────────────────

export type RebateProgram =
  | "empower-electrification"
  | "empower-non-electrification"
  | "empower-make-ready"
  | "empower-hpwh"
  | "empower-thermostat"
  | "empower-recycling"
  | "electrify-mc-heat-pump"
  | "electrify-mc-hpwh"
  | "electrify-mc-stove"
  | "electrify-mc-dryer"
  | "msap-solar"
  | "rces-battery"
  | "maryland-srec"
  | "green-bank-solar-loan"
  | "switch-together-discount"
  | "heehra-heat-pump"     // NOT YET AVAILABLE
  | "heehra-hpwh"          // NOT YET AVAILABLE
  | "heehra-panel"         // NOT YET AVAILABLE
  | "homes-rebate";        // NOT YET AVAILABLE

import type { RebateScope, ServiceArea } from "@/lib/geo/types";

export interface Rebate {
  id: RebateProgram;
  name: string;
  administrator: string;
  type: "rebate" | "tax-credit" | "loan" | "discount" | "srec" | "exemption";
  available: boolean; // false = pending launch
  maxAmount: number;
  minAmount?: number;
  coveragePct?: number; // e.g. 0.75 = covers 75% of cost
  incomeQualified: boolean;
  incomeLimit?: number; // annual household income
  incomeLimitAMIPct?: number; // e.g. 150 = 150% AMI
  stackableWith: RebateProgram[];
  cannotStackWith?: RebateProgram[];
  requiresAudit?: boolean;
  requiresMEAContractor?: boolean;
  description: string;
  url: string;
  applicableCategories: ProductCategory[];
  notes?: string;
  /**
   * Geographic / utility-territory scope. ALL scopes must match for a user
   * to qualify (intersection). Empty array == federal/universal.
   * See src/lib/geo/eligibility.ts for the matching logic.
   */
  scopes: RebateScope[];
}

// ─── Homeowner Profile ─────────────────────────

export type FuelType = "gas" | "electric" | "oil" | "propane";
export type HvacType = "central-ac-gas-furnace" | "heat-pump" | "window-ac" | "boiler" | "mini-split";
export type AMIBracket = "below-80" | "80-150" | "above-150" | "unknown";

export interface HomeProfile {
  zip: string;
  /** Resolved from ZIP via src/lib/geo/zip-lookup.ts on the server. */
  state?: string;
  /** Resolved county id (e.g. "MD:montgomery"). */
  countyId?: string;
  /** Selected by user during intake — required for utility-scoped rebates. */
  electricUtilityId?: string;
  gasUtilityId?: string;
  squareFootage: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  primaryHeatingFuel: FuelType;
  currentHvacType: HvacType;
  hvacAge?: number;
  currentHvacSeer?: number;
  currentFurnaceAfue?: number;
  hasGas: boolean;
  roofAge?: number;
  roofOrientation?: "south" | "east-west" | "north" | "flat";
  atticRValue?: number;
  electricPanel?: 100 | 150 | 200 | 400;
  annualKwh?: number;
  annualTherms?: number;
  monthlyElectricBill?: number;
  pepcoAccountNumber?: string;
  householdIncome?: number;
  amiBracket?: AMIBracket;
  hasExistingSolar: boolean;
  hasEv: boolean;
}

// ─── Savings Scenarios ─────────────────────────

export interface SavingsScenario {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  grossCost: number;
  availableRebates: Array<{
    rebateId: RebateProgram;
    amount: number;
    incomeQualifiedOnly: boolean;
  }>;
  netCostStandard: number; // after non-income-qualified rebates
  netCostIncomeQualified: number; // after all rebates
  annualEnergySavings: number;
  annualMaintenanceSavings: number;
  totalAnnualSavings: number;
  simplePaybackYears: number;
  tenYearNPV: number;
  lifetimeSavings: number;
  lifetimeYears: number;
  co2ReductionTonsPerYear: number;
  recommended: boolean;
  optimalSequence: number; // 1 = do first
  caveats: string[];
}

// ─── Contractor Marketplace ─────────────────────

export type ContractorCategory =
  | "hvac"
  | "solar-installer"
  | "electrician"
  | "insulation"
  | "window"
  | "roofing"
  | "general-contractor"
  | "energy-auditor"
  | "plumber"
  | "ev-charger"
  | "home-performance"
  | "hers-rater";

export type ContractorTier = "verified" | "preferred" | "elite";

export interface Certification {
  name: string;
  issuingBody: string;
  required: boolean;
}

export interface Contractor {
  id: string;
  businessName: string;
  tier: ContractorTier;
  categories: ContractorCategory[];
  /**
   * Where this contractor will physically perform work. One of:
   *   - state-wide: { kind: "state", stateCode }
   *   - specific counties: { kind: "counties", countyIds }
   *   - named metro region: { kind: "metro", regionId }
   * See src/lib/geo/types.ts.
   */
  serviceArea: ServiceArea;
  /** @deprecated — kept for backward compat with the old Vercel intake flow.
   *  New contractor signups should populate `serviceArea` instead. */
  serviceZips?: string[];
  rating: number;
  reviewCount: number;
  mhicLicense: string;
  tradeLicenses: string[];
  certifications: Certification[];
  insuranceVerified: boolean;
  backgroundCheckPassed: boolean;
  meaParticipating: boolean; // MEA Participating Contractor status (required for EmPOWER)
  completedEnergyProjects: number;
  bio: string;
  leadPrice: number; // dollars per qualified lead
}

// ─── Utility Rates (Rockville, MD / PEPCO) ────

export const UTILITY_RATES = {
  electric: {
    blendedPerKwh: 0.217,           // PEPCO all-in blended, April 2026
    generationSOS: 0.1112,
    transmission: 0.021,
    distributionWinter: 0.0433,
    distributionSummer: 0.0876,
    empowerSurcharge: 0.0206,
    customerChargePerMonth: 8.44,
    averageMonthlyUsageKwh: 917,    // ~11,000 kWh/year for 2,000 sq ft 1980 home
  },
  gas: {
    allInPerTherm: 1.40,            // Washington Gas, December 2024
    purchasedGasPerTherm: 0.534,
    systemChargePerMonth: 12.50,
    averageAnnualTherms: 940,       // typical 2,000 sq ft 1980 home
  },
  solar: {
    srecPriceCertified: 70,         // $/SREC, April 2026 (1.5x Brighter Tomorrow multiplier)
    srecPriceStandard: 49,          // $/SREC midpoint
    peakSunHoursPerDay: 4.5,        // Rockville, MD
    specificYieldKwhPerKw: 1300,    // kWh/kW/year in Maryland
    netMeteringRatio: 1.0,          // 1:1 net metering (retail rate)
  },
} as const;

// ─── Baseline Home Energy Profile ─────────────

export const BASELINE_ROCKVILLE_2000SQFT = {
  annualKwh: 11000,
  annualTherms: 940,
  annualElectricCost: 2493,   // 11,000 * $0.217 + monthly charges
  annualGasCost: 1316,        // 940 * $1.40
  annualTotalCost: 3809,
  heatingTherms: 611,         // 80% AFUE gas furnace
  waterHeatingTherms: 188,
  cookingTherms: 80,
  dryingTherms: 61,
  coolingKwh: 4000,           // SEER 10 central AC
  baseloadKwh: 6000,
  furnaceFanKwh: 1000,
} as const;
