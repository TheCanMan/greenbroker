import { SOLAR_PANELS } from "@/lib/data/products";
import { formatCurrency } from "@/lib/calculations/savings";
import type { SolarPanelProduct } from "@/lib/types";

function RatingBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SolarPanelCard({ product, rank }: { product: SolarPanelProduct; rank: number }) {
  const systemCostMin = (product.installedCostMin || 0) * 440;
  const systemCostMax = (product.installedCostMax || 0) * 440;

  return (
    <div className={`card p-6 ${rank === 1 ? "border-brand-400 border-2" : ""}`}>
      {rank === 1 && (
        <div className="badge-savings mb-3">⭐ #1 Most Efficient</div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
            #{rank} · {product.brand}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
          <div className="text-sm text-gray-500 mt-0.5">{product.model}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-700">{product.efficiencyPercent}%</div>
          <div className="text-xs text-gray-400">Efficiency</div>
        </div>
      </div>

      {/* Key Specs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Efficiency", value: product.efficiencyPercent, max: 25, color: "bg-blue-500" },
          { label: "Wattage", value: product.wattageW, max: 500, color: "bg-green-500" },
          {
            label: "Warranty",
            value: product.warrantyYears,
            max: 40,
            color: "bg-brand-500",
          },
        ].map((spec, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{spec.label}</span>
              <span className="font-semibold text-gray-900">
                {spec.label === "Warranty" ? `${spec.value}yr` : `${spec.value}${spec.label === "Wattage" ? "W" : "%"}`}
              </span>
            </div>
            <RatingBar value={spec.value} max={spec.max} color={spec.color} />
          </div>
        ))}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.efficiencyPercent >= 24 && (
          <span className="badge-savings">Premium Efficiency</span>
        )}
        {product.degradationPctPerYear <= 0.3 && (
          <span className="badge-rebate">Low Degradation</span>
        )}
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {product.wattageW}W • ${product.pricePerWatt.toFixed(2)}/W
        </span>
      </div>

      {/* Cost & Specs */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Installed $/W (Montgomery County)</div>
            <div className="font-bold text-gray-900">${product.pricePerWatt.toFixed(2)}/W</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">440W system cost</div>
            <div className="font-bold text-brand-600">
              {formatCurrency(systemCostMin)}–{formatCurrency(systemCostMax)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Annual output (440W)</div>
            <div className="font-bold text-green-600">~{product.annualKwhPer440W} kWh/yr</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Degradation/year</div>
            <div className="font-bold text-gray-900">{product.degradationPctPerYear}%</div>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <ul className="space-y-1.5 mb-4">
        {product.highlights.slice(0, 3).map((h, i) => (
          <li key={i} className="text-sm text-gray-600 flex gap-2">
            <span className="text-brand-500 flex-shrink-0">✓</span>
            {h}
          </li>
        ))}
      </ul>

      {/* Caveats */}
      {product.caveats && product.caveats.length > 0 && (
        <ul className="space-y-1.5">
          {product.caveats.map((c, i) => (
            <li key={i} className="text-xs text-amber-700 flex gap-2">
              <span className="flex-shrink-0">⚠</span>
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SolarPanelsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="text-sm text-gray-500 mb-2">Products / Solar Panels</div>
        <h1 className="section-title">Solar Panel Rankings</h1>
        <p className="section-subtitle">
          Ranked by efficiency. All pricing is installed $/W for Montgomery County, MD with 4.5 peak sun hours/day.
        </p>
      </div>

      {/* Rebate Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "MSAP Solar Rebate", amount: "$7,500", sub: "Income-qualified, state program" },
          { label: "RCES Battery Grant", amount: "$5,000", sub: "30% of battery cost, renewable energy cert" },
          { label: "MD Sales Tax Exemption", amount: "~$900", sub: "7% sales tax waived on solar + storage" },
        ].map((item, i) => (
          <div key={i} className="bg-brand-50 rounded-2xl p-5">
            <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">{item.sub}</div>
            <div className="text-3xl font-bold text-brand-700">{item.amount}</div>
            <div className="text-sm text-gray-700 font-medium mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Efficiency Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-blue-900 mb-2">Understanding Solar Panel Efficiency & Value</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong>SunPower Maxeon 7 (Premium)</strong><br />
            <span className="text-blue-600">24.1% efficiency • Lowest degradation (0.25%/yr) • Best for small roofs</span>
          </div>
          <div>
            <strong>LONGi Hi-MO 6 (Best Value)</strong><br />
            <span className="text-blue-600">22.8% efficiency • $0.40/W less than SunPower • 30-year warranty</span>
          </div>
          <div>
            <strong>Canadian Solar (Budget)</strong><br />
            <span className="text-blue-600">21.4% efficiency • Lowest upfront cost • 25-year warranty</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          At Montgomery County&apos;s 4.5 peak sun hours/day and 1,300 kWh/kW/year yield, all three panels produce 560–572 kWh/year per 440W.
          Premium efficiency matters most when roof space is limited.
        </div>
      </div>

      {/* Economics Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-amber-800 mb-2">⚠️ Solar economics: 9.4-year payback without federal credits</h3>
        <p className="text-sm text-amber-700 leading-relaxed">
          Federal ITC (25% tax credit, recently extended through 2032) dramatically improves solar ROI. At $13,000 installed cost
          per kW and 1,300 kWh/kW/year yield in Maryland, a 10 kW system ({formatCurrency(130000)} installed cost) generates
          ~13,000 kWh/year worth ~$2,821 at PEPCO rates ($0.217/kWh). <strong>Without federal tax credits: 9.4-year payback.</strong>{" "}
          <strong>With 25% federal ITC (standard): ~7 years.</strong> MSAP program (income-qualified, $7,500 max rebate) and Maryland
          SREC income ($700–$950/year on 1 SREC per 1,000 kWh) further improve payback. Note: Federal 25D tax credit was eliminated
          12/31/2025.
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SOLAR_PANELS.map((product, i) => (
          <SolarPanelCard key={product.id} product={product} rank={i + 1} />
        ))}
      </div>

      {/* Licensing Note */}
      <div className="mt-10 bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-2">Contractor requirements for solar installation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong className="text-gray-900">MHIC License</strong><br />
            Maryland Home Improvement Commission — required for all residential contractors installing roof-mounted systems. Now
            requires $500,000 general liability insurance.
          </div>
          <div>
            <strong className="text-gray-900">Electrical Contractor License</strong><br />
            Maryland Board of Electrical Examiners — Master or Journeyman license required for solar electrical interconnection.
            Check contractor credentials.
          </div>
          <div>
            <strong className="text-gray-900">Roof Warranty Compliance</strong><br />
            Verify roof age and remaining warranty. Most installers require 10+ years of roof life to avoid costly re-roofing
            before solar (typical cost: $1,500–$3,000 for roof prep).
          </div>
        </div>
      </div>
    </div>
  );
}
