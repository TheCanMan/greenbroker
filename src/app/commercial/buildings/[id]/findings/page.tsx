import Link from "next/link";
import { notFound } from "next/navigation";
import type { DashboardPayload } from "@/lib/commercial/types";
import { fetchEntropyJson } from "@/lib/commercial/utils";
import { FindingsList } from "@/components/commercial/dashboard/FindingsList";

export const dynamic = "force-dynamic";

export default async function CommercialAllFindingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: DashboardPayload;
  try {
    data = await fetchEntropyJson<DashboardPayload>(`/buildings/${id}/dashboard`);
  } catch {
    return notFound();
  }
  const { building, all_findings, rebates_by_id } = data;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div>
        <Link
          href={`/commercial/buildings/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {building.name}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          All findings — {building.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Every rule hit across the current analysis window, ranked by estimated
          savings × confidence.
        </p>
      </div>

      <FindingsList
        findings={all_findings}
        rebatesById={rebates_by_id}
        heading={`${all_findings.length} finding${all_findings.length === 1 ? "" : "s"}`}
      />
    </main>
  );
}
