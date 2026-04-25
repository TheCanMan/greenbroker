"use client";

import { useMemo } from "react";
import {
  electricUtilitiesForCounty,
  gasUtilitiesForCounty,
} from "@/lib/geo/registry";
import type { CountyId } from "@/lib/geo/types";

interface Props {
  countyId: CountyId | null;
  electricUtilityId?: string;
  gasUtilityId?: string;
  onChange: (next: { electricUtilityId?: string; gasUtilityId?: string }) => void;
}

/**
 * Two side-by-side dropdowns (electric + gas) populated from the resolved
 * county. If the county has only one option, it auto-selects on render.
 */
export function UtilityPicker({
  countyId,
  electricUtilityId,
  gasUtilityId,
  onChange,
}: Props) {
  const electric = useMemo(
    () => (countyId ? electricUtilitiesForCounty(countyId) : []),
    [countyId]
  );
  const gas = useMemo(
    () => (countyId ? gasUtilitiesForCounty(countyId) : []),
    [countyId]
  );

  if (!countyId) {
    return (
      <p className="text-xs text-gray-400 italic">
        Enter a ZIP above to see your utility options.
      </p>
    );
  }

  if (electric.length === 0 && gas.length === 0) {
    return (
      <p className="text-xs text-amber-600">
        We don&apos;t have utility data for this county yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="block">
        <span className="block text-xs font-semibold text-gray-700 mb-1">
          Electric utility
        </span>
        <select
          value={electricUtilityId ?? ""}
          onChange={(e) =>
            onChange({
              electricUtilityId: e.target.value || undefined,
              gasUtilityId,
            })
          }
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Select…</option>
          {electric.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs font-semibold text-gray-700 mb-1">
          Gas utility (optional)
        </span>
        <select
          value={gasUtilityId ?? ""}
          onChange={(e) =>
            onChange({
              electricUtilityId,
              gasUtilityId: e.target.value || undefined,
            })
          }
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">None / all-electric</option>
          {gas.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
