"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UploadResult = {
  building_id: string;
  files_ingested: number;
  points_created: number;
  points_updated: number;
  telemetry_rows: number;
  status_event_rows: number;
  unknown_points: string[];
  llm_cap_hit: boolean;
  rules_fired: string[];
  findings: number;
  grade: string;
};

export function Tier1UploadForm({ buildingId }: { buildingId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const form = new FormData();
    for (const f of files) form.append("files", f);
    try {
      const res = await fetch(`/api/commercial/buildings/${buildingId}/tier1-upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body.slice(0, 300));
      }
      setResult((await res.json()) as UploadResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Trend CSVs</span>
        <input
          type="file"
          multiple
          accept=".csv,text/csv"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-2 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
        />
      </label>

      {files.length > 0 && (
        <ul className="text-xs text-slate-500 list-disc pl-5">
          {files.map((f) => (
            <li key={f.name}>
              {f.name} — {(f.size / 1024).toFixed(0)} KB
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={!files.length || busy}
        className="btn-primary text-sm disabled:opacity-50"
      >
        {busy ? "Ingesting…" : "Upload and analyze"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 space-y-2">
          <div className="font-semibold">
            Ingested {result.files_ingested} file
            {result.files_ingested === 1 ? "" : "s"} — grade {result.grade}, {result.findings} findings.
          </div>
          <div className="text-emerald-800">
            Points created: {result.points_created} · updated: {result.points_updated} ·
            telemetry rows: {result.telemetry_rows.toLocaleString()} ·
            raw status events: {result.status_event_rows.toLocaleString()}
          </div>
          <div className="text-emerald-800">
            Rules fired: {result.rules_fired.join(", ") || "none"}
          </div>
          {result.llm_cap_hit && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
              Daily LLM token budget reached — remaining columns were
              classified with the regex fallback. Accuracy may be lower;
              re-upload tomorrow for full classification.
            </div>
          )}
          {result.unknown_points.length > 0 && (
            <details className="text-emerald-800">
              <summary className="cursor-pointer">
                {result.unknown_points.length} point
                {result.unknown_points.length === 1 ? "" : "s"} needed manual review
              </summary>
              <ul className="mt-2 list-disc pl-5 font-mono text-xs">
                {result.unknown_points.slice(0, 50).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </details>
          )}
          <button
            type="button"
            onClick={() => router.push(`/commercial/buildings/${buildingId}`)}
            className="mt-2 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            View dashboard →
          </button>
        </div>
      )}
    </form>
  );
}
