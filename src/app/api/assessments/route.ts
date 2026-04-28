import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { AssessmentSchema } from "@/lib/validations/assessment";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/ratelimit";
import { calcPersonalizedSavings, determineAMIBracket } from "@/lib/calculations/savings";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID, UTILITY_BY_ID } from "@/lib/geo/registry";
import { buildResidentialEnergyPlan } from "@/lib/residential/agents";
import type { ResidentialIntakeSnapshot } from "@/lib/residential/schemas";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AssessmentInsert = Database["public"]["Tables"]["home_assessments"]["Insert"];

function isMissingIntakeV2Column(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; details?: string };
  const text = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();

  return (
    err.code === "42703" ||
    text.includes("intake_v2") ||
    text.includes("schema cache")
  );
}

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
    goals: stringArrayValue(intake.goals).filter((goal) =>
      [
        "lower_bills",
        "replace_broken_equipment",
        "improve_comfort",
        "electrify_home",
        "solar_or_battery",
        "compare_energy_supplier",
        "get_contractor_quotes",
        "improve_indoor_air_quality",
      ].includes(goal),
    ) as ResidentialIntakeSnapshot["goals"],
    householdSize: numberValue(intake.household_size),
    incomeRange: stringValue(intake.income_range),
    assistancePrograms: stringArrayValue(intake.assistance_programs),
    submittedAt: stringValue(intake.submitted_at) ?? undefined,
  };
}

async function persistResidentialMarketplaceModels({
  client,
  assessmentId,
  profileId,
  data,
  resolvedZip,
}: {
  client: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>;
  assessmentId: string;
  profileId: string | null;
  data: z.infer<typeof AssessmentSchema>;
  resolvedZip: ReturnType<typeof resolveZip>;
}) {
  const intake = objectFromJson(data.intake_v2);
  const now = new Date().toISOString();
  const homeProfileId = crypto.randomUUID();
  const county = resolvedZip ? COUNTY_BY_ID.get(resolvedZip.countyId) : null;

  const snapshot: ResidentialIntakeSnapshot = {
    assessmentId,
    address: stringValue(intake.address),
    zip: data.zip,
    city: stringValue(intake.city),
    county: stringValue(intake.county) ?? county?.name ?? null,
    state: resolvedZip?.state ?? null,
    electricUtilityId: data.electricUtilityId ?? null,
    gasUtilityId: data.gasUtilityId ?? null,
    homeType: stringValue(intake.home_type),
    ownershipStatus: stringValue(intake.ownership_status),
    yearBuilt: data.yearBuilt,
    squareFeet: data.squareFootage,
    occupants: numberValue(intake.occupants) ?? undefined,
    averageMonthlyBill: numberValue(intake.average_monthly_bill),
    annualKwh: data.annualKwh ?? null,
    annualTherms: data.annualTherms ?? null,
    currentSupplierKnown: booleanValue(intake.current_supplier_known) ?? undefined,
    currentSupplierName: stringValue(intake.current_supplier_name),
    heatingType: stringValue(intake.heating_type) ?? data.primaryHeatingFuel,
    coolingType: stringValue(intake.cooling_type),
    waterHeaterType: stringValue(intake.water_heater_type),
    waterHeaterAge: numberValue(intake.water_heater_age),
    hvacAge: data.hvacAge ?? null,
    hasSmartThermostat: booleanValue(intake.has_smart_thermostat) ?? undefined,
    insulationConcerns: stringValue(intake.insulation_concerns),
    windowCondition: stringValue(intake.window_condition),
    roofAge: data.roofAge ?? null,
    goals: stringArrayValue(intake.goals) as ResidentialIntakeSnapshot["goals"],
    householdSize: numberValue(intake.household_size),
    incomeRange: stringValue(intake.income_range),
    assistancePrograms: stringArrayValue(intake.assistance_programs),
    submittedAt: stringValue(intake.submitted_at) ?? now,
  };

  try {
    const electricUtilityName = data.electricUtilityId
      ? UTILITY_BY_ID.get(data.electricUtilityId)?.name
      : null;
    const gasUtilityName = data.gasUtilityId
      ? UTILITY_BY_ID.get(data.gasUtilityId)?.name
      : null;

    await client.from("home_profiles" as never).insert({
      id: homeProfileId,
      assessment_id: assessmentId,
      profile_id: profileId,
      address: snapshot.address,
      city: snapshot.city,
      state: snapshot.state,
      county: snapshot.county,
      zip: data.zip,
      home_type: snapshot.homeType,
      ownership: snapshot.ownershipStatus,
      year_built: data.yearBuilt,
      square_feet: data.squareFootage,
      occupants: snapshot.occupants ?? null,
      created_at: now,
      updated_at: now,
    } as never);

    const utilityRows = [
      data.electricUtilityId && {
        id: crypto.randomUUID(),
        home_profile_id: homeProfileId,
        utility_type: "electric",
        utility_id: data.electricUtilityId,
        utility_name: electricUtilityName,
        current_supplier: snapshot.currentSupplierName,
        created_at: now,
        updated_at: now,
      },
      data.gasUtilityId && {
        id: crypto.randomUUID(),
        home_profile_id: homeProfileId,
        utility_type: "gas",
        utility_id: data.gasUtilityId,
        utility_name: gasUtilityName,
        current_supplier: null,
        created_at: now,
        updated_at: now,
      },
    ].filter(Boolean);

    if (utilityRows.length > 0) {
      await client.from("utility_accounts" as never).insert(utilityRows as never);
    }

    const electricAccount = utilityRows[0] as { id?: string } | undefined;
    if (electricAccount?.id && (data.annualKwh || snapshot.averageMonthlyBill)) {
      await client.from("utility_bills" as never).insert({
        id: crypto.randomUUID(),
        utility_account_id: electricAccount.id,
        kwh: data.annualKwh ?? null,
        therms: data.annualTherms ?? null,
        cost_usd: snapshot.averageMonthlyBill ? snapshot.averageMonthlyBill * 12 : null,
        parsed_json: {
          source: "intake",
          average_monthly_bill: snapshot.averageMonthlyBill,
        },
        created_at: now,
      } as never);
    }

    const equipmentRows = [
      {
        id: crypto.randomUUID(),
        home_profile_id: homeProfileId,
        equipment_type: "heating",
        fuel_type: snapshot.heatingType,
        age_years: data.hvacAge ?? null,
        condition: null,
        metadata: { hvac_type: data.currentHvacType, cooling_type: snapshot.coolingType },
        created_at: now,
        updated_at: now,
      },
      snapshot.waterHeaterType && {
        id: crypto.randomUUID(),
        home_profile_id: homeProfileId,
        equipment_type: "water_heater",
        fuel_type: snapshot.waterHeaterType,
        age_years: snapshot.waterHeaterAge,
        condition: null,
        metadata: {},
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        home_profile_id: homeProfileId,
        equipment_type: "thermostat",
        fuel_type: null,
        age_years: null,
        condition: snapshot.hasSmartThermostat ? "smart_thermostat_present" : "not_present",
        metadata: { has_smart_thermostat: snapshot.hasSmartThermostat ?? false },
        created_at: now,
        updated_at: now,
      },
    ].filter(Boolean);
    await client.from("existing_equipment" as never).insert(equipmentRows as never);

    if (snapshot.goals.length > 0) {
      await client.from("goal_selections" as never).insert(
        snapshot.goals.map((goal, index) => ({
          id: crypto.randomUUID(),
          home_profile_id: homeProfileId,
          goal,
          priority: index + 1,
          created_at: now,
        })) as never,
      );
    }

    await client.from("eligibility_profiles" as never).insert({
      id: crypto.randomUUID(),
      home_profile_id: homeProfileId,
      household_size: snapshot.householdSize,
      income_range: snapshot.incomeRange,
      assistance_programs: snapshot.assistancePrograms ?? [],
      created_at: now,
      updated_at: now,
    } as never);

    const plan = buildResidentialEnergyPlan(snapshot);
    await client.from("upgrade_recommendations" as never).insert(
      plan.recommendations.map((recommendation) => ({
        id: crypto.randomUUID(),
        home_profile_id: homeProfileId,
        upgrade_type: recommendation.upgradeType,
        project_cost_range: recommendation.projectCostRange,
        eligible_rebates: recommendation.eligibleRebates,
        net_cost_range: recommendation.estimatedNetCostRange,
        annual_savings_range: recommendation.estimatedAnnualSavingsRange,
        payback_range: recommendation.paybackRange,
        confidence_score: plan.confidenceScore,
        paperwork_status: recommendation.paperworkStatus,
        why_recommended: recommendation.whyRecommended,
        created_at: now,
        updated_at: now,
      })) as never,
    );

    await client.from("supplier_comparisons" as never).insert({
      id: crypto.randomUUID(),
      home_profile_id: homeProfileId,
      utility: electricUtilityName,
      current_supplier: snapshot.currentSupplierName,
      current_rate: null,
      annual_kwh: plan.estimatedAnnualUsage.kwh,
      desired_plan_type: snapshot.goals.includes("compare_energy_supplier")
        ? "fixed_rate_only"
        : null,
      risk_tolerance: "low",
      results_json: plan.supplierComparison.slice(0, 5),
      created_at: now,
    } as never);
  } catch (error) {
    console.warn("[assessments] residential marketplace persistence skipped:", error);
  }
}

// POST /api/assessments — save a homeowner intake assessment
export async function POST(request: NextRequest) {
  // ─── Rate limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(ip, RATE_LIMITS.standard);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    // ─── Parse + validate ─────────────────────────────────────────────────────
    const body = await request.json();
    const data = AssessmentSchema.parse(body);

    // ─── Get optional auth ────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profileId: string | null = null;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      const profile = (data ?? null) as Pick<ProfileRow, "id"> | null;
      profileId = profile?.id ?? null;
    }

    // ─── Run calculations ─────────────────────────────────────────────────────
    const amiBracket = data.householdIncome
      ? determineAMIBracket(data.householdIncome)
      : (data.amiBracket ?? "unknown");

    const profileInput = {
      ...data,
      amiBracket: amiBracket as any,
      primaryHeatingFuel: data.primaryHeatingFuel as any,
      currentHvacType: data.currentHvacType as any,
    };
    const savings = calcPersonalizedSavings(profileInput as any);

    // ─── Insert to DB ─────────────────────────────────────────────────────────
    const resolvedZip = resolveZip(data.zip);
    const now = new Date().toISOString();
    const insertPayload: AssessmentInsert = {
      id: crypto.randomUUID(),
      profile_id: profileId,
      zip: data.zip,
      // Resolve location at write time so reads stay fast and don't need
      // to re-run zip-lookup on every dashboard render.
      state: resolvedZip?.state ?? null,
      county_id: resolvedZip?.countyId ?? null,
      electric_utility_id: data.electricUtilityId ?? null,
      gas_utility_id: data.gasUtilityId ?? null,
      square_footage: data.squareFootage,
      year_built: data.yearBuilt,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms ?? null,
      primary_heating_fuel: data.primaryHeatingFuel,
      current_hvac_type: data.currentHvacType,
      hvac_age: data.hvacAge ?? null,
      has_gas: data.hasGas,
      electric_panel_amps: data.electricPanelAmps ?? null,
      roof_orientation: data.roofOrientation ?? null,
      roof_age: data.roofAge ?? null,
      annual_kwh: data.annualKwh ?? null,
      annual_therms: data.annualTherms ?? null,
      household_income: data.householdIncome ?? null,
      ami_bracket: amiBracket,
      has_existing_solar: data.hasExistingSolar,
      has_ev: data.hasEv,
      urgency: data.urgency ?? null,
      notes: data.notes ?? null,
      photo_urls: data.photoUrls ?? [],
      utility_bill_urls: data.utilityBillUrls ?? [],
      // Phase-2 intake — full blob in JSONB. Promote individual fields to
      // their own columns when we actually need to query/index them.
      intake_v2: data.intake_v2 ?? null,
      // Supabase SQL migrations do not define DB-side defaults for these text
      // IDs/timestamps, so route handlers must provide them explicitly.
      created_at: now,
      updated_at: now,
      // Calculated outputs
      calc_annual_energy_cost: savings.currentAnnualCost,
      calc_savings_potential:
        savings.ledSavings.annualDollarsSaved +
        savings.solarSavings.totalAnnualValue +
        savings.hpwhSavings.annualSavings,
      calc_available_rebates: savings.estimatedRebatesAvailable,
    };

    const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : supabase;

    let insertResult = await writeClient
      .from("home_assessments")
      .insert(insertPayload)
      .select()
      .single();

    if (insertResult.error && isMissingIntakeV2Column(insertResult.error)) {
      const { intake_v2: _intakeV2, ...legacyPayload } = insertPayload;
      insertResult = await writeClient
        .from("home_assessments")
        .insert(legacyPayload)
        .select()
        .single();
    }

    const { data: assessment, error } = insertResult;

    if (error) {
      console.error("Assessment insert error:", error);
      return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
    }

    await persistResidentialMarketplaceModels({
      client: writeClient,
      assessmentId: assessment.id,
      profileId,
      data,
      resolvedZip,
    });

    return NextResponse.json(
      {
        id: assessment.id,
        snapshot: snapshotFromAssessmentRow(assessment as Record<string, unknown>),
        savings: {
          currentAnnualCost: savings.currentAnnualCost,
          estimatedRebatesAvailable: savings.estimatedRebatesAvailable,
          ledSavings: savings.ledSavings,
          solarSavings: savings.solarSavings,
          hpwhSavings: savings.hpwhSavings,
          heatPumpSavings: savings.heatPumpSavings,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Assessment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/assessments — list authenticated user's assessments
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = (data ?? null) as Pick<ProfileRow, "id"> | null;

  if (!profile) {
    return NextResponse.json({ assessments: [] });
  }

  const { data: assessments, error } = await supabase
    .from("home_assessments")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch assessments" }, { status: 500 });
  }

  return NextResponse.json({ assessments });
}
