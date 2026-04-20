export type BillIn = {
  utility_type: "electric" | "gas" | "water";
  period_start: string;
  period_end: string;
  kwh_or_therms: number;
  cost_usd: number;
};

export type Tier0Response = {
  id: string;
  name: string;
  bill_count: number;
  effective_rate_usd_per_kwh: number;
  effective_rate_source: string;
};

export type Building = {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  building_type: string;
  sqft: number;
  year_built: number | null;
  climate_zone: string;
  timezone: string;
  utility_territory: string | null;
  effective_rate_usd_per_kwh: number;
  effective_rate_source: string;
  tier: number;
  is_demo: boolean;
  operating_hours_json: Record<string, { start: string; end: string } | null>;
  operating_calendar_json: {
    closures?: { start: string; end: string; reason: string }[];
    holidays?: string[];
  };
  created_at: string;
};

export type Finding = {
  id: string;
  building_id: string;
  rule_id: string;
  equipment_name: string | null;
  severity: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  confidence_score: number;
  title: string;
  description_md: string;
  estimated_annual_savings_usd_low: number;
  estimated_annual_savings_usd_high: number;
  detected_window_start: string | null;
  detected_window_end: string | null;
  supporting_chart_spec_json: { series?: { point_id: string }[]; kind?: string };
  rebate_program_ids: string[];
  status: string;
  created_at: string;
};

export type Rebate = {
  id: string;
  name: string;
  utility_or_program: string;
  region_codes: string[];
  applies_to_rule_ids: string[];
  incentive_description: string;
  typical_incentive_low_usd: number | null;
  typical_incentive_high_usd: number | null;
  source_url: string | null;
};

export type BuildingScore = {
  snapshot_date: string;
  overall_score: number;
  scheduling_subscore: number;
  airflow_subscore: number;
  control_subscore: number;
  ventilation_subscore: number;
  data_quality_subscore: number;
  eui_kbtu_per_sqft: number | null;
  peer_eui_median: number | null;
  peer_percentile: number | null;
  grade: string;
};

export type DataGap = {
  id: string;
  missing_data_type: string;
  unlocks_findings_json: string[];
  unlocks_savings_estimate_usd: number;
  instructions_md: string;
};

export type DataQualityPoint = {
  point_id: string;
  equipment_name: string;
  normalized_name: string;
  missing_pct: number;
  flatline_pct: number;
  outlier_pct: number;
  score: number;
};

export type DashboardPayload = {
  building: Building;
  score: BuildingScore | null;
  top_findings: Finding[];
  all_findings: Finding[];
  data_gaps: DataGap[];
  data_quality: DataQualityPoint[];
  rebates_by_id: Record<string, Rebate>;
  savings_range_low: number;
  savings_range_high: number;
};

export type TrendSeries = {
  point_id: string;
  normalized_name: string;
  equipment_name: string;
  unit: string;
  data: { t: string; v: number | null }[];
};
