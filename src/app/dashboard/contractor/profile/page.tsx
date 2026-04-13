import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";

export default async function ContractorProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Contractor Profile</h1>
        <p className="section-subtitle">
          Set up your business profile, certifications, and service area
        </p>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-brand-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-600">
            Complete your contractor profile to start receiving qualified leads.
          </p>
        </div>
      </div>
    </div>
  );
}
