"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import type { BillIn, Tier0Response } from "@/lib/commercial/types";

type Mode = "manual" | "csv";

type BillRow = {
  utility_type: "electric" | "gas" | "water";
  period_start: string;
  period_end: string;
  kwh_or_therms: string;
  cost_usd: string;
};

function emptyRow(): BillRow {
  return { utility_type: "electric", period_start: "", period_end: "", kwh_or_therms: "", cost_usd: "" };
}

function monthsBackTemplate(): BillRow[] {
  const rows: BillRow[] = [];
  const now = new Date();
  for (let i = 12; i >= 1; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    rows.push({
      utility_type: "electric",
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
      kwh_or_therms: "",
      cost_usd: "",
    });
  }
  return rows;
}

function parseCsv(text: string): { bills: BillIn[]; error: string | null } {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { bills: [], error: "CSV must have a header row and at least one bill." };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["utility_type", "period_start", "period_end", "kwh_or_therms", "cost_usd"];
  for (const r of required) {
    if (!headers.includes(r)) return { bills: [], error: `Missing column: ${r}` };
  }
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const bills: BillIn[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const ut = cells[idx.utility_type]?.toLowerCase() as BillIn["utility_type"];
    if (!["electric", "gas", "water"].includes(ut)) {
      return { bills: [], error: `Row ${i + 1}: utility_type must be electric/gas/water` };
    }
    const kwh = Number(cells[idx.kwh_or_therms]);
    const cost = Number(cells[idx.cost_usd]);
    if (!Number.isFinite(kwh) || kwh <= 0) return { bills: [], error: `Row ${i + 1}: kwh_or_therms invalid` };
    if (!Number.isFinite(cost) || cost < 0) return { bills: [], error: `Row ${i + 1}: cost_usd invalid` };
    bills.push({
      utility_type: ut,
      period_start: cells[idx.period_start],
      period_end: cells[idx.period_end],
      kwh_or_therms: kwh,
      cost_usd: cost,
    });
  }
  return { bills, error: null };
}

function billToRow(b: BillIn): BillRow {
  return {
    utility_type: b.utility_type,
    period_start: b.period_start,
    period_end: b.period_end,
    kwh_or_therms: String(b.kwh_or_therms),
    cost_usd: String(b.cost_usd),
  };
}

function isBlankRow(r: BillRow): boolean {
  return !r.period_start && !r.period_end && !r.kwh_or_therms && !r.cost_usd;
}

function toBillIn(r: BillRow): BillIn | null {
  const kwh = Number(r.kwh_or_therms);
  const cost = Number(r.cost_usd);
  if (!r.period_start || !r.period_end) return null;
  if (!Number.isFinite(kwh) || kwh <= 0) return null;
  if (!Number.isFinite(cost) || cost < 0) return null;
  return {
    utility_type: r.utility_type,
    period_start: r.period_start,
    period_end: r.period_end,
    kwh_or_therms: kwh,
    cost_usd: cost,
  };
}

type ParseResult = { filename: string; count: number; method: "claude" | "regex" | "none" };

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600";

export function CommercialOnboardingForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfResults, setPdfResults] = useState<ParseResult[]>([]);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState<"MD" | "DC" | "VA">("MD");
  const [zip, setZip] = useState("");
  const [buildingType, setBuildingType] = useState<"office" | "k12" | "retail" | "warehouse" | "other">("office");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");

  const [mode, setMode] = useState<Mode>("manual");
  const [rows, setRows] = useState<BillRow[]>(monthsBackTemplate());
  const [csvBills, setCsvBills] = useState<BillIn[]>([]);
  const [csvName, setCsvName] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(i: number, patch: Partial<BillRow>) {
    setRows((rs) => rs.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  }
  function addRow() { setRows((rs) => [...rs, emptyRow()]); }
  function removeRow(i: number) { setRows((rs) => rs.filter((_, j) => j !== i)); }

  async function onPdfsPicked(files: FileList) {
    setPdfBusy(true);
    setError(null);
    const results: ParseResult[] = [];
    const appended: BillRow[] = [];
    try {
      for (const f of Array.from(files)) {
        const body = new FormData();
        body.append("file", f);
        const res = await fetch("/api/commercial/onboarding/parse-bill", { method: "POST", body });
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          results.push({ filename: f.name, count: 0, method: "none" });
          setError(`Could not parse ${f.name}: ${msg.slice(0, 200) || res.status}`);
          continue;
        }
        const data = (await res.json()) as { bills: BillIn[]; method: ParseResult["method"]; filename: string };
        results.push({ filename: data.filename, count: data.bills.length, method: data.method });
        for (const b of data.bills) appended.push(billToRow(b));
      }
      if (appended.length > 0) {
        setRows((prev) => {
          const kept = prev.filter((r) => !isBlankRow(r));
          return [...kept, ...appended];
        });
      }
      setPdfResults((prev) => [...prev, ...results]);
    } finally {
      setPdfBusy(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  }

  async function onCsvPicked(f: File) {
    const text = await f.text();
    const { bills, error } = parseCsv(text);
    if (error) { setError(error); setCsvBills([]); setCsvName(null); return; }
    setError(null); setCsvBills(bills); setCsvName(f.name);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const sqftNum = Number(sqft);
    if (!name.trim()) return setError("Name is required.");
    if (!Number.isFinite(sqftNum) || sqftNum <= 0) return setError("Square footage must be a positive number.");
    const year = yearBuilt.trim() ? Number(yearBuilt) : null;
    if (year !== null && (!Number.isFinite(year) || year < 1800 || year > 2100)) {
      return setError("Year built looks wrong.");
    }

    const bills: BillIn[] =
      mode === "csv"
        ? csvBills
        : rows.map(toBillIn).filter((b): b is BillIn => b !== null);

    if (bills.length === 0) {
      return setError(mode === "csv" ? "Upload a CSV with at least one bill." : "Enter at least one bill row (kWh + cost).");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/commercial/onboarding/tier0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          city: city.trim() || null,
          state,
          zip: zip.trim() || null,
          building_type: buildingType,
          sqft: sqftNum,
          year_built: year,
          bills,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text.slice(0, 300) || `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as Tier0Response;
      router.push(`/commercial/buildings/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-8">
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Building profile</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name *</span>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
              placeholder="Maple Ridge Elementary" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Building type *</span>
            <select value={buildingType} onChange={(e) => setBuildingType(e.target.value as typeof buildingType)}
              className={INPUT_CLASS}>
              <option value="office">Office</option>
              <option value="k12">K-12 school</option>
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">Street address</span>
            <input value={address} onChange={(e) => setAddress(e.target.value)}
              className={INPUT_CLASS} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)}
              className={INPUT_CLASS} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">State *</span>
              <select value={state} onChange={(e) => setState(e.target.value as typeof state)}
                className={INPUT_CLASS}>
                <option value="MD">MD</option>
                <option value="DC">DC</option>
                <option value="VA">VA</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">ZIP</span>
              <input value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric"
                className={INPUT_CLASS} />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Square footage *</span>
            <input required type="number" min={1} value={sqft} onChange={(e) => setSqft(e.target.value)}
              className={INPUT_CLASS}
              placeholder="65000" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Year built</span>
            <input type="number" min={1800} max={2100} value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)}
              className={INPUT_CLASS}
              placeholder="1998" />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Utility bills</h2>
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs font-medium">
            <button type="button" onClick={() => setMode("manual")}
              className={`rounded-full px-3 py-1 ${mode === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>
              Manual entry
            </button>
            <button type="button" onClick={() => setMode("csv")}
              className={`rounded-full px-3 py-1 ${mode === "csv" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}>
              Upload CSV
            </button>
          </div>
        </div>

        {mode === "manual" ? (
          <>
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">Auto-fill from PDF bills</div>
                  <div className="text-xs text-gray-600">
                    Upload one or more utility bill PDFs and we&apos;ll extract the line items into the table below. Always verify before submitting.
                  </div>
                </div>
                <div>
                  <input
                    ref={pdfRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const fs = e.target.files;
                      if (fs && fs.length > 0) void onPdfsPicked(fs);
                    }}
                  />
                  <button
                    type="button"
                    disabled={pdfBusy}
                    onClick={() => pdfRef.current?.click()}
                    className="rounded-full border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pdfBusy ? "Parsing…" : "Choose PDF(s)"}
                  </button>
                </div>
              </div>
              {pdfResults.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-gray-700">
                  {pdfResults.map((r, i) => (
                    <li key={i}>
                      <span className="font-medium">{r.filename}</span>{" "}
                      {r.count > 0 ? (
                        <span className="text-gray-500">
                          — {r.count} bill{r.count === 1 ? "" : "s"} extracted via {r.method}
                        </span>
                      ) : (
                        <span className="text-amber-700">— no bills extracted, enter manually below</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-gray-500">
                    <th className="py-2 pr-3">Type</th>
                    <th className="pr-3">Period start</th>
                    <th className="pr-3">Period end</th>
                    <th className="pr-3 text-right">kWh / therms</th>
                    <th className="pr-3 text-right">Cost ($)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-1 pr-3">
                        <select value={r.utility_type} onChange={(e) => updateRow(i, { utility_type: e.target.value as BillRow["utility_type"] })}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-xs">
                          <option value="electric">electric</option>
                          <option value="gas">gas</option>
                          <option value="water">water</option>
                        </select>
                      </td>
                      <td className="pr-3"><input type="date" value={r.period_start} onChange={(e) => updateRow(i, { period_start: e.target.value })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs" /></td>
                      <td className="pr-3"><input type="date" value={r.period_end} onChange={(e) => updateRow(i, { period_end: e.target.value })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs" /></td>
                      <td className="pr-3 text-right"><input type="number" step="1" min={0} value={r.kwh_or_therms}
                        onChange={(e) => updateRow(i, { kwh_or_therms: e.target.value })}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-xs" /></td>
                      <td className="pr-3 text-right"><input type="number" step="0.01" min={0} value={r.cost_usd}
                        onChange={(e) => updateRow(i, { cost_usd: e.target.value })}
                        className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-xs" /></td>
                      <td className="text-right">
                        <button type="button" onClick={() => removeRow(i)}
                          className="text-xs text-gray-400 hover:text-red-600">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addRow}
              className="text-sm text-brand-600 underline">+ Add row</button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Expected columns: <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">utility_type,period_start,period_end,kwh_or_therms,cost_usd</code>.
              Dates in <code>YYYY-MM-DD</code>.
            </p>
            <input ref={fileRef} type="file" accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onCsvPicked(f);
              }}
              className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700" />
            {csvName && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="font-medium text-gray-900">{csvName}</span>
                <span className="text-gray-500"> — {csvBills.length} bill{csvBills.length === 1 ? "" : "s"} parsed</span>
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          We derive your effective $/kWh from the electric bills you provide.
        </div>
        <button type="submit" disabled={submitting}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? "Submitting…" : "See my Tier 0 report →"}
        </button>
      </div>
    </form>
  );
}
