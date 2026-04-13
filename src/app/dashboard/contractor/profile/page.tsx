import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { ContractorProfileEditor } from "./editor";

export default async function ContractorProfilePage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/auth/login");
  if (profile.role !== "CONTRACTOR") redirect("/dashboard");

  const { data: contractor } = await supabase
    .from("contractors")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!contractor) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Complete Your Application
          </h1>
          <p className="text-gray-600 mb-6">
            You haven't submitted a contractor application yet. Complete your
            application to set up your profile.
          </p>
          <a
            href="/contractors/apply"
            className="btn-primary inline-block py-3 px-6"
          >
            Start Application
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Contractor Profile</h1>
        <p className="section-subtitle">
          Update your business details, service area, and credentials.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <StatusBadge status={contractor.status} />
        <TierBadge tier={contractor.tier} />
      </div>

      <ContractorProfileEditor
        initial={{
          businessName: contractor.business_name,
          categories: contractor.categories || [],
          serviceZips: contractor.service_zips || [],
          bio: contractor.bio || "",
          website: contractor.website || "",
          phone: profile.phone || "",
          mhicLicense: contractor.mhic_license || "",
          hvacLicense: contractor.hvac_license || "",
          electricalLicense: contractor.electrical_license || "",
          plumbingLicense: contractor.plumbing_license || "",
          wsscLicense: contractor.wssc_license || "",
          certifications: contractor.certifications || [],
          meaParticipating: contractor.mea_participating,
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_REVIEW: { bg: "bg-amber-100", text: "text-amber-800", label: "Pending Review" },
    ACTIVE: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
    SUSPENDED: { bg: "bg-red-100", text: "text-red-800", label: "Suspended" },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  };
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    VERIFIED: "bg-blue-100 text-blue-800",
    PREFERRED: "bg-purple-100 text-purple-800",
    ELITE: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[tier] || "bg-gray-100"}`}>
      {tier}
    </span>
  );
}
