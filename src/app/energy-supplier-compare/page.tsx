import Link from "next/link";
import { SUPPLIER_OFFERS, PEPCO_STANDARD_OFFER_RATE } from "@/lib/data/supplier-offers";
import { assessOffer } from "@/lib/data/supplier-risk";
import { formatCurrency } from "@/lib/calculations/savings";

interface PageProps {
  searchParams: Promise<{
    utility?: string;
    current_supplier?: string;
    current_rate?: string;
    kwh?: string;
    desired_plan_type?: string;
    risk_tolerance?: string;
  }>;
}

const BAND_STYLES = {
  safe: "bg-emerald-50 text-emerald-800 border-emerald-200",
  watch: "bg-amber-50 text-amber-800 border-amber-200",
  avoid: "bg-red-50 text-red-800 border-red-200",
};

const SEVERITY_STYLES = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-red-50 text-red-800 border-red-200",
};

export default async function SupplierComparePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const annualKwh = sp.kwh ? Math.max(1, parseInt(sp.kwh)) : 11000; // baseline 2k sqft home
  const baselineRate = sp.current_rate
    ? Math.max(0.01, parseFloat(sp.current_rate))
    : PEPCO_STANDARD_OFFER_RATE;
  const desiredPlanType = sp.desired_plan_type ?? "fixed_rate_only";
  const riskTolerance = sp.risk_tolerance ?? "low";

  const assessed = SUPPLIER_OFFERS.filter((offer) => {
    if (desiredPlanType === "fixed_rate_only") return offer.rateType === "fixed";
    if (desiredPlanType === "renewable") return offer.renewablePercent > 0;
    return true;
  }).map((offer) => ({
    offer,
    assessment: assessOffer(offer, annualKwh, baselineRate),
  })).sort((a, b) => {
    // Sort: safe + recommended first, then by savings desc, push avoid to the bottom
    if (a.assessment.band !== b.assessment.band) {
      const order = { safe: 0, watch: 1, avoid: 2 };
      return order[a.assessment.band] - order[b.assessment.band];
    }
    return b.assessment.estimatedAnnualSavings - a.assessment.estimatedAnnualSavings;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <h1 className="section-title">Energy supplier comparison</h1>
        <p className="section-subtitle">
          Maryland allows residential energy choice — but not every supplier plan is a
          good one. We compare offers against your utility&apos;s supply rate and flag
          risky contract terms before you switch.
        </p>
      </div>

      <form
        method="GET"
        className="card p-5 mb-8 bg-gradient-to-br from-brand-50 to-white"
      >
        <p className="text-xs font-semibold text-gray-700 mb-3">
          Tune your comparison
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="block text-xs text-gray-600 mb-1">Utility</span>
            <select
              name="utility"
              defaultValue={sp.utility ?? "pepco-md"}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="pepco-md">PEPCO Maryland</option>
              <option value="bge">BGE</option>
              <option value="potomac-edison-md">Potomac Edison</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-gray-600 mb-1">
              Current supplier
            </span>
            <input
              type="text"
              name="current_supplier"
              defaultValue={sp.current_supplier ?? "Utility standard offer"}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-600 mb-1">
              Current rate ($/kWh)
            </span>
            <input
              type="number"
              name="current_rate"
              defaultValue={baselineRate}
              min={0.01}
              max={1}
              step={0.0001}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-600 mb-1">
              Annual kWh
            </span>
            <input
              type="number"
              name="kwh"
              defaultValue={annualKwh}
              min={1000}
              max={100000}
              step={500}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-600 mb-1">Desired plan</span>
            <select
              name="desired_plan_type"
              defaultValue={desiredPlanType}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="fixed_rate_only">Fixed rate only</option>
              <option value="lowest_cost">Lowest cost</option>
              <option value="renewable">Renewable</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-gray-600 mb-1">Risk tolerance</span>
            <select
              name="risk_tolerance"
              defaultValue={riskTolerance}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <button type="submit" className="btn-primary self-end text-sm py-2">
            Recalculate
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 leading-snug">
          Default baseline is PEPCO&apos;s current standard-offer-service rate
          (${baselineRate.toFixed(4)}/kWh, generation only). For an exact comparison,
          look at the &quot;Price to Compare&quot; on your most recent bill and enter
          it here.
        </p>
      </form>

      {/* Safety preamble */}
      <div className="card p-5 mb-8 bg-amber-50 border-amber-200">
        <h2 className="font-bold text-amber-900 mb-2">
          What we flag before you switch
        </h2>
        <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
          <li><strong>Variable rates</strong> — your bill can spike without warning</li>
          <li><strong>Teaser intro rates</strong> — savings disappear after 1–6 months</li>
          <li><strong>Monthly fees</strong> — fixed cost regardless of usage</li>
          <li><strong>Early termination fees</strong> — you can&apos;t escape if rates change</li>
          <li><strong>Renewable premiums</strong> — make sure the price is worth the certificate</li>
        </ul>
        <p className="text-xs text-amber-700 mt-3">
          We don&apos;t auto-switch suppliers yet. Use this to evaluate offers, then
          enroll directly with the supplier or stay on your utility&apos;s standard offer.
        </p>
      </div>

      {/* Offers */}
      <div className="space-y-4">
        {assessed.map(({ offer, assessment }) => (
          <div key={offer.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{offer.supplierName}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase ${BAND_STYLES[assessment.band]}`}
                  >
                    {assessment.band}
                  </span>
                  {assessment.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Worth reviewing
                    </span>
                  )}
                  {offer.renewablePercent > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-800">
                      {offer.renewablePercent}% renewable
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  License #{offer.licenseNumber} · last verified {offer.lastVerified}
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-4 text-xs">
                  <Cell label="Rate" value={`$${offer.rate.toFixed(4)}/kWh`} />
                  <Cell label="Risk score" value={`${assessment.score}/100`} accent={assessment.score >= 50 ? "warn" : undefined} />
                  <Cell
                    label="Type"
                    value={
                      offer.rateType === "fixed"
                        ? "Fixed"
                        : offer.rateType === "variable"
                          ? "Variable"
                          : "Intro → variable"
                    }
                    accent={offer.rateType !== "fixed" ? "warn" : undefined}
                  />
                  <Cell
                    label="Term"
                    value={offer.termMonths === 0 ? "Month-to-month" : `${offer.termMonths} mo`}
                  />
                  <Cell
                    label="Monthly fee"
                    value={offer.monthlyFee === 0 ? "—" : `$${offer.monthlyFee.toFixed(2)}`}
                    accent={offer.monthlyFee > 0 ? "warn" : undefined}
                  />
                  <Cell
                    label="ETF"
                    value={
                      offer.earlyTerminationFee === 0
                        ? "—"
                        : `$${offer.earlyTerminationFee}`
                    }
                    accent={offer.earlyTerminationFee > 0 ? "warn" : undefined}
                  />
                  {offer.introRate !== undefined && (
                    <Cell
                      label="Intro rate"
                      value={`$${offer.introRate.toFixed(4)} for ${offer.introMonths} mo`}
                      accent="warn"
                    />
                  )}
                </dl>

                {assessment.warnings.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {assessment.warnings.map((w, i) => (
                      <div
                        key={i}
                        className={`text-xs px-3 py-2 rounded-lg border leading-relaxed ${SEVERITY_STYLES[w.severity]}`}
                      >
                        <strong className="uppercase mr-1">{w.severity}:</strong>
                        {w.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0 min-w-[180px]">
                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                  Estimated annual
                </div>
                <div
                  className={`text-3xl font-bold ${
                    assessment.estimatedAnnualSavings > 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {assessment.estimatedAnnualSavings >= 0 ? "+" : ""}
                  {formatCurrency(assessment.estimatedAnnualSavings)}
                </div>
                <div className="text-xs text-gray-500">
                  vs utility standard offer
                </div>
                {assessment.introOnlyAnnualSavings !== null &&
                  assessment.introOnlyAnnualSavings !==
                    assessment.estimatedAnnualSavings && (
                    <div className="text-xs text-amber-700 mt-2 leading-snug">
                      First-year only:{" "}
                      <strong>
                        {assessment.introOnlyAnnualSavings >= 0 ? "+" : ""}
                        {formatCurrency(assessment.introOnlyAnnualSavings)}
                      </strong>{" "}
                      (then reverts to variable)
                    </div>
                  )}
                {offer.url && (
                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 text-brand-600 hover:text-brand-700 text-xs font-medium underline"
                  >
                    Supplier site →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 mt-8 bg-gray-50 border-gray-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h3 className="font-bold text-gray-900 mb-2">Safe-switch checklist</h3>
          <a href="#safe-switch-checklist" className="btn-commercial text-sm py-2 px-4">
            Review switch checklist
          </a>
        </div>
        <div id="safe-switch-checklist" />
        <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
          <li>Find the &quot;Price to Compare&quot; on your most recent utility bill — that&apos;s the rate to beat.</li>
          <li>Pick a fixed-rate plan with a clear term (12–24 months) and no monthly fee.</li>
          <li>Check the supplier&apos;s Maryland PSC license number on{" "}
            <a
              href="https://www.psc.state.md.us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 underline"
            >
              psc.state.md.us
            </a>
            .
          </li>
          <li>Read the contract terms — specifically the early termination fee and what happens at the end of the term.</li>
          <li>Take a screenshot of the rate page when you sign up. Some suppliers change terms after the fact.</li>
          <li>Calendar a reminder 60 days before contract expiration so you can shop again or switch back.</li>
        </ol>
      </div>

      <p className="text-xs text-gray-500 mt-6 leading-relaxed max-w-3xl">
        Mock supplier offers shown for demonstration — replace with live PSC data
        before going to real users. <Link href="/intake" className="underline font-medium">Run the intake</Link>{" "}
        first if you don&apos;t know your annual usage; we&apos;ll estimate it from
        your home profile.
      </p>
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "warn";
}) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div
        className={`font-semibold ${accent === "warn" ? "text-amber-700" : "text-gray-900"}`}
      >
        {value}
      </div>
    </div>
  );
}
