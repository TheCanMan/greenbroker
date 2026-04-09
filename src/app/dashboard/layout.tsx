import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, getUserProfile } from "@/lib/supabase/server";

const NAV_ITEMS_HOMEOWNER = [
  { href: "/dashboard", label: "My Plan", icon: "📊" },
  { href: "/dashboard/assessments", label: "Assessments", icon: "🏠" },
  { href: "/dashboard/rebates", label: "Rebates", icon: "💰" },
  { href: "/dashboard/contractors", label: "My Contractors", icon: "🔧" },
];

const NAV_ITEMS_CONTRACTOR = [
  { href: "/dashboard/contractor", label: "Overview", icon: "📊" },
  { href: "/dashboard/contractor/leads", label: "Leads", icon: "🎯" },
  { href: "/dashboard/contractor/profile", label: "Profile", icon: "🏢" },
  { href: "/dashboard/contractor/billing", label: "Billing", icon: "💳" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const profile = await getUserProfile();
  const isContractor = profile?.role === "CONTRACTOR";
  const navItems = isContractor ? NAV_ITEMS_CONTRACTOR : NAV_ITEMS_HOMEOWNER;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🌿</span>
                <span className="font-bold text-brand-700">GreenBroker</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {isContractor && (
                <Link
                  href="/dashboard/contractor/billing"
                  className="text-xs font-semibold bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full hover:bg-brand-200 transition-colors"
                >
                  Contractor
                </Link>
              )}
              <div className="text-sm text-gray-600">
                {profile?.first_name ?? user.email?.split("@")[0]}
              </div>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="button"
                  onClick={async () => {
                    "use server";
                    const { createClient } = await import("@/lib/supabase/server");
                    const supabase = await createClient();
                    await supabase.auth.signOut();
                    redirect("/");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
