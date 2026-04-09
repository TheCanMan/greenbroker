import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/calculations/savings";

export default async function HomeownerDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Redirect contractors to contractor dashboard
  if (profile?.role === "CONTRACTOR") {
    redirect("/dashboard/contractor");
  }

  // Get assessments
  const { data: assessments } = await supabase
    .from("home_assessments")
    .select("*")
    .eq("profile_id", profile?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  const latestAssessment = assessments?.[0];
  const firstName = profile?.first_name ?? user.email?.split("@")[0] ?? "there";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Your energy efficiency dashboard — Rockville, MD
        </p>
      </div>

      {latestAssessment ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Key metrics */}
          {[
            {
              label: "Current annual energy cost",
              value: formatCurrency(latestAssessment.calc_annual_energy_cost ?? 3809),
              sub: "electricity + gas",
              icon: "⚡",
              color: "text-gray-900",
            },
            {
              label: "Potential annual savings",
              value: formatCurrency(latestAssessment.calc_savings_potential ?? 3500),
              sub: "with recommended upgrades",
              icon: "💰",
              color: "text-brand-600",
            },
            {
              label: "Available rebates",
              value: formatCurrency(latestAssessment.calc_available_rebates ?? 15000),
              sub: "EmPOWER + Electrify MC + more",
              icon: "🎁",
              color: "text-brand-600",
            },
          ].map((stat, i) => (
            <div key={i} className="card p-6">
              <div className="text-2xl mb-3">{stat.icon}</div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm font-semibold text-gray-700 mt-1">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      ) : (
        /* No assessment yet */
        <div className="card p-10 text-center mb-8">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No assessment yet</h2>
          <p className="text-gray-500 mb-6">
            Complete a 5-minute home intake to get your personalized energy plan
            with savings estimates and rebate eligibility.
          </p>
          <Link href="/intake" className="btn-primary">
            Start My Assessment →
          </Link>
        </div>
      )}

      {/* Recommended actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Recommended actions</h2>
          <div className="space-y-3">
            {[
              {
                icon: "💡",
                title: "Switch to LEDs",
                detail: "$100 investment → $485/year savings",
                done: false,
                href: "/products",
              },
              {
                icon: "☀️",
                title: "Get solar quotes",
                detail: "9.4-yr payback, MD SREC income",
                done: false,
                href: "/contractors?category=solar-installer",
              },
              {
                icon: "💧",
                title: "Heat pump water heater",
                detail: "$2,100 available rebates now",
                done: false,
                href: "/products/water-heaters",
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 group transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 group-hover:text-brand-700">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-500">{item.detail}</div>
                </div>
                <span className="text-gray-400 group-hover:text-brand-600 transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Rebate tracker</h2>
          <div className="space-y-3">
            {[
              { name: "EmPOWER Electrification", max: 15000, status: "available" },
              { name: "Electrify MC", max: 2500, status: "available" },
              { name: "PEPCO HPWH", max: 1600, status: "available" },
              { name: "MSAP Solar", max: 7500, status: "income-qualified" },
              { name: "HEEHRA", max: 14000, status: "pending" },
            ].map((rebate, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      rebate.status === "available"
                        ? "bg-green-500"
                        : rebate.status === "pending"
                        ? "bg-gray-300"
                        : "bg-blue-400"
                    }`}
                  />
                  <span className="text-sm text-gray-700">{rebate.name}</span>
                  {rebate.status === "pending" && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-brand-700">
                  {formatCurrency(rebate.max)}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/rebates"
            className="block text-center text-brand-600 font-semibold text-sm mt-4 hover:text-brand-700"
          >
            View all rebates →
          </Link>
        </div>
      </div>

      {/* Assessments history */}
      {assessments && assessments.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">
            Your assessments ({assessments.length})
          </h2>
          <div className="space-y-3">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    {a.square_footage?.toLocaleString()} sq ft · Built {a.year_built} · ZIP {a.zip}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  {a.calc_annual_energy_cost && (
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(a.calc_annual_energy_cost)}/yr
                    </div>
                  )}
                  {a.calc_available_rebates && (
                    <div className="text-xs text-brand-600">
                      {formatCurrency(a.calc_available_rebates)} in rebates
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
