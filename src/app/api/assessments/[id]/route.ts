import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { ResidentialIntakeSnapshot } from "@/lib/residential/schemas";

function objectFromJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function stringArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function validGoals(value: unknown): ResidentialIntakeSnapshot["goals"] {
  const allowed = new Set([
    "lower_bills",
    "replace_broken_equipment",
    "improve_comfort",
    "electrify_home",
    "solar_or_battery",
    "compare_energy_supplier",
    "get_contractor_quotes",
    "improve_indoor_air_quality",
  ]);

  const goals = stringArrayValue(value).filter((goal) => allowed.has(goal));
  return goals.length > 0
    ? (goals as ResidentialIntakeSnapshot["goals"])
    : ["lower_bills"];
}

function snapshotFromAssessmentRow(row: Record<string, unknown>): ResidentialIntakeSnapshot {
  const intake = objectFromJson(row.intake_v2);

  return {
    assessmentId: String(row.id),
    address: stringValue(intake.address),
    zip: String(row.zip),
    city: stringValue(intake.city),
    county: stringValue(intake.county),
    state: stringValue(row.state),
    electricUtilityId: stringValue(row.electric_utility_id),
    gasUtilityId: stringValue(row.gas_utility_id),
    homeType: stringValue(intake.home_type),
    ownershipStatus: stringValue(intake.ownership_status),
    yearBuilt: numberValue(row.year_built) ?? undefined,
    squareFeet: numberValue(row.square_footage) ?? undefined,
    occupants: numberValue(intake.occupants) ?? undefined,
    averageMonthlyBill: numberValue(intake.average_monthly_bill),
    annualKwh: numberValue(row.annual_kwh),
    annualTherms: numberValue(row.annual_therms),
    currentSupplierKnown: booleanValue(intake.current_supplier_known) ?? undefined,
    currentSupplierName: stringValue(intake.current_supplier_name),
    heatingType: stringValue(intake.heating_type) ?? stringValue(row.primary_heating_fuel),
    coolingType: stringValue(intake.cooling_type),
    waterHeaterType: stringValue(intake.water_heater_type),
    waterHeaterAge: numberValue(intake.water_heater_age),
    hvacAge: numberValue(row.hvac_age),
    hasSmartThermostat: booleanValue(intake.has_smart_thermostat) ?? undefined,
    insulationConcerns: stringValue(intake.insulation_concerns),
    windowCondition: stringValue(intake.window_condition),
    roofAge: numberValue(row.roof_age),
    goals: validGoals(intake.goals),
    householdSize: numberValue(intake.household_size),
    incomeRange: stringValue(intake.income_range),
    assistancePrograms: stringArrayValue(intake.assistance_programs),
    submittedAt: stringValue(intake.submitted_at) ?? undefined,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : userClient;

  const { data, error } = await supabase
    .from("home_assessments")
    .select(
      "id, profile_id, zip, state, electric_utility_id, gas_utility_id, square_footage, " +
        "year_built, primary_heating_fuel, current_hvac_type, hvac_age, " +
        "annual_kwh, annual_therms, roof_age, intake_v2, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[assessment detail] read failed:", error);
    return NextResponse.json({ error: "Failed to fetch assessment" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const row = data as Record<string, unknown>;
  const profileId = stringValue(row.profile_id);
  if (profileId) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await userClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || (profile as { id: string }).id !== profileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    assessment: data,
    snapshot: snapshotFromAssessmentRow(row),
  });
}
