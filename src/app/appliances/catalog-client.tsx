"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "heat-pump", label: "Heat Pumps" },
  { value: "water-heater", label: "Water Heaters" },
  { value: "solar-panel", label: "Solar Panels" },
  { value: "battery-storage", label: "Battery Storage" },
  { value: "smart-thermostat", label: "Smart Thermostats" },
  { value: "refrigerator", label: "Refrigerators" },
  { value: "dryer", label: "Heat Pump Dryers" },
  { value: "ev-charger", label: "Pool Pumps / Other" },
];

const TIERS = [
  { value: "", label: "Any Tier" },
  { value: "most-efficient", label: "Most Efficient" },
  { value: "best", label: "Best" },
  { value: "better", label: "Better" },
  { value: "good", label: "Good" },
];

const SORTS = [
  { value: "savings", label: "Highest Annual Savings" },
  { value: "efficiency", label: "Most Efficient First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

interface Result {
  product: any;
  lowestPrice: number | null;
  vendorCount: number;
  vendors: Array<{
    id: string;
    name: string;
    type: string;
    price?: number;
    priceNote?: string;
    stockStatus: string;
    includesInstallation?: boolean;
  }>;
}

export function AppliancesCatalogClient() {
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("");
  const [zip, setZip] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [energyStar, setEnergyStar] = useState(false);
  const [sort, setSort] = useState("savings");

  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (tier) params.set("tier", tier);
    if (zip) params.set("zip", zip);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (energyStar) params.set("energyStar", "true");
    if (sort) params.set("sort", sort);

    setLoading(true);
    fetch(`/api/catalog?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.results || []);
        setCount(data.count || 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [category, tier, zip, maxPrice, energyStar, sort]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      {/* Filters */}
      <aside className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit sticky top-4">
        <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Efficiency Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Your ZIP</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="20850"
              pattern="\d{5}"
              maxLength={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-400 mt-1">Filter vendors serving your area</p>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Max Price ($)</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={energyStar}
                onChange={(e) => setEnergyStar(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600"
              />
              <span className="font-medium text-gray-700">EnergyStar Most Efficient only</span>
            </label>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setCategory("");
              setTier("");
              setZip("");
              setMaxPrice("");
              setEnergyStar(false);
              setSort("savings");
            }}
            className="w-full text-sm text-brand-600 hover:text-brand-700 font-medium pt-2 border-t border-gray-100"
          >
            Clear all filters
          </button>
        </div>
      </aside>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {loading ? "Loading..." : `${count} product${count === 1 ? "" : "s"} found`}
          </p>
        </div>

        {!loading && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-1">No products match your filters</h3>
            <p className="text-sm text-gray-500">Try removing a filter or expanding your search area.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map(({ product, lowestPrice, vendorCount, vendors }) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                    {product.brand}
                  </div>
                  <h3 className="font-semibold text-gray-900 leading-snug">{product.name}</h3>
                </div>
                <TierBadge tier={product.tier} />
              </div>

              {product.energyStarMostEfficient && (
                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-3">
                  ⭐ EnergyStar Most Efficient
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm mb-3 pt-3 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500">Starting at</div>
                  <div className="font-bold text-gray-900">
                    {lowestPrice !== null
                      ? `$${lowestPrice.toLocaleString()}`
                      : product.installedCostMin
                        ? `$${product.installedCostMin.toLocaleString()}+`
                        : "Call"}
                  </div>
                </div>
                {product.annualSavingsVsBaseline ? (
                  <div>
                    <div className="text-xs text-gray-500">Annual Savings</div>
                    <div className="font-bold text-green-700">
                      ${product.annualSavingsVsBaseline.toLocaleString()}/yr
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="text-xs text-gray-600 mb-3">
                {vendorCount > 0
                  ? `${vendorCount} vendor${vendorCount === 1 ? "" : "s"} available`
                  : "Contact manufacturer"}
              </div>

              {vendors.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {vendors.slice(0, 3).map((v) => (
                    <span
                      key={v.id}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                    >
                      {v.name.split("—")[0].trim()}
                    </span>
                  ))}
                  {vendors.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      +{vendors.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <Link
                href={`/appliances/${product.id}`}
                className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                View Details & Where to Buy
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    "most-efficient": { bg: "bg-emerald-100", text: "text-emerald-800", label: "Most Efficient" },
    best: { bg: "bg-blue-100", text: "text-blue-800", label: "Best" },
    better: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Better" },
    good: { bg: "bg-gray-100", text: "text-gray-700", label: "Good" },
  };
  const t = map[tier] || { bg: "bg-gray-100", text: "text-gray-700", label: tier };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.bg} ${t.text}`}>
      {t.label}
    </span>
  );
}
