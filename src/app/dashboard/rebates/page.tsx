import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RebatesPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">My Rebates</h1>
        <p className="section-subtitle">
          Track rebate applications and claim status
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-600 mb-6">
            Browse available rebate programs and track your applications in one place.
          </p>
          <Link href="/rebates" className="btn-primary">
            Browse Rebate Programs
          </Link>
        </div>
      </div>
    </div>
  );
}
