import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { COMMERCIAL_DEMO_BUILDING_ID } from "@/lib/commercial/demo-data";
import { fetchEntropyJson } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sample Building Dashboard",
};

type DemoBuilding = { id: string; name: string };

export default async function CommercialDemoPage() {
  let demo: DemoBuilding | null = null;
  try {
    demo = await fetchEntropyJson<DemoBuilding>("/demo/sample-school");
  } catch (err) {
    console.error("[commercial/demo] fetch failed:", err);
  }
  if (demo) {
    redirect(`/commercial/buildings/${demo.id}`);
  }
  redirect(`/commercial/buildings/${COMMERCIAL_DEMO_BUILDING_ID}`);
}
