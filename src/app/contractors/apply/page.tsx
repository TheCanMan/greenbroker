"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ServiceAreaPicker } from "@/components/geo/ServiceAreaPicker";
import type { ServiceArea } from "@/lib/geo/types";

const CATEGORIES = [
  { value: "hvac", label: "HVAC" },
  { value: "solar-installer", label: "Solar Installer" },
  { value: "electrician", label: "Electrician" },
  { value: "insulation", label: "Insulation" },
  { value: "window", label: "Windows & Doors" },
  { value: "roofing", label: "Roofing" },
  { value: "general-contractor", label: "General Contractor" },
  { value: "energy-auditor", label: "Energy Auditor" },
  { value: "plumber", label: "Plumber" },
  { value: "ev-charger", label: "EV Charger Installer" },
  { value: "home-performance", label: "Home Performance" },
  { value: "hers-rater", label: "HERS Rater" },
] as const;

const CERTIFICATIONS = [
  { value: "BPI", label: "BPI Certified" },
  { value: "NABCEP", label: "NABCEP (Solar)" },
  { value: "EPA608", label: "EPA 608" },
  { value: "EPA-LEAD-RRP", label: "EPA Lead RRP" },
  { value: "RESNET-HERS", label: "RESNET HERS" },
  { value: "ASHRAE", label: "ASHRAE" },
  { value: "Mitsubishi-Diamond", label: "Mitsubishi Diamond Contractor" },
  { value: "Daikin-Comfort-Pro", label: "Daikin Comfort Pro" },
  { value: "Carrier-Factory-Auth", label: "Carrier Factory Authorized" },
] as const;

export default function ContractorApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<"info" | "form" | "success">("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [serviceArea, setServiceArea] = useState<ServiceArea | null>(null);
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [mhicLicense, setMhicLicense] = useState("");
  const [hvacLicense, setHvacLicense] = useState("");
  const [electricalLicense, setElectricalLicense] = useState("");
  const [plumbingLicense, setPlumbingLicense] = useState("");
  const [wsscLicense, setWsscLicense] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [meaParticipating, setMeaParticipating] = useState(false);

  async function checkAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      return;
    }
    setIsLoggedIn(true);
    setStep("form");
  }

  function toggleCategory(value: string) {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }

  function toggleCert(value: string) {
    setCertifications((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!serviceArea) {
      setError("Please choose a service area");
      setLoading(false);
      return;
    }
    if (serviceArea.kind === "counties" && serviceArea.countyIds.length === 0) {
      setError("Pick at least one county for your service area");
      setLoading(false);
      return;
    }

    if (categories.length === 0) {
      setError("Please select at least one service category");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/contractors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          categories,
          serviceArea,
          bio: bio || undefined,
          website: website || undefined,
          phone: phone || undefined,
          mhicLicense: mhicLicense || undefined,
          hvacLicense: hvacLicense || undefined,
          electricalLicense: electricalLicense || undefined,
          plumbingLicense: plumbingLicense || undefined,
          wsscLicense: wsscLicense || undefined,
          certifications,
          meaParticipating,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit application");
        setLoading(false);
        return;
      }

      setStep("success");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Success State ─────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Application Submitted!
          </h1>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your contractor application is under review. We&apos;ll verify your
            licenses and notify you once approved — typically within 2 business
            days.
          </p>
          <Link href="/dashboard/contractor" className="btn-primary inline-block py-3 px-6">
            Go to Contractor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ─── Info/Landing State ────────────────────────────────────────────────────
  if (step === "info") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="section-title">Apply as a Contractor</h1>
          <p className="section-subtitle">
            Join GreenBroker and connect with homeowners seeking energy efficiency
            solutions in Rockville, MD
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Verification Requirements
            </h3>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span><strong>MHIC License</strong> or equivalent state contractor license</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span><strong>Trade License</strong> in your specialized area</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span><strong>$500K Insurance</strong> minimum liability coverage</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                <span><strong>Background Check</strong> verification</span>
              </li>
            </ul>
          </div>

          <div className="card bg-brand-50">
            <h3 className="text-lg font-semibold text-brand-900 mb-4">
              GreenBroker Quality Tiers
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-brand-700">Verified</h4>
                <p className="text-brand-600">
                  Meets all basic verification requirements. Access to homeowner
                  leads in your service area.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-brand-700">Preferred</h4>
                <p className="text-brand-600">
                  Verified + customer reviews and advanced analytics. Higher
                  visibility in contractor search.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-brand-700">Elite</h4>
                <p className="text-brand-600">
                  Preferred + dedicated account support. Featured placement and
                  priority lead access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>

          {isLoggedIn === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
              You need a contractor account to apply.{" "}
              <Link href="/auth/signup" className="font-semibold underline hover:text-amber-900">
                Sign up here
              </Link>{" "}
              and select &quot;Contractor&quot; as your account type, then come back to apply.
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Fill out your business details, licenses, and service area to start
            receiving qualified leads.
          </p>
          <button onClick={checkAuth} className="btn-primary py-3 px-8">
            Start Application
          </button>
        </div>
      </div>
    );
  }

  // ─── Application Form ──────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Contractor Application</h1>
        <p className="section-subtitle">
          Complete the form below. Fields marked with * are required.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Business Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                minLength={2}
                maxLength={200}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Your business or company name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="(301) 555-0123"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="https://yourbusiness.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Bio / Description
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                placeholder="Tell homeowners about your business, experience, and specialties..."
              />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/1000</p>
            </div>
          </div>
        </div>

        {/* Service Categories */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Service Categories *
          </h2>
          <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  categories.includes(cat.value)
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-brand-400"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Service Area */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Service Area *
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Tell us where you operate. Pick whichever option matches how you
            already think about your coverage — state-wide, a list of counties,
            or a named metro region.
          </p>
          <ServiceAreaPicker value={serviceArea} onChange={setServiceArea} />
        </div>

        {/* Licenses */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Licenses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                MHIC License #
              </label>
              <input
                type="text"
                value={mhicLicense}
                onChange={(e) => setMhicLicense(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g. 12345"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                HVAC License #
              </label>
              <input
                type="text"
                value={hvacLicense}
                onChange={(e) => setHvacLicense(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Electrical License #
              </label>
              <input
                type="text"
                value={electricalLicense}
                onChange={(e) => setElectricalLicense(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Plumbing License #
              </label>
              <input
                type="text"
                value={plumbingLicense}
                onChange={(e) => setPlumbingLicense(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                WSSC License #
              </label>
              <input
                type="text"
                value={wsscLicense}
                onChange={(e) => setWsscLicense(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Certifications
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CERTIFICATIONS.map((cert) => (
              <button
                key={cert.value}
                type="button"
                onClick={() => toggleCert(cert.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  certifications.includes(cert.value)
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-brand-400"
                }`}
              >
                {cert.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="mea"
              checked={meaParticipating}
              onChange={(e) => setMeaParticipating(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="mea" className="text-sm text-gray-700">
              MEA (Maryland Energy Administration) participating contractor
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3 px-8 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          <button
            type="button"
            onClick={() => setStep("info")}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
