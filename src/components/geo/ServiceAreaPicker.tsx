"use client";

import { useMemo } from "react";
import {
  COUNTIES,
  METROS,
  STATES,
  activeStates,
} from "@/lib/geo/registry";
import type { ServiceArea } from "@/lib/geo/types";

interface Props {
  value: ServiceArea | null;
  onChange: (next: ServiceArea) => void;
}

const KIND_OPTIONS: Array<{ kind: ServiceArea["kind"]; label: string; help: string }> = [
  {
    kind: "state",
    label: "Entire state",
    help: "You operate state-wide.",
  },
  {
    kind: "counties",
    label: "Specific counties",
    help: "Pick the counties you serve. Use this when service is regional.",
  },
  {
    kind: "metro",
    label: "Metro region",
    help: "Pre-defined regions like the DMV or Baltimore Metro.",
  },
];

/**
 * Discriminated picker that mirrors the ServiceArea union. Designed for the
 * contractor apply form. Pure controlled — parent owns state.
 */
export function ServiceAreaPicker({ value, onChange }: Props) {
  const states = activeStates();

  // Default the picker to "counties + MD" if no value yet.
  const current: ServiceArea =
    value ?? { kind: "counties", countyIds: [] };

  type CountyRow = (typeof COUNTIES)[number];
  const countiesByState = useMemo(() => {
    const grouped = new Map<string, CountyRow[]>();
    for (const c of COUNTIES) {
      const arr = grouped.get(c.state) ?? [];
      arr.push(c);
      grouped.set(c.state, arr);
    }
    return grouped;
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {KIND_OPTIONS.map((opt) => (
          <button
            key={opt.kind}
            type="button"
            onClick={() => {
              if (opt.kind === "state") {
                onChange({ kind: "state", stateCode: states[0]?.code ?? "MD" });
              } else if (opt.kind === "counties") {
                onChange({ kind: "counties", countyIds: [] });
              } else {
                onChange({ kind: "metro", regionId: METROS[0]?.id ?? "dmv" });
              }
            }}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              current.kind === opt.kind
                ? "border-brand-500 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{opt.help}</div>
          </button>
        ))}
      </div>

      {/* State-wide */}
      {current.kind === "state" && (
        <label className="block">
          <span className="block text-xs font-semibold text-gray-700 mb-1">State</span>
          <select
            value={current.stateCode}
            onChange={(e) =>
              onChange({ kind: "state", stateCode: e.target.value })
            }
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATES.map((s) => (
              <option key={s.code} value={s.code} disabled={!s.active}>
                {s.name} {s.active ? "" : "(coming soon)"}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* Counties */}
      {current.kind === "counties" && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Counties served ({current.countyIds.length} selected)
          </p>
          <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
            {Array.from(countiesByState.entries()).map(([stateCode, counties]) => (
              <div key={stateCode}>
                <div className="px-3 py-1.5 bg-gray-50 text-xs font-semibold text-gray-600">
                  {STATES.find((s) => s.code === stateCode)?.name ?? stateCode}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 p-2">
                  {counties.map((c) => {
                    const checked = current.countyIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? current.countyIds.filter((id) => id !== c.id)
                              : [...current.countyIds, c.id];
                            onChange({ kind: "counties", countyIds: next });
                          }}
                        />
                        <span>{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metro */}
      {current.kind === "metro" && (
        <label className="block">
          <span className="block text-xs font-semibold text-gray-700 mb-1">Metro region</span>
          <select
            value={current.regionId}
            onChange={(e) =>
              onChange({ kind: "metro", regionId: e.target.value })
            }
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {METROS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
