export type CommercialBuildingType =
  | "office"
  | "school"
  | "retail"
  | "multifamily"
  | "gym"
  | "nonprofit"
  | "healthcare"
  | "industrial"
  | "data_center_support"
  | "other";

export type BasVendor =
  | "Niagara"
  | "Metasys"
  | "WebCTRL"
  | "Desigo"
  | "EcoStruxure"
  | "Other"
  | "Unknown";

export type CommercialAssessment = {
  id: string;
  buildingName: string;
  address?: string;
  buildingType: CommercialBuildingType;
  sqft: number;
  yearBuilt?: number;
  lastRenovationYear?: number;
  utilityProvider?: string;
  annualElectricSpend?: number;
  annualGasSpend?: number;
  annualKwh?: number;
  annualTherms?: number;
  basVendor?: BasVendor;
  hasVfds?: boolean;
  hasCentralAhus?: boolean;
  hasCo2Sensors?: boolean;
  hasIaqSensors?: boolean;
  hasSubmeters?: boolean;
  hasControllableOaDampers?: boolean;
  basSupportsSchedules?: boolean;
  variableOccupancy?: boolean;
  floorplanZonesMapped?: boolean;
  iaqConstraintsKnown?: boolean;
  comfortComplaints?: boolean;
  occupancyPattern?: "stable" | "hybrid" | "seasonal" | "unknown";
  operatingSchedule?: string;
  uploadedData: {
    utilityBills: boolean;
    intervalData: boolean;
    bmsTrendCsv: boolean;
    pointList: boolean;
    floorplan: boolean;
    equipmentSchedule: boolean;
    occupancyData: boolean;
    iaqData: boolean;
  };
};

export type RuleSeverity = "low" | "medium" | "high" | "critical";

export type FddRuleDefinition = {
  id: string;
  title: string;
  defaultSeverity: RuleSeverity;
  requiredPoints: string[];
  explanation: string;
  detectionLogic: string;
  savingsPlaceholder: string;
  recommendedActions: string[];
  module: "airside" | "hydronic" | "controls" | "occupancy" | "iaq" | "demand";
};

export type FddFinding = {
  id: string;
  ruleId: string;
  title: string;
  severity: RuleSeverity;
  confidence: number;
  annualWasteDollarsLow: number;
  annualWasteDollarsBase: number;
  annualWasteDollarsHigh: number;
  annualKwhWaste?: number;
  annualThermWaste?: number;
  co2eTons?: number;
  affectedEquipment: string[];
  affectedZones: string[];
  evidenceWindows: {
    start: string;
    end: string;
    points: string[];
    observed: string;
  }[];
  likelyCauses: string[];
  recommendedActions: string[];
  requiredData: string[];
  missingData: string[];
  rebateMatches: string[];
  verificationPlan: string;
};

export type CommercialIncentive = {
  id: string;
  region: "MD" | "DC" | "VA" | "National";
  provider: string;
  programName: string;
  measureTypes: string[];
  incentiveType:
    | "custom"
    | "prescriptive"
    | "financing"
    | "grant"
    | "demand_response"
    | "tax";
  estimatedRange?: string;
  requiredDocs: string[];
  sourceUrl?: string;
  lastVerified?: string;
  notes: string;
};

export type FloorplanZone = {
  id: string;
  name: string;
  floor: string;
  polygon: { x: number; y: number }[];
  sqft?: number;
  useType:
    | "office"
    | "classroom"
    | "conference"
    | "gym"
    | "lab"
    | "mechanical"
    | "corridor"
    | "restroom"
    | "other";
  servedByEquipment: string[];
  occupancySchedule?: string;
  occupancyConfidence?: number;
  fddFindingIds?: string[];
  savingsOpportunity?: number;
};

export type ReadinessResult = {
  score: number;
  band: string;
  nextBestAction: string;
  present: string[];
  missing: string[];
};
