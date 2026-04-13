import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AssessmentsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Home Assessments</h1>
        <p className="section-subtitle">
          Track your energy assessments and recommended upgrades
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-gray-600 mb-6">
            Start your first energy assessment to get personalized recommendations
            for your home.
          </p>
          <Link href="/intake" className="btn-primary">
            Start an Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
