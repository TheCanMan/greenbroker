"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { GREENBROKER_PLAN_STORAGE_KEY } from "@/lib/residential/agents";
import type { ResidentialIntakeSnapshot } from "@/lib/residential/schemas";

const CATEGORIES = [
  { value: "hvac", label: "HVAC" },
  { value: "solar-installer", label: "Solar" },
  { value: "electrician", label: "Electrician" },
  { value: "insulation", label: "Insulation / Weatherization" },
  { value: "plumber", label: "Plumber" },
  { value: "energy-auditor", label: "Energy auditor" },
  { value: "ev-charger", label: "EV charger" },
  { value: "home-performance", label: "Home performance" },
] as const;

interface Props {
  initialUpgrade?: string;
  initialZip?: string;
}

export function NewQuoteRequestForm({ initialUpgrade, initialZip }: Props) {
  const router = useRouter();
  const [zip, setZip] = useState(initialZip ?? "");
  const [upgrade, setUpgrade] = useState(initialUpgrade ?? "");
  const [scopeNotes, setScopeNotes] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [categories, setCategories] = useState<string[]>(
    inferCategoriesFrom(initialUpgrade ?? "")
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from intake snapshot if available.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GREENBROKER_PLAN_STORAGE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw) as ResidentialIntakeSnapshot;
      if (!zip && snap.zip) setZip(snap.zip);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolved = useMemo(
    () => (zip.length === 5 ? resolveZip(zip) : null),
    [zip]
  );
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;

  const blockers: string[] = [];
  if (!resolved) blockers.push("a serviceable ZIP");
  if (upgrade.length < 2) blockers.push("upgrade description");
  if (categories.length === 0) blockers.push("at least one category");
  if (!contactEmail && !contactPhone)
    blockers.push("an email or phone for follow-up");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (blockers.length > 0) {
      setError(`Still need: ${blockers.join(", ")}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contractor-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip,
          selectedUpgrade: upgrade,
          preferredCategories: categories,
          scopeNotes: scopeNotes || undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to submit");
        setSubmitting(false);
        return;
      }
      router.push(
        `/contractor-quotes/${data.requestId}?notified=${data.contractorsNotified}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  function toggleCategory(value: string) {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card p-5 space-y-4">
        <Field label="Your ZIP *">
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zip}
            onChange={(e) =>
              setZip(e.target.value.replace(/\D/g, "").slice(0, 5))
            }
            className={inputCls}
            placeholder="20850"
            autoComplete="postal-code"
          />
          {county && (
            <p className="text-xs text-emerald-700 mt-1">
              ✓ {county.name}, {resolved?.state}
            </p>
          )}
          {zip.length === 5 && !resolved && (
            <p className="text-xs text-amber-600 mt-1">
              We don&apos;t serve this ZIP yet — try one in MD or DC.
            </p>
          )}
        </Field>

        <Field label="What upgrade do you want bids on? *">
          <input
            type="text"
            value={upgrade}
            onChange={(e) => {
              setUpgrade(e.target.value);
              const inferred = inferCategoriesFrom(e.target.value);
              if (inferred.length > 0 && categories.length === 0) {
                setCategories(inferred);
              }
            }}
            placeholder="e.g. Heat pump water heater"
            className={inputCls}
          />
        </Field>

        <Field label="Contractor categories *">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const checked = categories.includes(c.value);
              return (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => toggleCategory(c.value)}
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium ${
                    checked
                      ? "border-brand-500 bg-brand-50 text-brand-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Project notes (optional)">
          <textarea
            rows={3}
            value={scopeNotes}
            onChange={(e) => setScopeNotes(e.target.value)}
            placeholder="Existing equipment age, brand preference, when you want it done, anything that would help a contractor scope the job."
            className={inputCls}
            maxLength={2000}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email (for bid responses) *">
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className={inputCls}
              autoComplete="tel"
            />
          </Field>
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          We share these with contractors only after you submit. We never sell
          your contact info.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-gray-500">
          {blockers.length === 0
            ? "Looks good — ready to fan out to matching contractors."
            : `Still need: ${blockers.join(", ")}`}
        </p>
        <button
          type="submit"
          disabled={submitting || blockers.length > 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 text-base"
        >
          {submitting ? "Sending request…" : "Request bids →"}
        </button>
      </div>
    </form>
  );
}

function inferCategoriesFrom(upgrade: string): string[] {
  const u = upgrade.toLowerCase();
  const cats: string[] = [];
  if (u.includes("heat pump") && !u.includes("water")) cats.push("hvac");
  if (u.includes("water heater") || u.includes("hpwh")) cats.push("plumber");
  if (u.includes("solar")) cats.push("solar-installer");
  if (u.includes("insulat") || u.includes("air seal") || u.includes("home performance"))
    cats.push("insulation", "energy-auditor");
  if (u.includes("ev charger") || u.includes("electrical panel"))
    cats.push("electrician");
  if (u.includes("audit")) cats.push("energy-auditor");
  return cats;
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
