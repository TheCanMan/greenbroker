export function DemoBanner() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 no-print">
      <strong>Demo building — read-only.</strong> This is synthetic data seeded at deploy time.
      To play with your own building, start a Tier 0 benchmark from the commercial home page.
    </div>
  );
}
