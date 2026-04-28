"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/plan", label: "My Energy Plan" },
  { href: "/rebates", label: "Rebates" },
  { href: "/contractor-quotes", label: "Contractor Quotes" },
  { href: "/products", label: "Product Rankings" },
  { href: "/energy-supplier-compare", label: "Supplier Compare" },
  { href: "/learn", label: "Learn" },
  { href: "/commercial", label: "Commercial", variant: "commercial" },
  { href: "/intake", label: "Check My Rebates", highlight: true },
];

interface NavHeaderProps {
  firstName?: string | null;
  isLoggedIn?: boolean;
}

export function NavHeader({ firstName, isLoggedIn }: NavHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-brand-700 group-hover:text-brand-600 transition-colors">
              GreenBroker
            </span>
            <span className="hidden lg:block text-xs text-gray-400 font-medium">
              Montgomery County, MD
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 mx-4">
            {NAV_LINKS.map((link) =>
              link.highlight ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="ml-2 btn-primary text-sm py-2 px-4"
                >
                  {link.label}
                </Link>
              ) : link.variant === "commercial" ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="ml-2 btn-commercial text-sm py-2 px-4"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Desktop auth section */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-brand-700 transition-colors"
                >
                  {firstName ? `Hi, ${firstName}` : "My Account"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors px-3 py-2 rounded-lg hover:bg-brand-50"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={
                  link.highlight
                    ? "block w-full text-center btn-primary text-sm py-3 px-4 mt-2"
                    : link.variant === "commercial"
                      ? "block w-full text-center btn-commercial text-sm py-3 px-4 mt-2"
                      : "block px-4 py-3 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                }
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    {firstName ? `Hi, ${firstName}` : "My Account"}
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                    className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
