import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { AssessmentSchema } from "@/lib/validations/assessment";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/ratelimit";
import { calcPersonalizedSavings, determineAMIBracket } from "@/lib/calculations/savings";
import { resolveZip } from "@/lib/geo/zip-lookup";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

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
    const { data: assessment, error } = await supabase
      .from("home_assessments")
      .insert({
        profile_id: profileId,
        zip: data.zip,
        // Resolve location at write time so reads stay fast and don't need
        // to re-run zip-lookup on every dashboard render.
        state: resolveZip(data.zip)?.state ?? null,
        county_id: resolveZip(data.zip)?.countyId ?? null,
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
        // Calculated outputs
        calc_annual_energy_cost: savings.currentAnnualCost,
        calc_savings_potential:
          savings.ledSavings.annualDollarsSaved +
          savings.solarSavings.totalAnnualValue +
          savings.hpwhSavings.annualSavings,
        calc_available_rebates: savings.estimatedRebatesAvailable,
      })
      .select()
      .single();

    if (error) {
      console.error("Assessment insert error:", error);
      return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
    }

    return NextResponse.json(
      {
        id: assessment.id,
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
