import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const writeClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : userClient;

  let { data: profile, error: profileError } = await writeClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[assessment claim] profile lookup failed:", profileError);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  if (!profile) {
    const metadata = isObject(user.user_metadata) ? user.user_metadata : {};
    const { data: createdProfile, error: createError } = await writeClient
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        email: user.email ?? "",
        role: "HOMEOWNER",
        first_name: stringValue(metadata.first_name),
        last_name: stringValue(metadata.last_name),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      console.error("[assessment claim] profile create failed:", createError);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    profile = createdProfile;
  }

  const profileId = (profile as { id: string }).id;
  const { data: assessment, error: assessmentError } = await writeClient
    .from("home_assessments")
    .select("id, profile_id")
    .eq("id", id)
    .maybeSingle();

  if (assessmentError) {
    console.error("[assessment claim] assessment lookup failed:", assessmentError);
    return NextResponse.json({ error: "Failed to load assessment" }, { status: 500 });
  }

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const currentOwner = (assessment as { profile_id?: string | null }).profile_id;
  if (currentOwner && currentOwner !== profileId) {
    return NextResponse.json({ error: "Assessment already belongs to another account" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await writeClient
    .from("home_assessments")
    .update({ profile_id: profileId, updated_at: now })
    .eq("id", id);

  if (updateError) {
    console.error("[assessment claim] assessment update failed:", updateError);
    return NextResponse.json({ error: "Failed to save assessment" }, { status: 500 });
  }

  await writeClient
    .from("home_profiles" as never)
    .update({ profile_id: profileId, updated_at: now } as never)
    .eq("assessment_id" as never, id as never);

  return NextResponse.json({ saved: true, assessmentId: id });
}
