"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AwardButton({
  requestId,
  quoteId,
  contractorName,
}: {
  requestId: string;
  quoteId: string;
  contractorName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function awardBid() {
    const ok = window.confirm(
      `Award this bid to ${contractorName}? This notifies the selected contractor and marks other bids as not selected.`,
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    const res = await fetch(`/api/contractor-quotes/${requestId}/award`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Could not award this bid.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={awardBid}
        disabled={loading}
        className="btn-primary text-sm disabled:opacity-50"
      >
        {loading ? "Awarding..." : `Award ${contractorName}`}
      </button>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
