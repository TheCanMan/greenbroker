"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";

interface Contractor {
  id: string;
  business_name: string;
  tier: "VERIFIED" | "PREFERRED" | "ELITE";
  categories: string[];
  bio: string | null;
  website: string | null;
  logo_url: string | null;
  mhic_license: string | null;
  mhic_verified: boolean;
  certifications: string[];
  mea_participating: boolean;
  insurance_verified: boolean;
  rating: number;
  review_count: number;
  completed_projects: number;
}

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "hvac", label: "HVAC" },
  { value: "solar-installer", label: "Solar" },
  { value: "electrician", label: "Electrician" },
  { value: "insulation", label: "Insulation" },
  { value: "plumber", label: "Plumber" },
  { value: "energy-auditor", label: "Energy auditor" },
  { value: "ev-charger", label: "EV charger" },
  { value: "home-performance", label: "Home performance" },
];

export function ContractorSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [zip, setZip] = useState(params.get("zip") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [results, setResults] = useState<Contractor[] | null>(null);
  const [countyName, setCountyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolved = zip.length === 5 ? resolveZip(zip) : null;
  const countyDisplay =
    resolved && COUNTY_BY_ID.get(resolved.countyId)?.name;

  function pushParams(next: { zip?: string; category?: string }) {
    const sp = new URLSearchParams(params.toString());
    const z = next.zip ?? zip;
    const c = next.category ?? category;
    if (z) sp.set("zip", z);
    else sp.delete("zip");
    if (c) sp.set("category", c);
    else sp.delete("category");
    startTransition(() => router.replace(`?${sp.toString()}`, { scroll: false }));
  }

  async function search(z: string, c: string) {
    if (!z || z.length !== 5) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams({ zip: z });
      if (c) sp.set("category", c);
      const res = await fetch(`/api/contractors/search?${sp.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Search failed");
        setResults([]);
      } else {
        setResults(json.contractors ?? []);
        setCountyName(json.countyName ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // Re-search whenever zip or category change (debounced via React batching).
  useEffect(() => {
    if (zip.length === 5) search(zip, category);
    else setResults(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zip, category]);

  return (
    <div>
      {/* Search bar */}
      <div className="card p-5 mb-8 bg-gradient-to-br from-brand-50 to-white">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
          <div>
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
                if (v.length === 5 || v.length === 0) pushParams({ zip: v });
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="20850"
            />
            {zip && !resolved && (
              <p className="text-xs text-amber-600 mt-1">
                We don&apos;t serve this ZIP yet.
              </p>
            )}
            {resolved && countyDisplay && (
              <p className="text-xs text-gray-500 mt-1">
                Searching {countyDisplay}, {resolved.state}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                pushParams({ category: e.target.value });
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {!zip || !resolved ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          Enter your ZIP code above to find contractors who serve your county.
        </div>
      ) : loading ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          Searching contractors in {countyDisplay ?? "your area"}…
        </div>
      ) : error ? (
        <div className="card p-6 text-sm text-red-700 bg-red-50 border-red-200">
          {error}
        </div>
      ) : !results || results.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-600">
          <p className="mb-3">
            No verified contractors are listed for{" "}
            <strong>{countyName ?? countyDisplay}</strong>
            {category ? ` (category: ${category})` : ""} yet.
          </p>
          <p className="text-xs text-gray-500">
            We&apos;re actively onboarding contractors. Want to be notified
            when new ones join? Save your assessment in the dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            {results.length} contractor{results.length === 1 ? "" : "s"} serving{" "}
            {countyName ?? countyDisplay}
          </p>
          {results.map((c) => (
            <ContractorCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContractorCard({ c }: { c: Contractor }) {
  const tierColor =
    c.tier === "ELITE"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : c.tier === "PREFERRED"
        ? "bg-brand-100 text-brand-800 border-brand-300"
        : "bg-blue-100 text-blue-800 border-blue-300";
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        {c.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.logo_url}
            alt={c.business_name}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-brand-50 text-brand-600 grid place-items-center text-xl font-bold flex-shrink-0">
            {c.business_name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{c.business_name}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${tierColor}`}
            >
              {c.tier}
            </span>
            {c.mea_participating && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                MEA
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {c.categories.join(" · ")}
          </div>
          {c.bio && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.bio}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            {c.rating > 0 && (
              <span>
                ★ {c.rating.toFixed(1)} ({c.review_count})
              </span>
            )}
            {c.completed_projects > 0 && (
              <span>{c.completed_projects} projects</span>
            )}
            {c.insurance_verified && <span>✓ Insurance verified</span>}
            {c.mhic_verified && <span>✓ MHIC verified</span>}
            {c.certifications.length > 0 && (
              <span>{c.certifications.join(", ")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
