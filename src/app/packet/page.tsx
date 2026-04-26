import Link from "next/link";
import { PacketBuilder } from "./packet-builder";

interface PageProps {
  searchParams: Promise<{
    upgrade?: string;
    program?: string;
    zip?: string;
    electric?: string;
    gas?: string;
  }>;
}

export default async function PacketPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <h1 className="section-title">Rebate packet generator</h1>
        <p className="section-subtitle">
          Pick a program, fill in your information, generate a printable PDF packet to
          submit yourself or hand to your contractor. We don&apos;t auto-submit yet — your
          eyes on it before anything goes out.
        </p>
      </div>

      <PacketBuilder
        initial={{
          upgrade: sp.upgrade,
          programId: sp.program,
          zip: sp.zip,
          electric: sp.electric,
          gas: sp.gas,
        }}
      />

      <p className="text-xs text-gray-500 mt-10 leading-relaxed max-w-3xl">
        Future phase: assisted utility-portal submission with your authorization. For now
        the packet is a printable PDF — open it, save with your browser&apos;s &quot;Save
        as PDF&quot; option, then submit at the program portal yourself.{" "}
        <Link href="/dashboard/rebates" className="underline font-medium">
          Track applications in your dashboard
        </Link>
        .
      </p>
    </div>
  );
}
