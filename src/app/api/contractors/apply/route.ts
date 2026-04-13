import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ContractorApplicationSchema } from "@/lib/validations/contractor";

// POST /api/contractors/apply — submit a contractor application
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has a profile with CONTRACTOR role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete signup first." },
        { status: 400 }
      );
    }

    if (profile.role !== "CONTRACTOR") {
      return NextResponse.json(
        { error: "Only contractor accounts can submit applications." },
        { status: 403 }
      );
    }

    // Check if contractor record already exists
    const { data: existing } = await supabase
      .from("contractors")
      .select("id, status")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "You already have a contractor application on file.",
          status: existing.status,
        },
        { status: 409 }
      );
    }

    // Parse and validate
    const body = await request.json();
    const data = ContractorApplicationSchema.parse(body);

    // Insert contractor record
    const { data: contractor, error } = await supabase
      .from("contractors")
      .insert({
        profile_id: profile.id,
        business_name: data.businessName,
        categories: data.categories,
        service_zips: data.serviceZips,
        bio: data.bio || null,
        website: data.website || null,
        mhic_license: data.mhicLicense || null,
        hvac_license: data.hvacLicense || null,
        electrical_license: data.electricalLicense || null,
        plumbing_license: data.plumbingLicense || null,
        wssc_license: data.wsscLicense || null,
        certifications: data.certifications,
        mea_participating: data.meaParticipating,
        status: "PENDING_REVIEW",
        tier: "VERIFIED",
      })
      .select()
      .single();

    if (error) {
      console.error("Contractor insert error:", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    // Update profile phone if provided
    if (data.phone) {
      await supabase
        .from("profiles")
        .update({ phone: data.phone })
        .eq("id", profile.id);
    }

    return NextResponse.json(
      { id: contractor.id, status: contractor.status },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Contractor application error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
