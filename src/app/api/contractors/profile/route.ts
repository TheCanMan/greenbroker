import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ContractorUpdateSchema } from "@/lib/validations/contractor";

// GET /api/contractors/profile — get the current contractor's profile
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "CONTRACTOR") {
    return NextResponse.json({ error: "Not a contractor" }, { status: 403 });
  }

  const { data: contractor } = await supabase
    .from("contractors")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!contractor) {
    return NextResponse.json({ error: "No contractor record found" }, { status: 404 });
  }

  return NextResponse.json({ contractor });
}

// PUT /api/contractors/profile — update the current contractor's profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "CONTRACTOR") {
      return NextResponse.json({ error: "Not a contractor" }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from("contractors")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "No contractor record found. Please apply first." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = ContractorUpdateSchema.parse(body);

    const updatePayload: Record<string, any> = {};
    if (data.businessName !== undefined) updatePayload.business_name = data.businessName;
    if (data.categories !== undefined) updatePayload.categories = data.categories;
    if (data.serviceZips !== undefined) updatePayload.service_zips = data.serviceZips;
    if (data.bio !== undefined) updatePayload.bio = data.bio || null;
    if (data.website !== undefined) updatePayload.website = data.website || null;
    if (data.mhicLicense !== undefined) updatePayload.mhic_license = data.mhicLicense || null;
    if (data.hvacLicense !== undefined) updatePayload.hvac_license = data.hvacLicense || null;
    if (data.electricalLicense !== undefined) updatePayload.electrical_license = data.electricalLicense || null;
    if (data.plumbingLicense !== undefined) updatePayload.plumbing_license = data.plumbingLicense || null;
    if (data.wsscLicense !== undefined) updatePayload.wssc_license = data.wsscLicense || null;
    if (data.certifications !== undefined) updatePayload.certifications = data.certifications;
    if (data.meaParticipating !== undefined) updatePayload.mea_participating = data.meaParticipating;

    const { data: contractor, error } = await supabase
      .from("contractors")
      .update(updatePayload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("Contractor update error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Update phone if provided
    if (data.phone) {
      await supabase.from("profiles").update({ phone: data.phone }).eq("id", profile.id);
    }

    return NextResponse.json({ contractor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Contractor profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
