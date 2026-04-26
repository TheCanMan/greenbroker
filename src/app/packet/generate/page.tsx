import Link from "next/link";
import { REBATES, getRebateById } from "@/lib/data/rebates";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID, UTILITY_BY_ID } from "@/lib/geo/registry";
import { PrintButton } from "./print-button";

interface PageProps {
  searchParams: Promise<{
    program?: string;
    upgrade?: string;
    zip?: string;
    electric?: string;
    gas?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    account?: string;
  }>;
}

const TODAY = new Date().toISOString().slice(0, 10);

export default async function PacketGeneratePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const program = sp.program ? getRebateById(sp.program) : REBATES.find((r) => r.id === "empower-electrification");
  const upgrade = sp.upgrade ?? program?.applicableCategories?.[0] ?? "Energy upgrade";
  const resolved = sp.zip ? resolveZip(sp.zip) : null;
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;
  const electricUtility = sp.electric ? UTILITY_BY_ID.get(sp.electric) : null;
  const gasUtility = sp.gas ? UTILITY_BY_ID.get(sp.gas) : null;

  const docs = program?.documentsNeeded ?? [
    "Proof of address and utility account number",
    program?.requiresAudit && "BPI-certified Home Performance assessment ($100)",
    program?.requiresMEAContractor && "MEA-Participating contractor invoice",
    program?.incomeQualified && "Income qualification documentation (most recent tax return)",
    "Equipment model number and AHRI certificate (where applicable)",
    "Photos of installation (before + after)",
    "Final invoice from contractor",
  ].filter((x): x is string => Boolean(x));

  const submissionInstructions: string[] =
    program?.applicationTiming === "contractor_submitted"
      ? [
          "Your contractor submits this rebate on your behalf — confirm they're MEA-Participating before signing the contract.",
          `Verify the program contractor list at: ${program.url}`,
        ]
      : program?.applicationTiming === "before_install"
        ? [
            "Submit this rebate application BEFORE installation begins. Programs that require pre-approval will reject post-install applications.",
            `Apply at: ${program?.url ?? "the program portal"}`,
          ]
        : program?.applicationTiming === "instant"
          ? [
              "This rebate is applied at point-of-sale by participating retailers. Bring this packet when purchasing.",
              `Confirm participating retailers at: ${program?.url ?? "the program portal"}`,
            ]
          : [
              "Submit within the program's post-install window (typically 60–90 days from invoice date).",
              `Apply at: ${program?.url ?? "the program portal"}`,
            ];

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .packet-page { box-shadow: none !important; border: none !important; padding: 0 !important; }
          @page { margin: 0.5in; }
        }
        @media screen {
          .packet-page { background: white; max-width: 8.5in; margin: 2rem auto; padding: 1in; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border-radius: 12px; }
          body { background: #f3f4f6; }
        }
      `}</style>

      {/* Action bar (hidden in print) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/packet" className="text-sm text-gray-600 hover:text-gray-900 underline">
          ← Back to packet builder
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Use your browser&apos;s &quot;Save as PDF&quot; option to download.
          </span>
          <PrintButton />
        </div>
      </div>

      {/* Packet */}
      <div className="packet-page text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
        {/* Header */}
        <header className="border-b-2 border-gray-900 pb-4 mb-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tracking-tight">🌿 GreenBroker</div>
            <div className="text-xs text-gray-500 mt-1">
              Rebate packet · Generated {TODAY}
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>greenbroker.oskoui-amin.workers.dev</div>
            <div className="mt-1">Status: <strong className="text-amber-700">Draft — review before submitting</strong></div>
          </div>
        </header>

        <h1 className="text-3xl font-bold mb-1">Rebate Application Packet</h1>
        <p className="text-lg text-gray-700 mb-6">
          For: <strong>{upgrade}</strong>
        </p>

        {/* Program */}
        <Section title="Rebate Program">
          <table className="w-full text-sm">
            <tbody>
              <Row k="Program name" v={program?.name ?? "—"} />
              <Row k="Administrator" v={program?.administrator ?? "—"} />
              <Row k="Maximum amount" v={program?.maxAmount ? `$${program.maxAmount.toLocaleString()}` : "—"} />
              <Row
                k="Application timing"
                v={(program?.applicationTiming ?? "after install").replaceAll("_", " ")}
              />
              <Row k="Income-qualified?" v={program?.incomeQualified ? "Yes" : "No"} />
              <Row k="Requires audit?" v={program?.requiresAudit ? "Yes — BPI-certified" : "No"} />
              <Row
                k="Requires MEA-Participating contractor?"
                v={program?.requiresMEAContractor ? "Yes" : "No"}
              />
              <Row k="Last verified" v={program?.lastVerified ?? TODAY} />
              <Row k="Source" v={program?.url ?? "—"} mono />
            </tbody>
          </table>
        </Section>

        {/* Homeowner */}
        <Section title="Homeowner Information">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Field label="Name" value={sp.name} />
            <Field label="Phone" value={sp.phone} />
            <Field label="Email" value={sp.email} />
            <Field label="Utility account #" value={sp.account} />
            <Field label="Service address" value={sp.address} wide />
            <Field label="ZIP code" value={sp.zip} />
            <Field label="County" value={county?.name} />
          </div>
        </Section>

        {/* Utility */}
        <Section title="Utility & Service Information">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Field
              label="Electric utility"
              value={electricUtility?.name ?? "—"}
            />
            <Field label="Gas utility" value={gasUtility?.name ?? "All-electric"} />
            <Field label="Account holder name" value={sp.name} />
            <Field label="Service start date" value="" />
          </div>
        </Section>

        {/* Documents needed */}
        <Section title="Required Documents Checklist">
          <ul className="space-y-2 text-sm">
            {docs.map((d, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="inline-block w-4 h-4 border-2 border-gray-900 mt-0.5 flex-shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Contractor (if required) */}
        {program?.requiresMEAContractor && (
          <Section title="Contractor Information (required)">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <Field label="Business name" value="" />
              <Field label="MHIC license #" value="" />
              <Field label="Trade license # (HVAC / electrical / plumbing)" value="" wide />
              <Field label="MEA-Participating Contractor ID" value="" />
              <Field label="Insurance verified ($500K min)" value="" />
            </div>
            <p className="text-xs text-gray-500 italic mt-3">
              Verify any contractor at <strong>labor.maryland.gov/pq/</strong> before signing.
              MEA-Participating status is required for this rebate — ask the contractor for their
              ID and confirm at energy.maryland.gov.
            </p>
          </Section>
        )}

        {/* Submission */}
        <Section title="Submission Instructions">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            {submissionInstructions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
          <p className="mb-2">
            <strong>Disclaimer:</strong> This packet was prepared by GreenBroker from your intake
            and program rules current as of {program?.lastVerified ?? TODAY}. Rebate program
            terms can change without notice. Verify availability and eligibility with the
            program administrator before purchase or installation.
          </p>
          <p>
            GreenBroker is not affiliated with PEPCO, Montgomery County, MEA, or any other
            program administrator. We prepare paperwork — your application and contract are
            between you and the program/contractor.
          </p>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-base font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-1.5 pr-4 text-gray-600 align-top w-1/3">{k}</td>
      <td className={`py-1.5 ${mono ? "font-mono text-xs break-all" : "font-semibold"}`}>{v}</td>
    </tr>
  );
}

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">{label}</div>
      <div
        className={`border-b border-gray-400 min-h-[1.4em] ${value ? "font-semibold" : "text-gray-300"}`}
      >
        {value || "_____________________________"}
      </div>
    </div>
  );
}
