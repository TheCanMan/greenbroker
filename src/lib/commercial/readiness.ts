import type { CommercialAssessment, ReadinessResult } from "./feature-types";

const READINESS_ITEMS = [
  {
    key: "utilityBills",
    label: "Utility bills available",
    points: 15,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.utilityBills,
  },
  {
    key: "intervalData",
    label: "Interval data available",
    points: 15,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.intervalData,
  },
  {
    key: "bmsTrendCsv",
    label: "BMS trend logs available",
    points: 20,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.bmsTrendCsv,
  },
  {
    key: "pointList",
    label: "BAS point list available",
    points: 15,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.pointList,
  },
  {
    key: "floorplan",
    label: "Floorplans available",
    points: 10,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.floorplan,
  },
  {
    key: "equipmentSchedule",
    label: "Equipment schedule available",
    points: 10,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.equipmentSchedule,
  },
  {
    key: "occupancyData",
    label: "Occupancy data available",
    points: 10,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.occupancyData,
  },
  {
    key: "iaqData",
    label: "IAQ / CO2 data available",
    points: 5,
    test: (assessment: CommercialAssessment) => assessment.uploadedData.iaqData,
  },
] as const;

export function readinessBand(score: number): string {
  if (score <= 25) return "Bill-only benchmark";
  if (score <= 50) return "Preliminary savings estimate";
  if (score <= 75) return "FDD-ready";
  if (score <= 90) return "Pilot-ready";
  return "Controls-ready";
}

export function nextBestReadinessAction(assessment: CommercialAssessment): string {
  const missing = READINESS_ITEMS.filter((item) => !item.test(assessment));
  const first = missing[0]?.key;

  if (first === "utilityBills") return "Upload 12 months of utility bills for a Tier 0 benchmark.";
  if (first === "intervalData") return "Add interval data or demand history to separate base load from operational waste.";
  if (first === "bmsTrendCsv") return "Export one week of BMS trend CSVs from Niagara, Metasys, WebCTRL, or similar.";
  if (first === "pointList") return "Upload a BAS point list so GreenBroker can normalize messy trend headers.";
  if (first === "floorplan") return "Add a floorplan and map zones to AHUs/VAVs for a pilot-ready work scope.";
  if (first === "equipmentSchedule") return "Add equipment schedules to make contractor actions and rebate matching sharper.";
  if (first === "occupancyData") return "Add occupancy schedule or sensor exports to evaluate O-DCV readiness.";
  if (first === "iaqData") return "Add CO2 or IAQ exports to validate ventilation savings against IAQ guardrails.";
  return "Generate a pilot proposal with measurement and verification steps.";
}

export function calculateDeploymentReadiness(
  assessment: CommercialAssessment,
): ReadinessResult {
  const present: string[] = [];
  const missing: string[] = [];
  const score = READINESS_ITEMS.reduce((sum, item) => {
    if (item.test(assessment)) {
      present.push(item.label);
      return sum + item.points;
    }

    missing.push(item.label);
    return sum;
  }, 0);

  return {
    score,
    band: readinessBand(score),
    nextBestAction: nextBestReadinessAction(assessment),
    present,
    missing,
  };
}

export { READINESS_ITEMS };
