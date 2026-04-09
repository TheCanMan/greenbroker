// ─────────────────────────────────────────────────────────────────────────────
// GreenBroker Savings Scenarios
// Based on: 2,000 sq ft, built 1980, 3BR/2BA, Rockville MD
// PEPCO $0.217/kWh, Washington Gas $1.40/therm (April 2026)
// Federal 25C/25D credits: ELIMINATED as of January 1, 2026
// ─────────────────────────────────────────────────────────────────────────────

import type { SavingsScenario } from "@/lib/types";

export const SAVINGS_SCENARIOS: SavingsScenario[] = [
  {
    id: "scenario-a-leds",
    name: "LED Lighting Swap",
    shortName: "LEDs",
    description:
      "Replace 40 incandescent bulbs (60W each) with LEDs (9W each). The single highest-ROI efficiency measure available — nearly instant payback.",
    icon: "💡",
    grossCost: 100,
    availableRebates: [],
    netCostStandard: 100,
    netCostIncomeQualified: 100,
    annualEnergySavings: 485,
    annualMaintenanceSavings: 0,
    totalAnnualSavings: 485,
    simplePaybackYears: 0.2,
    tenYearNPV: 4750,
    lifetimeSavings: 4850, // ~10 year bulb life
    lifetimeYears: 10,
    co2ReductionTonsPerYear: 0.97, // 2,234 kWh × 0.000434 tons CO2/kWh (US avg grid)
    recommended: true,
    optimalSequence: 1,
    caveats: [
      "Do this immediately — 2.5 month payback, $485/year savings for $100 investment",
      "Every homeowner should do this before anything else",
    ],
  },
  {
    id: "scenario-b-heat-pump",
    name: "Heat Pump HVAC Upgrade",
    shortName: "Heat Pump",
    description:
      "Replace 1980s gas furnace (80% AFUE) + central AC (SEER 10) with a modern cold-climate heat pump (SEER2 16, HSPF2 9.5). Best economics when timed with equipment replacement.",
    icon: "🌡️",
    grossCost: 15000,
    availableRebates: [
      { rebateId: "empower-electrification", amount: 7500, incomeQualifiedOnly: false },
      { rebateId: "electrify-mc-heat-pump", amount: 2000, incomeQualifiedOnly: false },
      { rebateId: "heehra-heat-pump", amount: 8000, incomeQualifiedOnly: true },
    ],
    netCostStandard: 5500, // after EmPOWER + Electrify MC (midpoint)
    netCostIncomeQualified: 0, // after EmPOWER + Electrify MC + HEEHRA (pending)
    annualEnergySavings: 173,
    annualMaintenanceSavings: 150,
    totalAnnualSavings: 323,
    simplePaybackYears: 17.0, // at $5,500 net cost
    tenYearNPV: -2770,
    lifetimeSavings: 6133,
    lifetimeYears: 19,
    co2ReductionTonsPerYear: 3.1,
    recommended: false,
    optimalSequence: 3,
    caveats: [
      "At current Maryland rates, gas heating is still cheaper per BTU than heat pump electric heating",
      "Economics improve significantly when paired with solar (reducing effective electric rate)",
      "Best financial case: timed with existing system failure (incremental cost analysis)",
      "When Washington Gas rate increase is approved ($82.5M pending), gas savings increase",
      "When HEEHRA launches, income-qualified households can get this at net-zero cost",
      "CO2 emissions still drop significantly even if energy cost savings are modest",
    ],
  },
  {
    id: "scenario-c-weatherization",
    name: "Full Weatherization",
    shortName: "Weatherization",
    description:
      "Air sealing (ACH50 from 10 to 5), attic insulation (R-13 to R-49), and window replacement (single-pane to Energy Star). Reduces heating/cooling loads by ~30%.",
    icon: "🏠",
    grossCost: 20000,
    availableRebates: [
      { rebateId: "empower-non-electrification", amount: 5000, incomeQualifiedOnly: false },
      { rebateId: "homes-rebate", amount: 4000, incomeQualifiedOnly: false },
    ],
    netCostStandard: 15000, // after EmPOWER non-electrification path
    netCostIncomeQualified: 11000, // with HOMES rebate when available
    annualEnergySavings: 550,
    annualMaintenanceSavings: 0,
    totalAnnualSavings: 550,
    simplePaybackYears: 27.3,
    tenYearNPV: -9500,
    lifetimeSavings: 13750,
    lifetimeYears: 25,
    co2ReductionTonsPerYear: 1.6,
    recommended: false,
    optimalSequence: 4,
    caveats: [
      "Long payback as standalone — best paired with HVAC upgrade or when replacing windows anyway",
      "Improves comfort significantly beyond just energy savings",
      "Required audit for EmPOWER may identify additional efficiency opportunities",
    ],
  },
  {
    id: "scenario-d-solar",
    name: "7.5 kW Solar Array",
    shortName: "Solar",
    description:
      "7.5 kW solar system generating ~9,750 kWh/year in Rockville. Strongest standalone investment even without federal tax credits (eliminated 12/31/2025).",
    icon: "☀️",
    grossCost: 26250, // 7,500W × $3.50/W
    availableRebates: [
      { rebateId: "msap-solar", amount: 7500, incomeQualifiedOnly: true },
      { rebateId: "rces-battery", amount: 0, incomeQualifiedOnly: false }, // battery add-on
      { rebateId: "switch-together-discount", amount: 6562, incomeQualifiedOnly: false }, // 25% group discount
    ],
    netCostStandard: 24150, // after sales tax exemption only (non-income-qualified, no group discount)
    netCostIncomeQualified: 14550, // after MSAP + sales tax exemption
    annualEnergySavings: 2116, // net metering at PEPCO retail rate
    annualMaintenanceSavings: 683, // SREC income at $70/SREC × 9.75 SRECs/year
    totalAnnualSavings: 2799,
    simplePaybackYears: 9.4,
    tenYearNPV: 1740,
    lifetimeSavings: 43725,
    lifetimeYears: 25,
    co2ReductionTonsPerYear: 4.4,
    recommended: true,
    optimalSequence: 2,
    caveats: [
      "Federal 25D solar tax credit was ELIMINATED January 1, 2026 — adds ~3 years to payback vs. pre-OBBBA projections",
      "SREC prices will likely decline as Solar ACP drops from $55 (2025) to $22.50 (2030) — long-term SREC value ~$45/SREC",
      "At conservative $45/SREC: payback extends to 10.3 years — still the best standalone investment",
      "Maryland MSAP ($7,500) requires income ≤150% AMI — apply BEFORE installation, deadline June 5, 2026",
      "Switch Together group discount can save 15-25% — check current enrollment",
      "Net metering is 1:1 retail rate in Maryland — verify this remains in place at time of installation",
    ],
  },
  {
    id: "scenario-e-full-electrification",
    name: "Full Home Electrification",
    shortName: "Full Electric",
    description:
      "Complete electrification: heat pump HVAC + heat pump water heater + induction cooktop + heat pump dryer + panel upgrade + 7.5 kW solar + battery storage. Maximum savings, longest payback.",
    icon: "⚡",
    grossCost: 60750,
    availableRebates: [
      { rebateId: "empower-electrification", amount: 11250, incomeQualifiedOnly: false },
      { rebateId: "electrify-mc-heat-pump", amount: 2000, incomeQualifiedOnly: false },
      { rebateId: "electrify-mc-hpwh", amount: 750, incomeQualifiedOnly: false },
      { rebateId: "empower-hpwh", amount: 1600, incomeQualifiedOnly: false },
      { rebateId: "msap-solar", amount: 7500, incomeQualifiedOnly: true },
      { rebateId: "rces-battery", amount: 5000, incomeQualifiedOnly: false },
      { rebateId: "heehra-heat-pump", amount: 8000, incomeQualifiedOnly: true },
      { rebateId: "heehra-hpwh", amount: 1750, incomeQualifiedOnly: true },
    ],
    netCostStandard: 47750, // ~$13,000 in currently available rebates
    netCostIncomeQualified: 28750, // with income-qualified programs (MSAP + HEEHRA when available)
    annualEnergySavings: 3165,
    annualMaintenanceSavings: 0,
    totalAnnualSavings: 3165,
    simplePaybackYears: 15.1,
    tenYearNPV: -16100,
    lifetimeSavings: 79125,
    lifetimeYears: 25,
    co2ReductionTonsPerYear: 8.9,
    recommended: false,
    optimalSequence: 5,
    caveats: [
      "Negative 10-year NPV at flat rates — economics improve with ~3% annual rate escalation (break-even year 17)",
      "All-electric home uses ~15,839 kWh/year vs. 11,000 kWh + 940 therms — solar offsets most",
      "Net annual energy cost after full electrification: ~$644/year vs. $3,809 today",
      "When HEEHRA launches for income-qualified: additional $14,000 could bring payback under 11 years",
      "Best case: sequence with equipment end-of-life replacement to minimize incremental cost",
      "Washington Gas pending $82.5M rate increase improves heat pump economics when approved",
    ],
  },
];

// ─── Optimal Sequence Recommendation ──────────────────────────────────────────

export const OPTIMAL_SEQUENCE = {
  step1: {
    id: "scenario-a-leds",
    reason: "Immediate ROI — 2.5 month payback, $485/year savings for $100",
  },
  step2: {
    id: "scenario-d-solar",
    reason: "Best standalone investment — 9.4 year payback, $43K lifetime savings",
  },
  step3: {
    id: "scenario-b-heat-pump",
    reason: "Time with existing system end-of-life; solar lowers effective electric rate",
  },
  step4: {
    id: "scenario-c-weatherization",
    reason: "Time with planned renovations; reduces solar/HVAC sizing needed",
  },
  step5: {
    id: "scenario-e-full-electrification",
    reason: "Maximum savings and CO2 reduction; time with HEEHRA launch for max rebates",
  },
};

// ─── Key Data Context ─────────────────────────────────────────────────────────

export const POLICY_ALERT = {
  title: "Federal Tax Credits Eliminated",
  body:
    "The One Big Beautiful Bill Act (signed July 4, 2025) eliminated the 30% federal solar tax credit (Section 25D) and the home improvement credit (Section 25C) for installations after December 31, 2025. Many websites still show these credits as 'available through 2032' — that information is outdated. State and local programs (EmPOWER, Electrify MC, MSAP, RCES) are now the primary financial drivers.",
  severity: "warning" as const,
  lastVerified: "April 2026",
};
