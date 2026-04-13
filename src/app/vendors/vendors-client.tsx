"use client";

import { useEffect, useState } from "react";

const TYPES = [
  { value: "", label: "All Vendor Types" },
  { value: "big-box", label: "Big-Box Retail" },
  { value: "specialty-retail", label: "Specialty Retail" },
  { value: "online", label: "Online" },
  { value: "manufacturer", label: "Manufacturer Direct" },
  { value: "utility-program", label: "Utility Programs" },
  { value: "local-distributor", label: "Local Distributors" },
  { value: "cooperative", label: "Group Buy / Cooperative" },
];

const CATEGORIES = [
  { value: "", label: "All Product Categories" },
  { value: "heat-pump", label: "Heat Pumps" },
  { value: "water-heater", label: "Water Heaters" },
  { value: "solar-panel", label: "Solar Panels" },
  { value: "battery-storage", label: "Battery Storage" },
  { value: "smart-thermostat", label: "Smart Thermostats" },
  { value: "refrigerator", label: "Refrigerators" },
  { value: "dryer", label: "Dryers" },
  { value: "ev-charger", label: "EV Chargers" },
  { value: "insulation", label: "Insulation" },
  { value: "window", label: "Windows" },
];

export function VendorsClient() {
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [zip, setZip] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (zip) params.set("zip", zip);
    if (verifiedOnly) params.set("verifiedOnly", "true");

    setLoading(true);
    fetch(`/api/vendors?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setVendors(data.vendors || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, [category, type, zip, verifiedOnly]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      <aside className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit sticky top-4">
        <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Vendor Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Product Category</label>
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
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600"
              />
              <span className="font-medium text-gray-700">Verified only</span>
            </label>
          </div>
          <button
            onClick={() => {
              setCategory("");
              setType("");
              setZip("");
              setVerifiedOnly(false);
            }}
            className="w-full text-sm text-brand-600 hover:text-brand-700 font-medium pt-2 border-t border-gray-100"
          >
            Clear all filters
          </button>
        </div>
      </aside>

      <div>
        <p className="text-sm text-gray-600 mb-4">
          {loading ? "Loading..." : `${vendors.length} vendor${vendors.length === 1 ? "" : "s"} found`}
        </p>

        {!loading && vendors.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-1">No vendors match your filters</h3>
            <p className="text-sm text-gray-500">Try clearing a filter or broadening your search.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VendorCard({ vendor }: { vendor: any }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">
            {vendor.logoEmoji ? `${vendor.logoEmoji} ` : ""}
            {vendor.name}
          </h3>
          <div className="text-xs text-gray-500 capitalize mt-0.5">
            {vendor.type.replace(/-/g, " ")}
            {vendor.city && vendor.state ? ` · ${vendor.city}, ${vendor.state}` : ""}
          </div>
        </div>
        {vendor.verified && (
          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
            ✓ Verified
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">{vendor.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {vendor.energyStarPartner && (
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
            EnergyStar Partner
          </span>
        )}
        {vendor.rebateProcessor && (
          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
            Files Rebates
          </span>
        )}
        {vendor.meaApproved && (
          <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
            MEA Approved
          </span>
        )}
        {vendor.installationAvailable && (
          <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
            Installation Available
          </span>
        )}
        {vendor.nationalShipping && (
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
            Ships Nationwide
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {vendor.categories.length} product categor{vendor.categories.length === 1 ? "y" : "ies"}
        </div>
        <a
          href={vendor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Visit Website →
        </a>
      </div>
    </div>
  );
}
