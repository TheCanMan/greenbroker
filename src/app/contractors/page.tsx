import { Suspense } from "react";
import Link from "next/link";
import { ContractorSearch } from "@/components/geo/ContractorSearch";

const CONTRACTOR_CATEGORIES = [
  {
    id: "hvac",
    icon: "🌡️",
    title: "HVAC Contractors",
    description: "Heat pump installation and ductwork",
    licenses: ["MHIC", "Maryland HVACR Board", "EPA Section 608"],
    certifications: ["BPI Certified", "Mitsubishi Diamond (for mini-splits)"],
    keyNote: "EPA 608 Universal certification is explicitly required for heat pump refrigerant handling.",
  },
  {
    id: "solar",
    icon: "☀️",
    title: "Solar Installers",
    description: "PV systems and battery integration",
    licenses: ["MHIC", "Master Electrician"],
    certifications: ["NABCEP PV Installation Professional"],
    keyNote: "NABCEP not legally required but is the gold standard. Verify MEA Participating Contractor status for MSAP rebate.",
  },
  {
    id: "electrician",
    icon: "⚡",
    title: "Electricians",
    description: "Panel upgrades, EV charger installation, wiring",
    licenses: ["MHIC", "Maryland Statewide Master Electrician"],
    certifications: ["EPA Lead RRP (pre-1978 homes)"],
    keyNote: "All electrical licenses now issued statewide (not county-level). $300,000 GL + $100,000 property damage insurance required.",
  },
  {
    id: "insulation",
    icon: "🏠",
    title: "Insulation / Weatherization",
    description: "Air sealing, insulation, duct sealing",
    licenses: ["MHIC"],
    certifications: ["BPI Certified (required for EmPOWER Home Performance)"],
    keyNote: "BPI certification is required for the EmPOWER Home Performance with Energy Star program.",
  },
  {
    id: "plumber",
    icon: "💧",
    title: "Plumbers",
    description: "Heat pump water heater installation",
    licenses: ["MHIC", "State Plumbing Board License", "WSSC Water License"],
    certifications: [],
    keyNote: "CRITICAL: WSSC Water license is required for Montgomery County — the state license alone is not sufficient.",
  },
  {
    id: "energy-auditor",
    icon: "🔍",
    title: "Energy Auditors",
    description: "BPI-certified home energy assessments ($100 audit required for EmPOWER)",
    licenses: ["MHIC"],
    certifications: ["BPI HEP Energy Auditor"],
    keyNote: "Required first step for EmPOWER Home Performance program. $100 audit (valued at $400) unlocks up to $15,000 in rebates.",
  },
];

const CONTRACTOR_TIERS = [
  {
    name: "Verified",
    color: "blue",
    requirements: [
      "MHIC license",
      "Trade license",
      "$500K general liability insurance",
      "Background check",
    ],
  },
  {
    name: "Preferred",
    color: "brand",
    requirements: [
      "All Verified requirements",
      "Relevant certifications (BPI/NABCEP)",
      "10+ completed energy projects",
      "4.5+ platform rating",
    ],
  },
  {
    name: "Elite",
    color: "amber",
    requirements: [
      "All Preferred requirements",
      "Post-installation diagnostic verification",
      "4.8+ platform rating",
      "Documented energy savings from projects",
    ],
  },
];

export default function ContractorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Find Contractors</h1>
        <p className="section-subtitle">
          Vetted contractors for energy efficiency work. Filter by your county
          and category — only contractors who actually serve your area appear.
        </p>
      </div>

      {/* Search */}
      <Suspense fallback={<div className="card p-8 text-sm text-gray-500">Loading…</div>}>
        <ContractorSearch />
      </Suspense>

      <div className="my-12 border-t border-gray-100" />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          How GreenBroker vets every contractor
        </h2>
        <p className="text-sm text-gray-500">
          We verify Maryland MHIC + trade licenses, insurance, and (for EmPOWER
          / MSAP rebate-eligible work) MEA Participating Contractor status
          before any contractor reaches the marketplace.
        </p>
      </div>

      {/* Contractor Tiers */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">GreenBroker Quality Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CONTRACTOR_TIERS.map((tier, i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    tier.color === "amber"
                      ? "bg-amber-400"
                      : tier.color === "brand"
                      ? "bg-brand-500"
                      : "bg-blue-400"
                  }`}
                />
                <h3 className="font-bold text-gray-900">{tier.name}</h3>
              </div>
              <ul className="space-y-2">
                {tier.requirements.map((req, j) => (
                  <li key={j} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-brand-500 flex-shrink-0">✓</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Post-installation verification note */}
      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 mb-12">
        <h3 className="font-bold text-brand-900 mb-2">
          🔍 Post-Installation Verification — GreenBroker&apos;s Key Differentiator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-brand-800">
          <div>
            <strong>Weatherization:</strong> Blower door tests (pre/post ACH50 measurement)
            and infrared thermography (post-insulation thermal imaging)
          </div>
          <div>
            <strong>HVAC:</strong> Commissioning verification — airflow, refrigerant charge,
            temperature differential
          </div>
          <div>
            <strong>Solar:</strong> Production monitoring against design projections for first 12 months
          </div>
          <div>
            <strong>Platform guarantee:</strong> Modeled on Thumbtack&apos;s program —
            up to $2,500 money-back + $100,000 property damage coverage
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          12 Contractor Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CONTRACTOR_CATEGORIES.map((cat) => (
            <div key={cat.id} className="card p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{cat.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{cat.description}</p>

                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Required Licenses
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.licenses.map((lic) => (
                        <span key={lic} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium">
                          {lic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {cat.certifications.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Key Certifications
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.certifications.map((cert) => (
                          <span key={cert} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800">
                    <strong>📌</strong> {cat.keyNote}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* License Verification */}
      <div className="bg-gray-50 rounded-3xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          How to verify a contractor&apos;s licenses yourself
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <strong className="text-gray-900 block mb-1">MHIC + Trade Licenses (Maryland DLLR)</strong>
            <a
              href="https://labor.maryland.gov/pq/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline hover:text-brand-700"
            >
              labor.maryland.gov/pq/
            </a>
            <p className="mt-1">Search by name or license number. Verify active status and insurance amounts.</p>
          </div>
          <div>
            <strong className="text-gray-900 block mb-1">MEA Participating Contractor Status</strong>
            <a
              href="https://energy.maryland.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline hover:text-brand-700"
            >
              energy.maryland.gov
            </a>
            <p className="mt-1">Required for EmPOWER Home Performance and MSAP solar rebates. Ask contractor for MEA ID.</p>
          </div>
          <div>
            <strong className="text-gray-900 block mb-1">WSSC Water License (Plumbers)</strong>
            <a
              href="https://www.wsscwater.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline hover:text-brand-700"
            >
              wsscwater.com
            </a>
            <p className="mt-1">State plumbing license alone is NOT sufficient for Montgomery County work. Verify WSSC separately.</p>
          </div>
          <div>
            <strong className="text-gray-900 block mb-1">BPI Certification (Energy Auditors)</strong>
            <a
              href="https://www.bpi.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline hover:text-brand-700"
            >
              bpi.org/find-a-contractor
            </a>
            <p className="mt-1">Required for EmPOWER Home Performance with Energy Star. Find BPI-certified contractors near 20850.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
