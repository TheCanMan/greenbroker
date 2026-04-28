import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/supabase/server";
import { TagQueueClient } from "@/components/commercial/admin/TagQueueClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Staff Review Queue",
};

export default async function CommercialTagQueuePage() {
  const profile = await getUserProfile();
  if (!profile) {
    redirect("/auth/login?next=/commercial/admin/tag-queue");
  }
  const canReview = profile.role === "ADMIN";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Tag-mapper review queue
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Points the tag-mapper couldn&apos;t confidently classify. Confirm a
          normalized name, kind, and unit — the building&apos;s analytics
          re-run automatically.
        </p>
      </div>
      {canReview ? (
        <TagQueueClient />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Your account is signed in, but it does not have staff review access.
        </div>
      )}
    </main>
  );
}
