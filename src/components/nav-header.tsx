"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Top-nav is intentionally tight: 3 public destinations + auth + primary CTA.
// Tools (Plan, Supplier Compare, Product Rankings, Contractor Quotes) are
// accessed in-context from the pages where they belong, not the global nav.
const NAV_LINKS = [
  { href: "/rebates", label: "Rebates" },
  { href: "/contractors", label: "Find Contractors" },
  { href: "/learn", label: "Learn" },
] as const;

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
          </Link>

          {/* Desktop Nav — 3 destinations */}
          <nav className="hidden md:flex items-center gap-1 mx-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: auth + primary CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-700 hover:text-brand-700 transition-colors"
                >
                  {firstName ? `Hi, ${firstName}` : "My account"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors"
              >
                Sign in
              </Link>
            )}
            <Link
              href={isLoggedIn ? "/plan" : "/intake"}
              className="btn-primary text-sm py-2 px-4"
            >
              {isLoggedIn ? "My plan" : "Check My Rebates →"}
            </Link>
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
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={isLoggedIn ? "/plan" : "/intake"}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center btn-primary text-sm py-3 px-4 mt-2"
            >
              {isLoggedIn ? "My plan" : "Check My Rebates →"}
            </Link>
            <div className="pt-2 border-t border-gray-100 mt-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    {firstName ? `Hi, ${firstName}` : "My account"}
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
