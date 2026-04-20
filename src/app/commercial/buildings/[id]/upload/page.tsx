import Link from "next/link";
import { notFound } from "next/navigation";
import type { Building } from "@/lib/commercial/types";
import { fetchEntropyJson } from "@/lib/commercial/utils";
import { Tier1UploadForm } from "@/components/commercial/Tier1UploadForm";

export const dynamic = "force-dynamic";

export default async function CommercialTier1UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let building: Building;
  try {
    building = await fetchEntropyJson<Building>(`/buildings/${id}`);
  } catch {
    return notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <div>
        <Link
          href={`/commercial/buildings/${id}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to {building.name}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          Upload BMS trend data
        </h1>
        <p className="mt-2 text-gray-600">
          Export trend logs from your building management system as CSV and
          drop them below. We&apos;ll auto-classify each point, resample to
          15-minute intervals, and re-run all FDD rules.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">CSV format</div>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
          <li>One column named <code>timestamp</code> (ISO 8601 or common BMS format)</li>
          <li>One column per BMS point — any name works, we classify them</li>
          <li>
            Minimum useful set: fan status + zone temp OR supply-air temp.
            Outside-air temp is auto-fetched if missing.
          </li>
        </ul>
      </div>

      <Tier1UploadForm buildingId={id} />
    </main>
  );
}
