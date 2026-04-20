"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminTagQueueItem = {
  point_id: string;
  building_id: string;
  building_name: string;
  equipment_name: string;
  raw_name: string;
  normalized_name: string;
  point_kind: string;
  unit: string;
  confidence_score: number;
};

const VOCAB = [
  "supply_air_temp", "return_air_temp", "mixed_air_temp", "outside_air_temp",
  "zone_temp", "supply_air_pressure", "filter_dp", "co2", "kw", "kwh",
  "zone_cooling_sp", "zone_heating_sp", "sat_sp", "sap_sp",
  "cooling_valve_cmd", "heating_valve_cmd", "oa_damper_cmd", "vfd_speed_cmd",
  "fan_status", "occupancy_status", "unknown",
] as const;

const KINDS = ["sensor", "setpoint", "cmd", "status"] as const;

export function TagQueueClient() {
  const [items, setItems] = useState<AdminTagQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/admin/tag-queue", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      setItems((await res.json()) as AdminTagQueueItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitReview(item: AdminTagQueueItem, patch: Partial<AdminTagQueueItem>) {
    try {
      const res = await fetch(
        `/api/commercial/admin/tag-queue/${encodeURIComponent(item.point_id)}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            normalized_name: patch.normalized_name ?? item.normalized_name,
            point_kind: patch.point_kind ?? item.point_kind,
            unit: patch.unit ?? item.unit,
          }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      setItems((prev) => prev.filter((p) => p.point_id !== item.point_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "review failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <button
          onClick={() => refresh()}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <span>{items.length} item{items.length === 1 ? "" : "s"} pending</span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {items.length === 0 && !loading && !error && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          Queue is empty — nothing awaiting review.
        </p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Building / Equipment</th>
                <th className="px-3 py-2 text-left">Raw name</th>
                <th className="px-3 py-2 text-left">Normalized</th>
                <th className="px-3 py-2 text-left">Kind</th>
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-right">Conf.</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <QueueRow key={item.point_id} item={item} onSave={submitReview} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function QueueRow({
  item,
  onSave,
}: {
  item: AdminTagQueueItem;
  onSave: (item: AdminTagQueueItem, patch: Partial<AdminTagQueueItem>) => Promise<void>;
}) {
  const [normalized, setNormalized] = useState(item.normalized_name);
  const [kind, setKind] = useState(item.point_kind);
  const [unit, setUnit] = useState(item.unit);
  const [saving, setSaving] = useState(false);

  return (
    <tr className="align-top">
      <td className="px-3 py-2">
        <div className="font-medium text-slate-900">{item.building_name}</div>
        <div className="text-xs text-slate-500">{item.equipment_name}</div>
      </td>
      <td className="px-3 py-2 font-mono text-xs">{item.raw_name}</td>
      <td className="px-3 py-2">
        <select
          value={normalized}
          onChange={(e) => setNormalized(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {VOCAB.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-3 py-2 text-right text-xs text-slate-500">
        {item.confidence_score.toFixed(2)}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={async () => {
            setSaving(true);
            await onSave(item, { normalized_name: normalized, point_kind: kind, unit });
            setSaving(false);
          }}
          disabled={saving}
          className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "…" : "Confirm"}
        </button>
      </td>
    </tr>
  );
}
