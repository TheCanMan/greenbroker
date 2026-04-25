import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(n: number, compact = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(n);
}

export function formatRange(low: number, high: number): string {
  return `${formatUsd(low)} – ${formatUsd(high)}`;
}

export const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  high: "bg-orange-50 text-orange-800 border-orange-300",
  critical: "bg-red-50 text-red-800 border-red-300",
};

export const CONFIDENCE_STYLES: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-50 text-blue-800",
  high: "bg-emerald-50 text-emerald-800",
};

export const CONFIDENCE_TOOLTIPS: Record<string, string> = {
  low: "Low confidence — estimated from limited data. Upload more trends to tighten.",
  medium: "Medium confidence — signal is clear but heuristic-based.",
  high: "High confidence — strong signal across the analysis window.",
};

export const API_INTERNAL_URL =
  process.env.ENTROPY_API_INTERNAL_URL ?? "http://localhost:8000";

export async function fetchEntropyJson<T>(path: string): Promise<T> {
  const base = process.env.ENTROPY_API_INTERNAL_URL ?? API_INTERNAL_URL;
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Entropy API ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
