// ─────────────────────────────────────────────────────────────────────────────
// GreenBroker Savings Calculation Engine
// ─────────────────────────────────────────────────────────────────────────────

import { UTILITY_RATES, BASELINE_ROCKVILLE_2000SQFT } from "@/lib/types";
import type { HomeProfile, AMIBracket } from "@/lib/types";

// ─── Core calculation functions ───────────────────────────────────────────────

/**
 * Calculate annual electricity cost at current PEPCO rates
 */
export function calcAnnualElectricCost(annualKwh: number): number {
  return (
    annualKwh * UTILITY_RATES.electric.blendedPerKwh +
    UTILITY_RATES.electric.customerChargePerMonth * 12
  );
}

/**
 * Calculate annual gas cost at current Washington Gas rates
 */
export function calcAnnualGasCost(annualTherms: number): number {
  return (
    annualTherms * UTILITY_RATES.gas.allInPerTherm +
    UTILITY_RATES.gas.systemChargePerMonth * 12
  );
}

/**
 * Estimate LED savings for a home
 * @param numIncandescent - number of 60W incandescent bulbs to replace
 */
export function calcLEDSavings(numIncandescent: number = 40): {
  annualKwhSaved: number;
  annualDollarsSaved: number;
  investmentCost: number;
  paybackMonths: number;
} {
  const kwhPerBulbPerYear = (60 - 9) * 3 * 365 / 1000; // 3 hours/day usage
  const annualKwhSaved = numIncandescent * kwhPerBulbPerYear;
  const annualDollarsSaved = annualKwhSaved * UTILITY_RATES.electric.blendedPerKwh;
  const investmentCost = numIncandescent * 2.5; // $2.50 avg per LED bulb
  const paybackMonths = (investmentCost / annualDollarsSaved) * 12;

  return { annualKwhSaved, annualDollarsSaved, investmentCost, paybackMonths };
}

/**
 * Calculate solar savings for a Rockville home
 * @param systemSizeKw - system size in kilowatts
 * @param installedCostPerWatt - cost per watt installed
 */
export function calcSolarSavings(
  systemSizeKw: number = 7.5,
  installedCostPerWatt: number = 3.50
): {
  annualKwhGenerated: number;
  annualNetMeteringSavings: number;
  annualSrecIncome: number;
  totalAnnualValue: number;
  grossSystemCost: number;
  salesTaxSavings: number;
  simplePaybackYears: number;
  lifetime25YearSavings: number;
  co2TonsPerYear: number;
} {
  const annualKwhGenerated =
    systemSizeKw * UTILITY_RATES.solar.specificYieldKwhPerKw;

  const annualNetMeteringSavings =
    annualKwhGenerated *
    UTILITY_RATES.electric.blendedPerKwh *
    UTILITY_RATES.solar.netMeteringRatio;

  const srecCount = annualKwhGenerated / 1000; // 1 SREC per MWh
  const annualSrecIncome = srecCount * UTILITY_RATES.solar.srecPriceCertified;

  const totalAnnualValue = annualNetMeteringSavings + annualSrecIncome;

  const grossSystemCost = systemSizeKw * 1000 * installedCostPerWatt;
  const salesTaxSavings = grossSystemCost * 0.06; // Maryland 6% sales tax exemption

  const simplePaybackYears = grossSystemCost / totalAnnualValue;
  const lifetime25YearSavings = totalAnnualValue * 25 - grossSystemCost;

  // CO2: PJM average grid emission factor ~0.434 lbs CO2/kWh = 0.000197 metric tons
  const co2TonsPerYear = annualKwhGenerated * 0.000197;

  return {
    annualKwhGenerated,
    annualNetMeteringSavings,
    annualSrecIncome,
    totalAnnualValue,
    grossSystemCost,
    salesTaxSavings,
    simplePaybackYears,
    lifetime25YearSavings,
    co2TonsPerYear,
  };
}

/**
 * Calculate heat pump savings vs. existing gas furnace + AC system
 * @param existingSeerLegacy - existing AC efficiency (default SEER 10 from 1980s)
 * @param existingAfue - existing furnace efficiency (default 0.80)
 * @param newSeer2 - new heat pump SEER2 rating
 * @param newHspf2 - new heat pump HSPF2 rating
 */
export function calcHeatPumpSavings(
  existingSeerLegacy: number = 10,
  existingAfue: number = 0.80,
  newSeer2: number = 16,
  newHspf2: number = 9.5,
  annualCoolingKwh: number = 4000,
  annualHeatingTherms: number = 611
): {
  currentSystemAnnualCost: number;
  newSystemAnnualCost: number;
  annualEnergySavings: number;
  annualMaintenanceSavings: number;
  totalAnnualSavings: number;
  gasPerKbtuCents: number;
  hpElectricPerKbtuCents: number;
  heatPumpCheaperThanGas: boolean;
} {
  // Current system cost
  const coolingKwhNew = annualCoolingKwh * (existingSeerLegacy / (newSeer2 * 1.08)); // SEER to SEER2 ~8% adjustment
  const currentCoolingCost = annualCoolingKwh * UTILITY_RATES.electric.blendedPerKwh;
  const currentHeatingCost = annualHeatingTherms * UTILITY_RATES.gas.allInPerTherm;
  const currentFanCost = 1000 * UTILITY_RATES.electric.blendedPerKwh; // furnace fan
  const currentSystemAnnualCost = currentCoolingCost + currentHeatingCost + currentFanCost;

  // New heat pump cost
  // Heating: convert therms to kWh equivalent, then apply HSPF2
  const heatingBtu = annualHeatingTherms * 100000; // 100,000 BTU/therm
  const hpHeatingKwh = heatingBtu / (newHspf2 * 3412); // HSPF2 in BTU/Wh
  const hpCoolingKwh = annualCoolingKwh * (existingSeerLegacy / (newSeer2 * 1.08));
  const newSystemAnnualCost =
    (hpHeatingKwh + hpCoolingKwh) * UTILITY_RATES.electric.blendedPerKwh;

  const annualEnergySavings = currentSystemAnnualCost - newSystemAnnualCost;
  const annualMaintenanceSavings = 150; // estimated maintenance savings

  // BTU cost comparison (decision factor)
  const gasPerKbtu = (UTILITY_RATES.gas.allInPerTherm / (100 * existingAfue)) * 100; // cents/kBTU
  const hpElectricPerKbtu =
    ((UTILITY_RATES.electric.blendedPerKwh / newHspf2) / 3.412) * 100; // cents/kBTU

  return {
    currentSystemAnnualCost,
    newSystemAnnualCost,
    annualEnergySavings,
    annualMaintenanceSavings,
    totalAnnualSavings: annualEnergySavings + annualMaintenanceSavings,
    gasPerKbtuCents: gasPerKbtu,
    hpElectricPerKbtuCents: hpElectricPerKbtu,
    heatPumpCheaperThanGas: hpElectricPerKbtu < gasPerKbtu,
  };
}

/**
 * Calculate heat pump water heater savings
 * @param currentType - existing water heater type
 * @param newUef - new HPWH UEF rating (default 4.07 = Rheem ProTerra)
 */
export function calcHPWHSavings(
  currentType: "electric-resistance" | "gas-tank" = "electric-resistance",
  newUef: number = 4.07
): {
  currentAnnualCost: number;
  newAnnualCost: number;
  annualSavings: number;
  availableRebates: number;
  netInvestmentAfterRebates: number;
  paybackYears: number;
} {
  const annualHotWaterKbtu = 18800; // average household, 64.3 gal/day at 59°F rise

  let currentAnnualCost: number;
  if (currentType === "electric-resistance") {
    // Standard electric resistance: UEF ~0.92
    const kwhNeeded = (annualHotWaterKbtu * 1000) / (0.92 * 3412);
    currentAnnualCost = kwhNeeded * UTILITY_RATES.electric.blendedPerKwh;
  } else {
    // Gas tank: UEF ~0.67
    const thermsNeeded = (annualHotWaterKbtu / 100000) / 0.67;
    currentAnnualCost = thermsNeeded * UTILITY_RATES.gas.allInPerTherm;
  }

  // New HPWH cost
  const hpwhKwhNeeded = (annualHotWaterKbtu * 1000) / (newUef * 3412);
  const newAnnualCost = hpwhKwhNeeded * UTILITY_RATES.electric.blendedPerKwh;

  const annualSavings = currentAnnualCost - newAnnualCost;

  // Available rebates (PEPCO EmPOWER $1,600 + Electrify MC $500)
  const availableRebates = 2100;
  const grossCost = 2000; // typical installed cost
  const netInvestmentAfterRebates = Math.max(0, grossCost - availableRebates);
  const paybackYears = netInvestmentAfterRebates / annualSavings;

  return {
    currentAnnualCost,
    newAnnualCost,
    annualSavings,
    availableRebates,
    netInvestmentAfterRebates,
    paybackYears,
  };
}

/**
 * Calculate full home energy profile savings based on HomeProfile
 */
export function calcPersonalizedSavings(profile: HomeProfile): {
  currentAnnualCost: number;
  ledSavings: ReturnType<typeof calcLEDSavings>;
  solarSavings: ReturnType<typeof calcSolarSavings>;
  heatPumpSavings: ReturnType<typeof calcHeatPumpSavings>;
  hpwhSavings: ReturnType<typeof calcHPWHSavings>;
  estimatedRebatesAvailable: number;
} {
  const annualKwh = profile.annualKwh ?? BASELINE_ROCKVILLE_2000SQFT.annualKwh;
  const annualTherms = profile.annualTherms ?? BASELINE_ROCKVILLE_2000SQFT.annualTherms;

  const currentAnnualCost =
    calcAnnualElectricCost(annualKwh) +
    (profile.hasGas ? calcAnnualGasCost(annualTherms) : 0);

  // Scale system size based on home square footage
  const sqftRatio = profile.squareFootage / 2000;
  const solarSizeKw = Math.round(7.5 * sqftRatio * 10) / 10;

  const ledSavings = calcLEDSavings(Math.round(40 * sqftRatio));
  const solarSavings = calcSolarSavings(solarSizeKw);
  const heatPumpSavings = calcHeatPumpSavings(
    profile.currentHvacSeer ?? 10,
    profile.currentFurnaceAfue ?? 0.80,
    16,
    9.5,
    4000 * sqftRatio,
    611 * sqftRatio
  );
  const hpwhSavings = calcHPWHSavings(
    profile.primaryHeatingFuel === "electric" ? "electric-resistance" : "gas-tank"
  );

  // Rough rebate estimate
  let estimatedRebatesAvailable = 0;
  if (profile.hasGas) estimatedRebatesAvailable += 9500; // EmPOWER + Electrify MC heat pump
  estimatedRebatesAvailable += 2100; // PEPCO HPWH + Electrify MC HPWH
  if (profile.amiBracket === "below-80" || profile.amiBracket === "80-150") {
    estimatedRebatesAvailable += 7500; // MSAP solar
    estimatedRebatesAvailable += 9750; // HEEHRA (pending)
  }
  estimatedRebatesAvailable += 5000; // RCES battery

  return {
    currentAnnualCost,
    ledSavings,
    solarSavings,
    heatPumpSavings,
    hpwhSavings,
    estimatedRebatesAvailable,
  };
}

/**
 * Format dollar amounts for display
 */
export function formatCurrency(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Calculate NPV at a given discount rate
 */
export function calcNPV(
  annualCashFlow: number,
  years: number,
  initialInvestment: number,
  discountRate: number = 0.05
): number {
  let npv = -initialInvestment;
  for (let t = 1; t <= years; t++) {
    npv += annualCashFlow / Math.pow(1 + discountRate, t);
  }
  return npv;
}

/**
 * Determine AMI bracket based on household income for Montgomery County
 * Based on HUD FY2026 income limits (approximate)
 */
export function determineAMIBracket(annualHouseholdIncome: number): AMIBracket {
  // Montgomery County, MD HUD income limits (approximate for 4-person HH)
  const ami = 136700; // FY2026 area median income
  const pct80 = ami * 0.80; // $109,360
  const pct150 = ami * 1.50; // $205,050

  if (annualHouseholdIncome <= pct80) return "below-80";
  if (annualHouseholdIncome <= pct150) return "80-150";
  return "above-150";
}
