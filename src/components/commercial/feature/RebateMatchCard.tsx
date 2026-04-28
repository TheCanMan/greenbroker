import type { CommercialIncentive } from "@/lib/commercial/feature-types";

export function RebateMatchCard({ incentive }: { incentive: CommercialIncentive }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {incentive.provider} - {incentive.region}
          </div>
          <h3 className="mt-1 font-bold text-slate-950">{incentive.programName}</h3>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-blue-700">
          {incentive.incentiveType.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-700">{incentive.notes}</p>
      <div className="mt-3 text-xs font-semibold text-slate-500">Required docs</div>
      <ul className="mt-1 space-y-1 text-sm text-slate-700">
        {incentive.requiredDocs.slice(0, 4).map((doc) => (
          <li key={doc}>- {doc}</li>
        ))}
      </ul>
      <div className="mt-3 text-sm font-semibold text-blue-800">
        {incentive.estimatedRange ?? "Range pending verification"}
      </div>
    </div>
  );
}
