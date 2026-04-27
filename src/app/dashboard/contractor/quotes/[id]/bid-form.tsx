"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BidForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [grossCost, setGrossCost] = useState("");
  const [model, setModel] = useState("");
  const [timeline, setTimeline] = useState("");
  const [participates, setParticipates] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!grossCost || parseFloat(grossCost) <= 0) {
      setError("Gross cost is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/contractor-quotes/${requestId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grossCostUsd: parseFloat(grossCost),
          eligibleModelNumber: model || undefined,
          timeline: timeline || undefined,
          participatesInRebate: participates,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to submit bid");
        setSubmitting(false);
        return;
      }
      router.refresh();
      router.push(`/dashboard/contractor/quotes?submitted=${requestId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <h2 className="font-bold text-gray-900">Submit your bid</h2>

      <Field label="Gross project cost ($) *">
        <input
          type="number"
          value={grossCost}
          onChange={(e) => setGrossCost(e.target.value)}
          min={1}
          step={50}
          className={inputCls}
          placeholder="3500"
          required
        />
      </Field>

      <Field label="Equipment make / model #">
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. Rheem Performance Platinum HPWH 50gal"
          className={inputCls}
        />
      </Field>

      <Field label="Timeline">
        <input
          type="text"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. 2 weeks from contract sign"
          className={inputCls}
        />
      </Field>

      <label className="flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={participates}
          onChange={(e) => setParticipates(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-gray-700">
          I&apos;ll submit the rebate paperwork on the homeowner&apos;s behalf
        </span>
      </label>

      <Field label="Notes (anything else they should know)">
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          placeholder="Includes permitting, removal of old equipment, manufacturer's 10-yr warranty, etc."
          className={inputCls}
        />
      </Field>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting…" : "Submit bid →"}
      </button>

      <p className="text-xs text-gray-500">
        Your MHIC + MEA-Participating status auto-attach from your profile.
      </p>
    </form>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
