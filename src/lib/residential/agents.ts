import { REBATES } from "@/lib/data/rebates";
import { SUPPLIER_OFFERS, PEPCO_STANDARD_OFFER_RATE } from "@/lib/data/supplier-offers";
import { assessOffer } from "@/lib/data/supplier-risk";
import { findRebatesFor } from "@/lib/geo/eligibility";
import { COUNTY_BY_ID, UTILITY_BY_ID } from "@/lib/geo/registry";
import { resolveZip } from "@/lib/geo/zip-lookup";
import type { CountyId, StateCode } from "@/lib/geo/types";
import type { Rebate } from "@/lib/types";
import type {
  ResidentialIntakeSnapshot,
  UpgradeRecommendation,
} from "@/lib/residential/schemas";
import { residentialIntakeSnapshotSchema } from "@/lib/residential/schemas";

export const GREENBROKER_PLAN_STORAGE_KEY = "greenbroker:latest-residential-plan";

type NormalizedHomeProfile = {
  addressSummary: string;
  utilitySummary: string;
  estimatedAnnualUsage: {
    kwh: number;
    therms: number;
  };
  estimatedAnnualEnergyCost: number;
  missingInfo: string[];
  confidenceScore: number;
  eligibleRebates: Rebate[];
  snapshot: ResidentialIntakeSnapshot;
};

export type ResidentialEnergyPlan = NormalizedHomeProfile & {
  recommendations: UpgradeRecommendation[];
  totalPotentialRebates: number;
  estimatedNetCostRange: [number, number];
  estimatedAnnualSavingsRange: [number, number];
  paybackRange: [number, number];
  supplierComparison: ReturnType<typeof SupplierComparisonAgent>;
};

function moneyRangeFromRebates(rebates: Rebate[]): number {
  return rebates.reduce((sum, rebate) => sum + (rebate.maxAmount || 0), 0);
}

function getRelevantRebateNames(
  rebates: Rebate[],
  categories: string[],
): string[] {
  return rebates
    .filter((rebate) =>
      rebate.applicableCategories.some((category) => categories.includes(category)),
    )
    .map((rebate) => rebate.name);
}

function netCostRange(
  projectCostRange: [number, number],
  rebateAmount: number,
): [number, number] {
  return [
    Math.max(0, projectCostRange[0] - rebateAmount),
    Math.max(0, projectCostRange[1] - Math.min(rebateAmount, projectCostRange[1])),
  ];
}

function paybackRange(
  netCost: [number, number],
  savings: [number, number],
): [number, number] {
  if (netCost[1] === 0) {
    return [0, 1];
  }

  return [
    Math.max(0, Math.round((netCost[0] / Math.max(1, savings[1])) * 10) / 10),
    Math.round((netCost[1] / Math.max(1, savings[0])) * 10) / 10,
  ];
}

function estimateAnnualKwh(snapshot: ResidentialIntakeSnapshot): number {
  if (snapshot.annualKwh) {
    return snapshot.annualKwh;
  }

  const sqft = snapshot.squareFeet ?? 2000;
  return Math.round(11000 * (sqft / 2000));
}

function estimateAnnualTherms(snapshot: ResidentialIntakeSnapshot): number {
  if (snapshot.annualTherms) {
    return snapshot.annualTherms;
  }

  if (
    snapshot.heatingType === "heat_pump" ||
    snapshot.heatingType === "electric_resistance"
  ) {
    return 0;
  }

  const sqft = snapshot.squareFeet ?? 2000;
  return Math.round(700 * (sqft / 2000));
}

export function HomeProfileAgent(input: unknown): NormalizedHomeProfile {
  const snapshot = residentialIntakeSnapshotSchema.parse(input);
  const resolved = resolveZip(snapshot.zip);
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;
  const electricUtility = snapshot.electricUtilityId
    ? UTILITY_BY_ID.get(snapshot.electricUtilityId)
    : null;
  const gasUtility = snapshot.gasUtilityId
    ? UTILITY_BY_ID.get(snapshot.gasUtilityId)
    : null;
  const kwh = estimateAnnualKwh(snapshot);
  const therms = estimateAnnualTherms(snapshot);
  const estimatedAnnualEnergyCost =
    (snapshot.averageMonthlyBill ?? Math.round(kwh * 0.217 / 12 + therms * 1.4 / 12)) * 12;
  const missingInfo = [
    !snapshot.address && "Street address",
    !snapshot.averageMonthlyBill && !snapshot.annualKwh && "Recent electric bill or annual kWh",
    !snapshot.gasUtilityId && therms > 0 && "Gas utility",
    !snapshot.incomeRange && "Income range for income-qualified rebates",
    !snapshot.waterHeaterAge && "Water-heater age",
    !snapshot.hvacAge && "HVAC age",
  ].filter((item): item is string => Boolean(item));
  const eligibleRebates =
    resolved
      ? findRebatesFor(REBATES, {
          state: resolved.state as StateCode,
          countyId: resolved.countyId as CountyId,
          zip: snapshot.zip,
          electricUtilityId: snapshot.electricUtilityId ?? undefined,
          gasUtilityId: snapshot.gasUtilityId ?? undefined,
        })
      : [];
  const confidenceScore = Math.max(52, 92 - missingInfo.length * 8);

  return {
    addressSummary: [
      snapshot.address,
      snapshot.city,
      county?.name ?? snapshot.county,
      resolved?.state ?? snapshot.state,
      snapshot.zip,
    ]
      .filter(Boolean)
      .join(", "),
    utilitySummary: [
      electricUtility?.name ?? "Electric utility not selected",
      gasUtility?.name ?? (therms > 0 ? "Gas utility not selected" : "All-electric / no gas use"),
    ].join(" + "),
    estimatedAnnualUsage: { kwh, therms },
    estimatedAnnualEnergyCost,
    missingInfo,
    confidenceScore,
    eligibleRebates,
    snapshot,
  };
}

export function RebateEligibilityAgent(profile: NormalizedHomeProfile): Rebate[] {
  return profile.eligibleRebates;
}

export function ROIModelingAgent(profile: NormalizedHomeProfile): UpgradeRecommendation[] {
  const { snapshot, eligibleRebates } = profile;
  const hpwhRebates = getRelevantRebateNames(eligibleRebates, ["water-heater"]);
  const insulationRebates = getRelevantRebateNames(eligibleRebates, ["insulation"]);
  const thermostatRebates = getRelevantRebateNames(eligibleRebates, ["smart-thermostat"]);
  const supplierGoal = snapshot.goals.includes("compare_energy_supplier");
  const olderHome = (snapshot.yearBuilt ?? 1985) < 2005;
  const hasGasWaterHeat = snapshot.waterHeaterType === "gas_tank";

  const hpwhProject: [number, number] = hasGasWaterHeat ? [3500, 5500] : [2200, 4200];
  const hpwhRebateAmount = moneyRangeFromRebates(
    eligibleRebates.filter((rebate) =>
      rebate.applicableCategories.includes("water-heater"),
    ),
  );
  const hpwhNet = netCostRange(hpwhProject, hpwhRebateAmount);
  const hpwhSavings: [number, number] = hasGasWaterHeat ? [180, 420] : [350, 650];

  const insulationProject: [number, number] = olderHome ? [5000, 12000] : [2500, 7500];
  const insulationRebateAmount = moneyRangeFromRebates(
    eligibleRebates.filter((rebate) =>
      rebate.applicableCategories.includes("insulation"),
    ),
  );
  const insulationNet = netCostRange(insulationProject, insulationRebateAmount);
  const insulationSavings: [number, number] = olderHome ? [400, 950] : [220, 520];

  const thermostatProject: [number, number] = [120, 280];
  const thermostatRebateAmount = moneyRangeFromRebates(
    eligibleRebates.filter((rebate) =>
      rebate.applicableCategories.includes("smart-thermostat"),
    ),
  );
  const thermostatNet = netCostRange(thermostatProject, thermostatRebateAmount);
  const thermostatSavings: [number, number] = [70, 170];

  const recommendations: UpgradeRecommendation[] = [
    {
      upgradeType: "Heat pump water heater",
      eligibleRebates: hpwhRebates,
      projectCostRange: hpwhProject,
      estimatedNetCostRange: hpwhNet,
      estimatedAnnualSavingsRange: hpwhSavings,
      paybackRange: paybackRange(hpwhNet, hpwhSavings),
      difficulty: "medium",
      contractorRequired: true,
      paperworkStatus: "needs_contractor_quote",
      whyRecommended: hasGasWaterHeat
        ? "Your current water heater appears to use gas, and Pepco plus county programs can materially reduce the cost of switching to a heat pump water heater."
        : "Heat pump water heaters usually deliver strong savings and are one of the clearest appliance rebate opportunities in the Pepco/Montgomery County stack.",
      documentsNeeded: ["Contractor quote", "Invoice", "Model number", "Proof of purchase"],
      contractorQuestions: [
        "Is this model ENERGY STAR certified?",
        "Will you provide the model number and invoice line items needed for the rebate?",
        "Can you confirm electrical and condensate requirements before install?",
      ],
    },
    {
      upgradeType: "Home Performance / insulation / air sealing",
      eligibleRebates: insulationRebates,
      projectCostRange: insulationProject,
      estimatedNetCostRange: insulationNet,
      estimatedAnnualSavingsRange: insulationSavings,
      paybackRange: paybackRange(insulationNet, insulationSavings),
      difficulty: "medium",
      contractorRequired: true,
      paperworkStatus: "needs_contractor_quote",
      whyRecommended: snapshot.insulationConcerns || olderHome
        ? "Your home age or insulation notes suggest envelope work could improve comfort and reduce HVAC runtime."
        : "This is worth keeping on the plan because Home Performance rebates can be large when an audit finds qualifying work.",
      documentsNeeded: ["Home Performance assessment", "Contractor scope", "Invoice", "Before/after test results"],
      contractorQuestions: [
        "Are you a participating Home Performance contractor?",
        "Will the quote separate insulation, air sealing, and duct work?",
        "Which documents will you provide for rebate review?",
      ],
    },
    {
      upgradeType: "Smart thermostat",
      eligibleRebates: thermostatRebates,
      projectCostRange: thermostatProject,
      estimatedNetCostRange: thermostatNet,
      estimatedAnnualSavingsRange: thermostatSavings,
      paybackRange: paybackRange(thermostatNet, thermostatSavings),
      difficulty: "easy",
      contractorRequired: false,
      paperworkStatus: snapshot.hasSmartThermostat ? "needs_model_number" : "ready",
      whyRecommended: snapshot.hasSmartThermostat
        ? "You already have a smart thermostat, so this stays low priority unless the model is not rebate eligible."
        : "This is a low-cost, low-friction upgrade with simple paperwork and a short payback range.",
      documentsNeeded: ["Proof of purchase", "Model number"],
      contractorQuestions: ["Ask whether your HVAC wiring has a common wire if you are not self-installing."],
    },
    {
      upgradeType: "Energy supplier comparison",
      eligibleRebates: [],
      projectCostRange: [0, 0],
      estimatedNetCostRange: [0, 0],
      estimatedAnnualSavingsRange: supplierGoal ? [80, 260] : [40, 180],
      paybackRange: [0, 0],
      difficulty: "easy",
      contractorRequired: false,
      paperworkStatus: "ready",
      whyRecommended: supplierGoal
        ? "You asked to compare suppliers, so we will review fixed-rate offers against your utility supply rate and flag contract risk."
        : "Maryland allows residential energy choice, but only fixed-rate plans with clear terms are worth reviewing.",
      documentsNeeded: ["Most recent electric bill", "Current supplier name if not on utility default supply"],
      contractorQuestions: [],
    },
  ];

  return recommendations.sort((a, b) => {
    const aSavings = a.estimatedAnnualSavingsRange[1];
    const bSavings = b.estimatedAnnualSavingsRange[1];
    const aNet = a.estimatedNetCostRange[0];
    const bNet = b.estimatedNetCostRange[0];
    return bSavings / Math.max(1, bNet + 1) - aSavings / Math.max(1, aNet + 1);
  });
}

export function ProductRecommendationAgent(upgradeType: string) {
  return {
    upgradeType,
    warning:
      "Eligible rebate or instant discount may be available depending on retailer and program rules.",
  };
}

export function ContractorRoutingAgent(recommendation: UpgradeRecommendation) {
  return {
    selectedUpgrade: recommendation.upgradeType,
    packetSections: [
      "Home basics",
      "Utility and equipment summary",
      "Rebate opportunities",
      "Required documents",
      "Project notes",
    ],
    requiredLicenseCategories: recommendation.contractorRequired
      ? ["Maryland home improvement or trade license", "Program participation when required"]
      : [],
  };
}

export function RebatePacketAgent(recommendation: UpgradeRecommendation) {
  return {
    selectedUpgrade: recommendation.upgradeType,
    status:
      recommendation.paperworkStatus === "ready"
        ? "ready_for_review"
        : "missing_info",
    missingItems: recommendation.documentsNeeded,
    submissionInstructions:
      "GreenBroker prepares the packet for review. Homeowner or contractor submission remains manual for MVP.",
  };
}

export function SupplierComparisonAgent(profile: NormalizedHomeProfile) {
  return SUPPLIER_OFFERS.map((offer) => ({
    offer,
    assessment: assessOffer(
      offer,
      profile.estimatedAnnualUsage.kwh,
      PEPCO_STANDARD_OFFER_RATE,
    ),
  })).sort((a, b) => a.assessment.score - b.assessment.score);
}

export function buildResidentialEnergyPlan(input: unknown): ResidentialEnergyPlan {
  const profile = HomeProfileAgent(input);
  const rebates = RebateEligibilityAgent(profile);
  const recommendations = ROIModelingAgent(profile);
  const totalPotentialRebates = recommendations.reduce(
    (sum, item) =>
      sum +
      Math.max(0, item.projectCostRange[1] - item.estimatedNetCostRange[1]),
    0,
  );
  const estimatedNetCostRange: [number, number] = [
    recommendations.reduce((sum, item) => sum + item.estimatedNetCostRange[0], 0),
    recommendations.reduce((sum, item) => sum + item.estimatedNetCostRange[1], 0),
  ];
  const estimatedAnnualSavingsRange: [number, number] = [
    recommendations.reduce((sum, item) => sum + item.estimatedAnnualSavingsRange[0], 0),
    recommendations.reduce((sum, item) => sum + item.estimatedAnnualSavingsRange[1], 0),
  ];

  return {
    ...profile,
    eligibleRebates: rebates,
    recommendations,
    totalPotentialRebates,
    estimatedNetCostRange,
    estimatedAnnualSavingsRange,
    paybackRange: paybackRange(estimatedNetCostRange, estimatedAnnualSavingsRange),
    supplierComparison: SupplierComparisonAgent(profile),
  };
}

