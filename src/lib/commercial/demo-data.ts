import type {
  Building,
  DashboardPayload,
  Finding,
  TrendSeries,
  BuildingScore,
  DataGap,
  DataQualityPoint,
  Rebate,
} from "@/lib/commercial/types";

export const COMMERCIAL_DEMO_BUILDING_ID = "demo-sample-school";

const OPERATING_HOURS: Building["operating_hours_json"] = {
  monday: { start: "07:00", end: "17:00" },
  tuesday: { start: "07:00", end: "17:00" },
  wednesday: { start: "07:00", end: "17:00" },
  thursday: { start: "07:00", end: "17:00" },
  friday: { start: "07:00", end: "17:00" },
  saturday: null,
  sunday: null,
};

const DEMO_BUILDING: Building = {
  id: COMMERCIAL_DEMO_BUILDING_ID,
  org_id: "demo-org",
  name: "Sample Middle School",
  address: "1200 Campus Drive",
  city: "Rockville",
  state: "MD",
  zip: "20850",
  building_type: "k12",
  sqft: 65000,
  year_built: 1998,
  climate_zone: "4A",
  timezone: "America/New_York",
  utility_territory: "pepco",
  effective_rate_usd_per_kwh: 0.14,
  effective_rate_source: "default_pepco_commercial_blended",
  tier: 1,
  is_demo: true,
  operating_hours_json: OPERATING_HOURS,
  operating_calendar_json: {
    holidays: ["2026-01-19", "2026-02-16", "2026-04-03"],
  },
  created_at: "2026-04-01T13:00:00Z",
};

const DEMO_SCORE: BuildingScore = {
  snapshot_date: "2026-04-20T15:00:00Z",
  overall_score: 42,
  scheduling_subscore: 34,
  airflow_subscore: 47,
  control_subscore: 39,
  ventilation_subscore: 51,
  data_quality_subscore: 74,
  eui_kbtu_per_sqft: 72,
  peer_eui_median: 58,
  peer_percentile: 68,
  grade: "D",
};

const DEMO_REBATES: Record<string, Rebate> = {
  pepco_rcx: {
    id: "pepco_rcx",
    name: "PEPCO Retro-commissioning",
    utility_or_program: "PEPCO",
    region_codes: ["MD"],
    applies_to_rule_ids: ["R002", "R007", "R010"],
    incentive_description:
      "Covers investigation and implementation incentives for low-cost controls and scheduling fixes.",
    typical_incentive_low_usd: 4000,
    typical_incentive_high_usd: 18000,
    source_url: "https://www.pepco.com/smart-energy/business/Pages/default.aspx",
  },
  mea_school_hvac: {
    id: "mea_school_hvac",
    name: "Maryland Energy Administration school HVAC support",
    utility_or_program: "MEA",
    region_codes: ["MD"],
    applies_to_rule_ids: ["R001", "R003", "R009"],
    incentive_description:
      "State support for public-building HVAC optimization and high-impact controls upgrades.",
    typical_incentive_low_usd: 5000,
    typical_incentive_high_usd: 25000,
    source_url: "https://energy.maryland.gov/business/Pages/BusinessEnergyPrograms.aspx",
  },
};

const DEMO_FINDINGS: Finding[] = [
  {
    id: "finding-afterhours-runtime",
    building_id: COMMERCIAL_DEMO_BUILDING_ID,
    rule_id: "R007",
    equipment_name: "AHU-2",
    severity: "high",
    confidence: "high",
    confidence_score: 0.92,
    title: "AHU-2 is running well past occupied hours",
    description_md:
      "**Observed:** Supply fan and cooling stayed active until 10:30 PM on multiple weekdays.\n\n**Why it matters:** This is classic after-hours runtime waste in a school with a tight occupied schedule.\n\n**Recommended next step:** Audit the weekly schedule, holiday calendar, and any overrides left active by the BAS.",
    estimated_annual_savings_usd_low: 4200,
    estimated_annual_savings_usd_high: 7600,
    detected_window_start: "2026-04-12T19:00:00Z",
    detected_window_end: "2026-04-18T02:30:00Z",
    supporting_chart_spec_json: { series: [{ point_id: "ahu2_fan" }, { point_id: "ahu2_oat" }], kind: "line" },
    rebate_program_ids: ["pepco_rcx"],
    status: "open",
    created_at: "2026-04-20T15:00:00Z",
  },
  {
    id: "finding-economizer",
    building_id: COMMERCIAL_DEMO_BUILDING_ID,
    rule_id: "R002",
    equipment_name: "AHU-1",
    severity: "high",
    confidence: "medium",
    confidence_score: 0.79,
    title: "Economizer damper stays near minimum during free-cooling weather",
    description_md:
      "**Observed:** Outdoor air was in the 50s while mechanical cooling remained active and OA damper command stayed near minimum.\n\n**Why it matters:** The unit is missing free cooling opportunities during shoulder season.\n\n**Recommended next step:** Verify economizer enable logic, mixed-air temperature sensor calibration, and actuator stroke.",
    estimated_annual_savings_usd_low: 3100,
    estimated_annual_savings_usd_high: 5900,
    detected_window_start: "2026-04-15T13:00:00Z",
    detected_window_end: "2026-04-18T19:00:00Z",
    supporting_chart_spec_json: { series: [{ point_id: "ahu1_oa_damper" }, { point_id: "ahu1_oat" }], kind: "line" },
    rebate_program_ids: ["pepco_rcx"],
    status: "open",
    created_at: "2026-04-20T15:00:00Z",
  },
  {
    id: "finding-simultaneous-heat-cool",
    building_id: COMMERCIAL_DEMO_BUILDING_ID,
    rule_id: "R001",
    equipment_name: "VAV-3",
    severity: "medium",
    confidence: "medium",
    confidence_score: 0.74,
    title: "Heating and cooling are fighting in multiple morning warm-up windows",
    description_md:
      "**Observed:** Heating valve and cooling command overlap for 15 to 30 minutes during morning recovery.\n\n**Why it matters:** The system is paying to reheat air that is still being cooled upstream.\n\n**Recommended next step:** Review morning warm-up sequence and terminal box control deadbands.",
    estimated_annual_savings_usd_low: 1800,
    estimated_annual_savings_usd_high: 3400,
    detected_window_start: "2026-04-14T10:00:00Z",
    detected_window_end: "2026-04-18T12:00:00Z",
    supporting_chart_spec_json: { series: [{ point_id: "vav3_heat" }, { point_id: "vav3_cool" }], kind: "line" },
    rebate_program_ids: ["mea_school_hvac"],
    status: "open",
    created_at: "2026-04-20T15:00:00Z",
  },
  {
    id: "finding-static-pressure-reset",
    building_id: COMMERCIAL_DEMO_BUILDING_ID,
    rule_id: "R010",
    equipment_name: "AHU-2",
    severity: "medium",
    confidence: "low",
    confidence_score: 0.61,
    title: "Static pressure setpoint appears fixed across load conditions",
    description_md:
      "**Observed:** Supply fan VFD speed stays elevated while pressure setpoint remains flat all day.\n\n**Why it matters:** Fixed static pressure wastes fan energy and masks VAV diversity.\n\n**Recommended next step:** Confirm trim-and-respond reset is enabled and that downstream damper positions are available.",
    estimated_annual_savings_usd_low: 1200,
    estimated_annual_savings_usd_high: 2600,
    detected_window_start: "2026-04-13T12:00:00Z",
    detected_window_end: "2026-04-18T21:00:00Z",
    supporting_chart_spec_json: { series: [{ point_id: "ahu2_sap" }, { point_id: "ahu2_vfd" }], kind: "line" },
    rebate_program_ids: ["pepco_rcx"],
    status: "open",
    created_at: "2026-04-20T15:00:00Z",
  },
];

const DEMO_DATA_GAPS: DataGap[] = [
  {
    id: "gap-chilled-water",
    missing_data_type: "chilled_water_delta_t",
    unlocks_findings_json: ["R003"],
    unlocks_savings_estimate_usd: 4200,
    instructions_md:
      "Upload CHW supply and return temperature trends to unlock low-delta-T diagnostics on the chilled-water loop.",
  },
  {
    id: "gap-zone-points",
    missing_data_type: "zone_level_points",
    unlocks_findings_json: ["R006", "R009"],
    unlocks_savings_estimate_usd: 5100,
    instructions_md:
      "Zone temperature, heating command, and cooling command points would tighten terminal-unit findings and comfort diagnostics.",
  },
];

const DEMO_DATA_QUALITY: DataQualityPoint[] = [
  {
    point_id: "ahu1_oa_damper",
    equipment_name: "AHU-1",
    normalized_name: "oa_damper_cmd",
    missing_pct: 3,
    flatline_pct: 28,
    outlier_pct: 1,
    score: 63,
  },
  {
    point_id: "ahu2_sap",
    equipment_name: "AHU-2",
    normalized_name: "supply_air_pressure",
    missing_pct: 0,
    flatline_pct: 35,
    outlier_pct: 0,
    score: 58,
  },
  {
    point_id: "vav3_heat",
    equipment_name: "VAV-3",
    normalized_name: "heating_valve_cmd",
    missing_pct: 7,
    flatline_pct: 12,
    outlier_pct: 5,
    score: 71,
  },
];

const DEMO_TRENDS: Record<string, TrendSeries[]> = {
  "finding-afterhours-runtime": [
    {
      point_id: "ahu2_fan",
      normalized_name: "fan_status",
      equipment_name: "AHU-2",
      unit: "status",
      data: [
        { t: "2026-04-17T19:00:00Z", v: 1 },
        { t: "2026-04-17T20:00:00Z", v: 1 },
        { t: "2026-04-17T21:00:00Z", v: 1 },
        { t: "2026-04-17T22:00:00Z", v: 1 },
        { t: "2026-04-17T23:00:00Z", v: 1 },
        { t: "2026-04-18T00:00:00Z", v: 0 },
      ],
    },
    {
      point_id: "ahu2_oat",
      normalized_name: "outside_air_temp",
      equipment_name: "Site",
      unit: "degF",
      data: [
        { t: "2026-04-17T19:00:00Z", v: 61 },
        { t: "2026-04-17T20:00:00Z", v: 58 },
        { t: "2026-04-17T21:00:00Z", v: 55 },
        { t: "2026-04-17T22:00:00Z", v: 53 },
        { t: "2026-04-17T23:00:00Z", v: 51 },
        { t: "2026-04-18T00:00:00Z", v: 49 },
      ],
    },
  ],
  "finding-economizer": [
    {
      point_id: "ahu1_oa_damper",
      normalized_name: "oa_damper_cmd",
      equipment_name: "AHU-1",
      unit: "%",
      data: [
        { t: "2026-04-16T14:00:00Z", v: 12 },
        { t: "2026-04-16T15:00:00Z", v: 12 },
        { t: "2026-04-16T16:00:00Z", v: 14 },
        { t: "2026-04-16T17:00:00Z", v: 13 },
        { t: "2026-04-16T18:00:00Z", v: 12 },
      ],
    },
    {
      point_id: "ahu1_oat",
      normalized_name: "outside_air_temp",
      equipment_name: "Site",
      unit: "degF",
      data: [
        { t: "2026-04-16T14:00:00Z", v: 56 },
        { t: "2026-04-16T15:00:00Z", v: 57 },
        { t: "2026-04-16T16:00:00Z", v: 58 },
        { t: "2026-04-16T17:00:00Z", v: 59 },
        { t: "2026-04-16T18:00:00Z", v: 57 },
      ],
    },
  ],
  "finding-simultaneous-heat-cool": [
    {
      point_id: "vav3_heat",
      normalized_name: "heating_valve_cmd",
      equipment_name: "VAV-3",
      unit: "%",
      data: [
        { t: "2026-04-15T10:00:00Z", v: 42 },
        { t: "2026-04-15T10:15:00Z", v: 38 },
        { t: "2026-04-15T10:30:00Z", v: 29 },
        { t: "2026-04-15T10:45:00Z", v: 14 },
      ],
    },
    {
      point_id: "vav3_cool",
      normalized_name: "cooling_valve_cmd",
      equipment_name: "VAV-3",
      unit: "%",
      data: [
        { t: "2026-04-15T10:00:00Z", v: 18 },
        { t: "2026-04-15T10:15:00Z", v: 22 },
        { t: "2026-04-15T10:30:00Z", v: 25 },
        { t: "2026-04-15T10:45:00Z", v: 12 },
      ],
    },
  ],
  "finding-static-pressure-reset": [
    {
      point_id: "ahu2_sap",
      normalized_name: "supply_air_pressure_sp",
      equipment_name: "AHU-2",
      unit: "in.w.c.",
      data: [
        { t: "2026-04-17T13:00:00Z", v: 2.1 },
        { t: "2026-04-17T15:00:00Z", v: 2.1 },
        { t: "2026-04-17T17:00:00Z", v: 2.1 },
        { t: "2026-04-17T19:00:00Z", v: 2.1 },
      ],
    },
    {
      point_id: "ahu2_vfd",
      normalized_name: "vfd_speed_cmd",
      equipment_name: "AHU-2",
      unit: "%",
      data: [
        { t: "2026-04-17T13:00:00Z", v: 78 },
        { t: "2026-04-17T15:00:00Z", v: 75 },
        { t: "2026-04-17T17:00:00Z", v: 76 },
        { t: "2026-04-17T19:00:00Z", v: 74 },
      ],
    },
  ],
};

export function isCommercialDemoBuildingId(id: string): boolean {
  return id === COMMERCIAL_DEMO_BUILDING_ID;
}

export function getCommercialDemoBuilding(): Building {
  return DEMO_BUILDING;
}

export function getCommercialDemoDashboard(): DashboardPayload {
  return {
    building: DEMO_BUILDING,
    score: DEMO_SCORE,
    top_findings: DEMO_FINDINGS.slice(0, 3),
    all_findings: DEMO_FINDINGS,
    data_gaps: DEMO_DATA_GAPS,
    data_quality: DEMO_DATA_QUALITY,
    rebates_by_id: DEMO_REBATES,
    savings_range_low: 10300,
    savings_range_high: 19500,
  };
}

export function isCommercialDemoFindingId(id: string): boolean {
  return id in DEMO_TRENDS;
}

export function getCommercialDemoTrend(id: string): TrendSeries[] {
  return DEMO_TRENDS[id] ?? [];
}

