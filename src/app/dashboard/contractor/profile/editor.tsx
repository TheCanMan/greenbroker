"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  { value: "BPI", label: "BPI" },
  { value: "NABCEP", label: "NABCEP" },
  { value: "EPA608", label: "EPA 608" },
  { value: "EPA-LEAD-RRP", label: "EPA Lead RRP" },
  { value: "RESNET-HERS", label: "RESNET HERS" },
  { value: "ASHRAE", label: "ASHRAE" },
  { value: "Mitsubishi-Diamond", label: "Mitsubishi Diamond" },
  { value: "Daikin-Comfort-Pro", label: "Daikin Comfort Pro" },
  { value: "Carrier-Factory-Auth", label: "Carrier Factory Auth" },
] as const;

export interface ContractorProfileInitial {
  businessName: string;
  categories: string[];
  serviceZips: string[];
  bio: string;
  website: string;
  phone: string;
  mhicLicense: string;
  hvacLicense: string;
  electricalLicense: string;
  plumbingLicense: string;
  wsscLicense: string;
  certifications: string[];
  meaParticipating: boolean;
}

export function ContractorProfileEditor({ initial }: { initial: ContractorProfileInitial }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [businessName, setBusinessName] = useState(initial.businessName);
  const [categories, setCategories] = useState<string[]>(initial.categories);
  const [serviceZips, setServiceZips] = useState(initial.serviceZips.join(", "));
  const [bio, setBio] = useState(initial.bio);
  const [website, setWebsite] = useState(initial.website);
  const [phone, setPhone] = useState(initial.phone);
  const [mhicLicense, setMhicLicense] = useState(initial.mhicLicense);
  const [hvacLicense, setHvacLicense] = useState(initial.hvacLicense);
  const [electricalLicense, setElectricalLicense] = useState(initial.electricalLicense);
  const [plumbingLicense, setPlumbingLicense] = useState(initial.plumbingLicense);
  const [wsscLicense, setWsscLicense] = useState(initial.wsscLicense);
  const [certifications, setCertifications] = useState<string[]>(initial.certifications);
  const [meaParticipating, setMeaParticipating] = useState(initial.meaParticipating);

  function toggleCategory(value: string) {
    setCategories((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  }
  function toggleCert(value: string) {
    setCertifications((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const zipArray = serviceZips
      .split(/[\s,]+/)
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z));

    try {
      const res = await fetch("/api/contractors/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          categories,
          serviceZips: zipArray,
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
        setError(data.error || "Failed to update profile");
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          Profile updated successfully.
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
        <div className="space-y-4">
          <FormField label="Business Name *">
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              className="form-input"
            />
          </FormField>
          <FormField label="Phone">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
          </FormField>
          <FormField label="Website">
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="form-input" placeholder="https://" />
          </FormField>
          <FormField label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1000}
              rows={3}
              className="form-input resize-none"
            />
          </FormField>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Categories *</h2>
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

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Area (ZIP Codes) *</h2>
        <textarea
          value={serviceZips}
          onChange={(e) => setServiceZips(e.target.value)}
          rows={2}
          required
          className="form-input resize-none"
          placeholder="20850, 20851, 20852..."
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Licenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="MHIC License #">
            <input type="text" value={mhicLicense} onChange={(e) => setMhicLicense(e.target.value)} className="form-input" />
          </FormField>
          <FormField label="HVAC License #">
            <input type="text" value={hvacLicense} onChange={(e) => setHvacLicense(e.target.value)} className="form-input" />
          </FormField>
          <FormField label="Electrical License #">
            <input type="text" value={electricalLicense} onChange={(e) => setElectricalLicense(e.target.value)} className="form-input" />
          </FormField>
          <FormField label="Plumbing License #">
            <input type="text" value={plumbingLicense} onChange={(e) => setPlumbingLicense(e.target.value)} className="form-input" />
          </FormField>
          <FormField label="WSSC License #">
            <input type="text" value={wsscLicense} onChange={(e) => setWsscLicense(e.target.value)} className="form-input" />
          </FormField>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h2>
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
            MEA participating contractor
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={loading} className="btn-primary py-3 px-8 disabled:opacity-50">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid rgb(209, 213, 219);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }
        .form-input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px rgb(34, 197, 94);
        }
      `}</style>
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
