import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchEntropyJson } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";

type DemoBuilding = { id: string; name: string };

export default async function CommercialDemoPage() {
  try {
    const demo = await fetchEntropyJson<DemoBuilding>("/demo/sample-school");
    redirect(`/commercial/buildings/${demo.id}`);
  } catch {
    // fallthrough to the error UI
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-gray-900">Demo not available</h1>
      <p className="mt-3 text-gray-600">
        Our sample school dashboard isn&apos;t reachable right now. The commercial
        API may still be booting — try again in a moment.
      </p>
      <Link href="/commercial" className="btn-primary mt-6 inline-block">
        Back to commercial home →
      </Link>
    </main>
  );
}
