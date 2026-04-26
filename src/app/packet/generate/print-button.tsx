"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-primary text-sm py-2 px-4"
    >
      Print / Save as PDF
    </button>
  );
}
