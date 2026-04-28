import type { Metadata } from "next";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { getUser, getUserProfile } from "@/lib/supabase/server";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GreenBroker — TurboTax for home energy savings",
  description:
    "Find every rebate you qualify for, calculate net project cost, compare safe energy supplier options, and prepare rebate paperwork from one simple intake form. Currently piloting in Montgomery County, MD.",
  keywords: [
    "energy efficiency",
    "Montgomery County",
    "Maryland",
    "EmPOWER Maryland",
    "heat pump",
    "solar panels",
    "rebates",
    "PEPCO",
    "electrification",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  let firstName: string | null = null;
  if (user) {
    const profile = await getUserProfile();
    const raw = profile?.first_name ?? user.email?.split("@")[0] ?? null;
    if (raw) firstName = raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  return (
    <html lang="en">
      <body>
        {/* Navigation */}
        <NavHeader firstName={firstName} isLoggedIn={!!user} />

        {/* Main content */}
        <main>{children}</main>

        {/* Footer — intentionally minimal. Top-level pages live in the nav. */}
        <footer className="bg-gray-900 text-gray-400 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌿</span>
                  <span className="text-xl font-bold text-white">GreenBroker</span>
                  <span className="text-xs text-gray-500 ml-2">
                    Montgomery County, MD pilot
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 max-w-md leading-relaxed">
                  Rebate rules change. Always verify availability and eligibility
                  before purchase or installation.
                </p>
              </div>

              <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <Link href="/rebates" className="hover:text-white transition-colors">
                  Rebates
                </Link>
                <Link href="/contractors" className="hover:text-white transition-colors">
                  Contractors
                </Link>
                <Link href="/learn" className="hover:text-white transition-colors">
                  Learn
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </nav>
            </div>

            <div className="border-t border-gray-800 mt-6 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
              <p>© 2026 GreenBroker. Not affiliated with PEPCO, Montgomery County, or MEA.</p>
              <Link
                href="/commercial"
                className="text-gray-500 hover:text-white transition-colors"
              >
                Building owner? See GreenBroker for Commercial →
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
