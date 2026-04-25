"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/plan", label: "My Energy Plan" },
  { href: "/rebates", label: "Rebates" },
  { href: "/contractor-quotes", label: "Contractor Quotes" },
  { href: "/products", label: "Product Rankings" },
  { href: "/energy-supplier-compare", label: "Supplier Compare" },
  { href: "/commercial", label: "Commercial" },
  { href: "/intake", label: "Check My Rebates", highlight: true },
];

export function NavHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-brand-700 group-hover:text-brand-600 transition-colors">
              GreenBroker
            </span>
            <span className="hidden sm:block text-xs text-gray-400 font-medium">
              Montgomery County, MD
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.highlight ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="ml-2 btn-primary text-sm py-2 px-4"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

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
                    : "block px-4 py-3 text-sm font-medium text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
