"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { findRebatesFor } from "@/lib/geo/eligibility";
import { REBATES } from "@/lib/data/rebates";
import { GREENBROKER_PLAN_STORAGE_KEY } from "@/lib/residential/agents";
import type { ResidentialIntakeSnapshot } from "@/lib/residential/schemas";
import type { CountyId, StateCode } from "@/lib/geo/types";

interface InitialSelection {
  upgrade?: string;
  programId?: string;
  zip?: string;
  electric?: string;
  gas?: string;
}

export function PacketBuilder({ initial }: { initial: InitialSelection }) {
  // Read snapshot from sessionStorage (set by /intake on submit) so we can
  // pre-fill the homeowner fields without round-tripping the database.
  const [snapshot, setSnapshot] = useState<ResidentialIntakeSnapshot | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GREENBROKER_PLAN_STORAGE_KEY);
      if (raw) setSnapshot(JSON.parse(raw) as ResidentialIntakeSnapshot);
    } catch {
      /* noop */
    }
  }, []);

  // Form state
  const [zip, setZip] = useState(initial.zip ?? "");
  const [electric, setElectric] = useState(initial.electric ?? "");
  const [gas, setGas] = useState(initial.gas ?? "");
  const [programId, setProgramId] = useState(initial.programId ?? "");
  const [upgrade, setUpgrade] = useState(initial.upgrade ?? "");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState("");

  // Pull defaults from snapshot once it loads.
  useEffect(() => {
    if (!snapshot) return;
    if (!zip && snapshot.zip) setZip(snapshot.zip);
    if (!electric && snapshot.electricUtilityId) setElectric(snapshot.electricUtilityId);
    if (!gas && snapshot.gasUtilityId) setGas(snapshot.gasUtilityId);
    if (!address && snapshot.address) setAddress(snapshot.address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  const resolved = zip.length === 5 ? resolveZip(zip) : null;
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;

  // Eligible rebates given location.
  const eligibleRebates = useMemo(() => {
    if (!resolved) return [];
    return findRebatesFor(REBATES, {
      state: resolved.state as StateCode,
      countyId: resolved.countyId as CountyId,
      zip,
      electricUtilityId: electric || undefined,
      gasUtilityId: gas || undefined,
    });
  }, [resolved, electric, gas, zip]);

  const selectedProgram = REBATES.find((r) => r.id === programId);
  const docs = selectedProgram?.documentsNeeded ?? [];

  // Status: derive from how complete the form is.
  const ready = Boolean(zip && electric && programId && name && address);
  const status = !programId
    ? "draft"
    : !ready
      ? "missing_info"
      : "ready_for_review";

  // Build the printable-packet URL.
  const params = new URLSearchParams();
  if (programId) params.set("program", programId);
  if (upgrade) params.set("upgrade", upgrade);
  if (zip) params.set("zip", zip);
  if (electric) params.set("electric", electric);
  if (gas) params.set("gas", gas);
  if (name) params.set("name", name);
  if (address) params.set("address", address);
  if (phone) params.set("phone", phone);
  if (email) params.set("email", email);
  if (account) params.set("account", account);
  const generateUrl = `/packet/generate?${params.toString()}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      {/* Form */}
      <div className="space-y-6">
        {snapshot && (
          <div className="card p-3 text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
            ✓ Pre-filled from your most recent intake.
          </div>
        )}

        {/* Step 1: Location */}
        <Section title="1. Where are you?" complete={Boolean(resolved)}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="ZIP">
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className={inputCls}
              />
              {county && (
                <p className="text-xs text-emerald-700 mt-1">{county.name}</p>
              )}
            </Field>
            <Field label="Electric utility">
              <input
                type="text"
                value={electric}
                onChange={(e) => setElectric(e.target.value)}
                placeholder="pepco-md"
                className={inputCls}
              />
            </Field>
            <Field label="Gas utility (optional)">
              <input
                type="text"
                value={gas}
                onChange={(e) => setGas(e.target.value)}
                placeholder="washington-gas-md"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* Step 2: Pick program */}
        <Section title="2. Pick the rebate program" complete={Boolean(programId)}>
          {eligibleRebates.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Enter a ZIP above to see programs you qualify for.
            </p>
          ) : (
            <div className="space-y-2">
              {eligibleRebates.map((r) => (
                <label
                  key={r.id}
                  className={`block card p-3 cursor-pointer border-2 ${
                    programId === r.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="program"
                    checked={programId === r.id}
                    onChange={() => setProgramId(r.id)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{r.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {r.administrator}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold text-brand-700">
                        Up to ${r.maxAmount.toLocaleString()}
                      </div>
                      {r.requiresAudit && (
                        <div className="text-amber-700">Requires audit</div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {selectedProgram && (
            <Field label="Upgrade type" wide>
              <input
                type="text"
                value={upgrade}
                onChange={(e) => setUpgrade(e.target.value)}
                placeholder={selectedProgram.applicableCategories[0] ?? "Heat pump water heater"}
                className={inputCls}
              />
            </Field>
          )}
        </Section>

        {/* Step 3: Homeowner info */}
        <Section title="3. Your information" complete={Boolean(name && address)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name *">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                autoComplete="name"
              />
            </Field>
            <Field label="Service address *" wide>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Rockville, MD"
                className={inputCls}
                autoComplete="street-address"
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                autoComplete="tel"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                autoComplete="email"
              />
            </Field>
            <Field label="Utility account #">
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* CTAs */}
        <div className="card p-5 sticky bottom-4 bg-white">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs uppercase font-semibold text-gray-500">Status</div>
              <div className="font-bold text-gray-900 capitalize">
                {status.replaceAll("_", " ")}
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={generateUrl}
                target="_blank"
                rel="noopener"
                className={`btn-primary text-sm py-2 px-4 ${
                  !programId ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                Generate packet →
              </a>
            </div>
          </div>
          {!programId && (
            <p className="text-xs text-gray-500 mt-3">
              Pick a rebate program above to enable packet generation.
            </p>
          )}
        </div>
      </div>

      {/* Sidebar: docs checklist */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-3">Document checklist</h3>
          {!selectedProgram ? (
            <p className="text-xs text-gray-500 italic">
              Pick a rebate program to see what documents you&apos;ll need.
            </p>
          ) : docs.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              No specific documents listed. We&apos;ll include standard items in the packet.
            </p>
          ) : (
            <ul className="text-xs space-y-2">
              {docs.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <span className="inline-block w-3 h-3 border border-gray-400 rounded mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{d}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 bg-amber-50 border-amber-200">
          <h3 className="font-bold text-amber-900 mb-2 text-sm">What we don&apos;t do (yet)</h3>
          <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
            <li>Auto-submit to the utility portal</li>
            <li>E-sign the application</li>
            <li>Authorize a contractor on your behalf</li>
          </ul>
          <p className="text-xs text-amber-700 mt-3">
            Generate the packet, review it, then submit at the program portal yourself or
            hand it to your MEA-Participating contractor.
          </p>
        </div>

        <div className="text-xs text-gray-500">
          <Link href="/intake" className="text-brand-700 underline">
            Run the intake
          </Link>{" "}
          first to auto-fill more fields.
        </div>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function Section({
  title,
  complete,
  children,
}: {
  title: string;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <header className="flex items-center gap-2 mb-4">
        <span
          className={`w-5 h-5 rounded-full grid place-items-center text-xs font-bold ${
            complete
              ? "bg-emerald-500 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {complete ? "✓" : "·"}
        </span>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`block ${wide ? "col-span-2" : ""}`}>
      <span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
