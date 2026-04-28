"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MenuId = "homeowners" | "projects";

type MenuItem = {
  href: string;
  label: string;
  description: string;
  eyebrow: string;
};

type MenuGroup = {
  id: MenuId;
  label: string;
  items: MenuItem[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    id: "homeowners",
    label: "Homeowners",
    items: [
      {
        href: "/intake",
        label: "Check My Rebates",
        description: "Start the residential intake and generate a savings plan.",
        eyebrow: "Start",
      },
      {
        href: "/plan",
        label: "My Energy Plan",
        description: "Review recommended upgrades, savings ranges, and next steps.",
        eyebrow: "Dashboard",
      },
      {
        href: "/rebates",
        label: "Rebates",
        description: "Browse verified incentive programs and required documents.",
        eyebrow: "Programs",
      },
      {
        href: "/calculator",
        label: "Savings Calculator",
        description: "Estimate project cost, rebates, and payback ranges.",
        eyebrow: "Estimate",
      },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    items: [
      {
        href: "/contractor-quotes",
        label: "Contractor Quotes",
        description: "Prepare quote packets for selected home upgrades.",
        eyebrow: "Quotes",
      },
      {
        href: "/products",
        label: "Product Rankings",
        description: "Compare efficient products and rebate-fit warnings.",
        eyebrow: "Marketplace",
      },
      {
        href: "/energy-supplier-compare",
        label: "Supplier Compare",
        description: "Risk-score supplier offers before considering a switch.",
        eyebrow: "Rates",
      },
      {
        href: "/packet",
        label: "Rebate Packet",
        description: "Build checklists and homeowner packet drafts for review.",
        eyebrow: "Paperwork",
      },
      {
        href: "/contractors",
        label: "Find Contractors",
        description: "Explore contractor options and participation paths.",
        eyebrow: "Network",
      },
    ],
  },
] as const;

interface NavHeaderProps {
  firstName?: string | null;
  isLoggedIn?: boolean;
}

export function NavHeader({ firstName, isLoggedIn }: NavHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const router = useRouter();

  function closeMenus() {
    setOpenMenu(null);
    setMobileMenuOpen(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-brand-700 transition-colors group-hover:text-brand-600">
              GreenBroker
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {MENU_GROUPS.map((group) => {
              const isOpen = openMenu === group.id;

              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(group.id)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    onClick={() => setOpenMenu(isOpen ? null : group.id)}
                    className={
                      isOpen
                        ? "rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors"
                        : "rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950"
                    }
                  >
                    <span>{group.label}</span>
                    <span className="ml-1 text-xs" aria-hidden="true">
                      v
                    </span>
                  </button>

                  {isOpen && (
                    // Outer wrapper anchored at top-full has NO margin so the
                    // dropdown stays inside the parent's hover area. Visual
                    // breathing room is added via pt-4 INSIDE the wrapper —
                    // that pads the visible card without leaving a hover-dead
                    // gap above it.
                    <div
                      className="absolute left-1/2 top-full z-50 w-[620px] -translate-x-1/2 pt-4"
                    >
                      <div
                        role="menu"
                        className="w-full rounded-3xl border border-gray-200 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setOpenMenu(null)}
                              className="group/menu block rounded-2xl border border-transparent p-4 transition-colors hover:border-blue-100 hover:bg-blue-50/80"
                              role="menuitem"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                                {item.eyebrow}
                              </span>
                              <span className="mt-2 block text-sm font-bold text-gray-950 transition-colors group-hover/menu:text-blue-700">
                                {item.label}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-gray-500">
                                {item.description}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              href="/learn"
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950"
            >
              Learn
            </Link>
            <Link
              href="/commercial"
              className="ml-1 whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Commercial
            </Link>
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-700 transition-colors hover:text-brand-700"
                >
                  {firstName ? `Hi, ${firstName}` : "My account"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 transition-colors hover:text-gray-700"
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-700"
              >
                Sign in
              </Link>
            )}
            <Link
              href={isLoggedIn ? "/plan" : "/intake"}
              className="btn-primary px-4 py-2 text-sm"
            >
              {isLoggedIn ? "My plan" : "Check My Rebates"}
            </Link>
          </div>

          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <nav className="mx-auto max-w-7xl space-y-4 px-4 py-4">
            <div className="grid gap-2">
              <Link
                href={isLoggedIn ? "/plan" : "/intake"}
                onClick={closeMenus}
                className="block w-full px-4 py-3 text-center text-sm btn-primary"
              >
                {isLoggedIn ? "My plan" : "Check My Rebates"}
              </Link>
              <Link
                href="/commercial"
                onClick={closeMenus}
                className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Commercial
              </Link>
            </div>

            {MENU_GROUPS.map((group) => (
              <section key={group.id}>
                <p className="px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className="block rounded-xl px-3 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      {item.label}
                      <span className="mt-1 block text-xs font-normal leading-5 text-gray-500">
                        {item.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            <div className="grid gap-2 border-t border-gray-100 pt-4">
              <Link
                href="/learn"
                onClick={closeMenus}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
              >
                Learn
              </Link>
            </div>

            <div className="border-t border-gray-100 pt-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMenus}
                    className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    {firstName ? `Hi, ${firstName}` : "My account"}
                  </Link>
                  <button
                    onClick={() => {
                      closeMenus();
                      handleSignOut();
                    }}
                    className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={closeMenus}
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
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
