import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ upgrade?: string; rebate?: string }>;
}

const PACKET_OUTPUTS = [
  {
    title: "Pre-filled application summary",
    body: "Every field the rebate program asks for, populated from your intake — name, address, account number, equipment model, install date, contractor info.",
    icon: "📝",
  },
  {
    title: "Document checklist",
    body: "What's required (BPI audit report, AHRI certificate, contractor invoice, photos), what's optional, and what's still missing from your account.",
    icon: "✅",
  },
  {
    title: "Submission instructions",
    body: "Whether the program submits via online portal, mail, or contractor portal — with the exact URL or address.",
    icon: "📬",
  },
  {
    title: "Homeowner + contractor packets",
    body: "Two PDFs: one you keep for your records, one you forward to your contractor with the equipment requirements.",
    icon: "📄",
  },
];

const STATUS_FLOW = [
  { status: "Draft", body: "We've filled what we can from your intake." },
  { status: "Missing info", body: "Specific fields blocked — we'll tell you exactly which." },
  { status: "Ready for review", body: "Open the PDF, verify, sign where indicated." },
  { status: "Submitted manually", body: "You marked it sent. We track the timeline for follow-up." },
];

export default async function PacketPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const upgrade = sp.upgrade ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Rebate packet generator</h1>
        <p className="section-subtitle">
          {upgrade
            ? `Prepare your rebate paperwork for ${upgrade.toLowerCase()}.`
            : "Pre-filled rebate paperwork. Review, sign, submit. We don't auto-submit yet — your eyes on it before anything goes out."}
        </p>
      </div>

      <div className="card p-5 mb-8 bg-amber-50 border-amber-200">
        <h2 className="font-bold text-amber-900 mb-2">In active development</h2>
        <p className="text-sm text-amber-800 leading-relaxed">
          The packet generator is being built. Today the data foundation works:
          intake → location-aware rebate matching → eligibility scoring → status
          tracking. The PDF generation + portal-submission instructions ship next.
        </p>
        <p className="text-sm text-amber-800 mt-2">
          In the meantime, head to{" "}
          <Link href="/dashboard/rebates" className="underline font-semibold">
            your rebate dashboard
          </Link>{" "}
          to see which programs you qualify for and track application status.
        </p>
      </div>

      {/* What goes in / out */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">What you&apos;ll get</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
        {PACKET_OUTPUTS.map((p) => (
          <div key={p.title} className="card p-5">
            <div className="text-3xl mb-3">{p.icon}</div>
            <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      {/* Status pipeline */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Packet status pipeline</h2>
      <div className="card p-5 mb-12">
        <ol className="space-y-4">
          {STATUS_FLOW.map((s, i) => (
            <li key={s.status} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center font-bold text-sm flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{s.status}</div>
                <div className="text-sm text-gray-600">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-xs text-gray-500 mt-5 italic">
          Future phase: assisted portal submission with your authorization. We&apos;re
          deliberately not building autonomous form-fill yet.
        </p>
      </div>

      <div className="card p-5 bg-brand-50 border-brand-200 text-center">
        <p className="text-sm text-brand-900 mb-3">
          Get the data foundation in place — packet generation pulls from your saved intake.
        </p>
        <Link href="/intake" className="btn-primary inline-block">
          Run the intake →
        </Link>
      </div>
    </div>
  );
}
