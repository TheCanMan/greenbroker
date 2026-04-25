"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID, electricUtilitiesForCounty } from "@/lib/geo/registry";

/**
 * Hero ZIP form. Resolves the ZIP to a county client-side, shows what we
 * detected, and on submit routes to /intake with the ZIP pre-filled.
 */
export function HomepageZipForm() {
  const router = useRouter();
  const [zip, setZip] = useState("");

  const resolved = zip.length === 5 ? resolveZip(zip) : null;
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;
  const utilityNames = resolved
    ? electricUtilitiesForCounty(resolved.countyId)
        .map((u) => u.name)
        .join(", ")
    : null;

  function start(e: React.FormEvent) {
    e.preventDefault();
    if (!resolved) {
      // Let them through anyway — intake form will validate.
      router.push(zip ? `/intake?zip=${zip}` : "/intake");
      return;
    }
    router.push(`/intake?zip=${zip}`);
  }

  return (
    <form
      onSubmit={start}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 max-w-xl"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="hero-zip" className="block text-xs font-semibold text-gray-700 mb-1">
            Your ZIP
          </label>
          <input
            id="hero-zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="20850"
            autoComplete="postal-code"
          />
        </div>
        <div className="sm:self-end">
          <button
            type="submit"
            className="btn-primary w-full sm:w-auto text-base py-3 px-6"
          >
            Check My Rebates →
          </button>
        </div>
      </div>
      <div className="mt-3 text-xs min-h-[1.5em]">
        {!zip ? (
          <span className="text-gray-400">
            We currently serve Montgomery, Prince George&apos;s, Howard, Frederick,
            Anne Arundel, Baltimore, Charles + DC. Wider coverage coming.
          </span>
        ) : !resolved ? (
          <span className="text-amber-600">
            We don&apos;t serve this ZIP yet — you can still run the intake to save your
            info, and we&apos;ll notify you when your area is live.
          </span>
        ) : (
          <span className="text-emerald-700">
            ✓ {county?.name}, {resolved.state}{" "}
            {utilityNames && <span className="text-gray-500">· {utilityNames}</span>}
          </span>
        )}
      </div>
    </form>
  );
}
