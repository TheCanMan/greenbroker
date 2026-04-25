"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { UtilityPicker } from "./UtilityPicker";

/**
 * Sticky header used on /rebates. Captures (zip, electricUtilityId, gasUtilityId)
 * and pushes them into the URL search params so the server component can
 * filter rebates accordingly. Pure URL-driven state — no client cache.
 */
export function LocationPicker() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const initialZip = params.get("zip") ?? "";
  const initialElectric = params.get("electric") ?? "";
  const initialGas = params.get("gas") ?? "";

  const [zip, setZip] = useState(initialZip);
  const [electricUtilityId, setElectricUtilityId] = useState(initialElectric);
  const [gasUtilityId, setGasUtilityId] = useState(initialGas);

  const resolved = zip.length === 5 ? resolveZip(zip) : null;
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;

  // Reset utility selections when ZIP changes to a different county.
  useEffect(() => {
    if (!resolved) return;
    // We don't auto-clear — user can pre-select utilities while typing the
    // last digit. The server filter ignores unknown utility IDs gracefully.
  }, [resolved?.countyId]); // eslint-disable-line react-hooks/exhaustive-deps

  function commit(next: {
    zip?: string;
    electricUtilityId?: string;
    gasUtilityId?: string;
  }) {
    const sp = new URLSearchParams(params.toString());
    const z = next.zip ?? zip;
    const e = next.electricUtilityId ?? electricUtilityId;
    const g = next.gasUtilityId ?? gasUtilityId;
    if (z) sp.set("zip", z);
    else sp.delete("zip");
    if (e) sp.set("electric", e);
    else sp.delete("electric");
    if (g) sp.set("gas", g);
    else sp.delete("gas");
    startTransition(() => {
      router.replace(`?${sp.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="card p-5 mb-8 bg-gradient-to-br from-brand-50 to-white">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-shrink-0">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Your ZIP
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zip}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5);
              setZip(v);
              if (v.length === 5) commit({ zip: v });
              else if (v.length === 0) commit({ zip: "" });
            }}
            className="w-32 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="20850"
          />
        </div>

        <div className="flex-1">
          {!zip ? (
            <p className="text-xs text-gray-500 italic">
              Enter your ZIP to see only the rebates you actually qualify for.
            </p>
          ) : !resolved ? (
            <p className="text-xs text-amber-600">
              We don&apos;t serve this ZIP yet. Showing all programs below.
            </p>
          ) : (
            <div>
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-semibold">{county?.name}</span>,{" "}
                {resolved.state}. Pick your utility provider for accurate
                results:
              </p>
              <UtilityPicker
                countyId={resolved.countyId}
                electricUtilityId={electricUtilityId || undefined}
                gasUtilityId={gasUtilityId || undefined}
                onChange={(next) => {
                  setElectricUtilityId(next.electricUtilityId ?? "");
                  setGasUtilityId(next.gasUtilityId ?? "");
                  commit({
                    electricUtilityId: next.electricUtilityId ?? "",
                    gasUtilityId: next.gasUtilityId ?? "",
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
