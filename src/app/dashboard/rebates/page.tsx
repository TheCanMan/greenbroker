import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { findRebatesFor } from "@/lib/geo/eligibility";
import { REBATES } from "@/lib/data/rebates";
import { formatCurrency } from "@/lib/calculations/savings";
import type { CountyId, StateCode } from "@/lib/geo/types";

interface ApplicationRow {
  id: string;
  program_id: string;
  status: "DRAFT" | "SUBMITTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  submitted_at: string | null;
  approved_at: string | null;
  amount: number | null;
  notes: string | null;
}

const STATUS_STYLES: Record<ApplicationRow["status"] | "NOT_STARTED", string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600 border-gray-200",
  DRAFT: "bg-amber-50 text-amber-800 border-amber-200",
  SUBMITTED: "bg-blue-50 text-blue-800 border-blue-200",
  PENDING_REVIEW: "bg-blue-50 text-blue-800 border-blue-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
  WITHDRAWN: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABEL: Record<ApplicationRow["status"] | "NOT_STARTED", string> = {
  NOT_STARTED: "Not started",
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export default async function MyRebatesPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  // 1. Most recent assessment (we use it to resolve location).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: assessment } = profile
    ? await supabase
        .from("home_assessments")
        .select("zip, ami_bracket")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  // 2. Existing applications for this profile. The rebate_applications table
  //    may not yet exist in the DB (pre-migration) — degrade gracefully to
  //    "Not started" status across the board.
  let applications: ApplicationRow[] = [];
  if (profile) {
    const result = await (
      supabase.from("rebate_applications" as never) as ReturnType<
        typeof supabase.from
      >
    )
      .select("id, program_id, status, submitted_at, approved_at, amount, notes")
      .eq("profile_id", profile.id);
    if (!result.error && result.data) {
      applications = result.data as unknown as ApplicationRow[];
    }
  }
  const appsByProgram = new Map(applications.map((a) => [a.program_id, a]));

  // 3. Resolve user location & filter rebates.
  const resolved = assessment?.zip ? resolveZip(assessment.zip) : null;
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;

  let eligibleRebates: typeof REBATES = [];
  if (resolved && assessment) {
    eligibleRebates = findRebatesFor(REBATES, {
      state: resolved.state as StateCode,
      countyId: resolved.countyId as CountyId,
      zip: assessment.zip,
      // Utility selection isn't yet persisted on the assessment row — this
      // path will tighten once electric_utility_id / gas_utility_id columns
      // land in home_assessments. For now we get state + county scoping.
    });
  }

  // 4. Aggregate dollars.
  const approvedTotal = applications
    .filter((a) => a.status === "APPROVED" && a.amount)
    .reduce((sum, a) => sum + (a.amount ?? 0), 0);
  const inFlight = applications.filter((a) =>
    ["DRAFT", "SUBMITTED", "PENDING_REVIEW"].includes(a.status)
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">My Rebates</h1>
          <p className="section-subtitle">
            {county && resolved
              ? `${county.name}, ${resolved.state} · ${eligibleRebates.length} programs you qualify for`
              : "Save a home assessment to see programs you qualify for."}
          </p>
        </div>
        {!resolved && (
          <Link href="/intake" className="btn-primary text-sm">
            Start an assessment →
          </Link>
        )}
      </div>

      {/* Stat cards */}
      {resolved && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              Eligible programs
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {eligibleRebates.length}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              In flight
            </div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{inFlight}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              Approved $
            </div>
            <div className="text-3xl font-bold text-emerald-700 mt-1">
              {formatCurrency(approvedTotal)}
            </div>
          </div>
        </div>
      )}

      {/* Eligible programs */}
      {resolved && eligibleRebates.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Programs you qualify for</h2>
          {eligibleRebates.map((r) => {
            const app = appsByProgram.get(r.id);
            const status = app?.status ?? "NOT_STARTED";
            return (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{r.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                      {r.incomeQualified && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Income-qualified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {r.administrator}
                    </div>
                    {app?.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Note: {app.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-brand-700">
                      {r.type === "srec"
                        ? "Ongoing"
                        : `Up to ${formatCurrency(r.maxAmount)}`}
                    </div>
                    {app?.amount && (
                      <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                        {formatCurrency(app.amount)} approved
                      </div>
                    )}
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-brand-600 hover:text-brand-700 text-xs font-medium underline"
                    >
                      Apply →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolved && eligibleRebates.length === 0 && (
        <div className="card p-8 text-center text-sm text-gray-600">
          No active rebates match your location yet. We&apos;re actively
          expanding coverage — check back soon.
        </div>
      )}

      {!resolved && (
        <div className="card p-8 text-center text-sm text-gray-600">
          <p className="mb-4">
            We need your address to show the rebates you qualify for.
          </p>
          <Link href="/intake" className="btn-primary inline-block">
            Start an assessment
          </Link>
        </div>
      )}
    </div>
  );
}
