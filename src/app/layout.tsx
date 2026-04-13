import type { Metadata } from "next";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GreenBroker — Energy Efficiency for Rockville, MD",
  description:
    "Find the best energy-efficient products, compare contractors, and maximize rebates for your Rockville, MD home. Solar, heat pumps, insulation, and more.",
  keywords: [
    "energy efficiency",
    "Rockville MD",
    "EmPOWER Maryland",
    "heat pump",
    "solar panels",
    "rebates",
    "PEPCO",
    "electrification",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Navigation */}
        <NavHeader />

        {/* Main content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🌿</span>
                  <span className="text-xl font-bold text-white">GreenBroker</span>
                </div>
                <p className="text-sm leading-relaxed max-w-sm">
                  Combining Labdoor-style product rankings with an Angi-style contractor
                  marketplace for residential energy efficiency in Rockville, MD (ZIP 20850).
                </p>
                <p className="text-xs mt-4 text-gray-500">
                  Utility rates accurate as of April 2026. Incentive programs subject to change.
                </p>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                  Resources
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/products" className="hover:text-white transition-colors">
                      Product Rankings
                    </Link>
                  </li>
                  <li>
                    <Link href="/calculator" className="hover:text-white transition-colors">
                      Savings Calculator
                    </Link>
                  </li>
                  <li>
                    <Link href="/rebates" className="hover:text-white transition-colors">
                      Rebate Database
                    </Link>
                  </li>
                  <li>
                    <Link href="/contractors" className="hover:text-white transition-colors">
                      Find Contractors
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                  Key Programs
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a
                      href="https://www.pepco.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      PEPCO EmPOWER Maryland
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.electrifymc.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Electrify MC
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://energy.maryland.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Maryland Energy Administration
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.mcgreenbank.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      MC Green Bank
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-xs text-gray-500">
              <p>
                © 2026 GreenBroker. MVP — Rockville, MD (ZIP 20850) pilot. Not affiliated with PEPCO,
                Montgomery County, or MEA. Always verify rebate availability before committing to a project.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
