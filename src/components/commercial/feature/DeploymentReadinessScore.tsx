import type { CommercialAssessment } from "@/lib/commercial/feature-types";
import { calculateDeploymentReadiness, READINESS_ITEMS } from "@/lib/commercial/readiness";

export function DeploymentReadinessScore({
  assessment,
  compact = false,
}: {
  assessment: CommercialAssessment;
  compact?: boolean;
}) {
  const result = calculateDeploymentReadiness(assessment);
  const circumference = 2 * Math.PI * 44;
  const dash = (result.score / 100) * circumference;

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative mx-auto h-32 w-32 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#2563eb"
              strokeLinecap="round"
              strokeWidth="8"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-slate-950">{result.score}</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              / 100
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            Deployment readiness
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">{result.band}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {result.nextBestAction}
          </p>

          {!compact && (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {READINESS_ITEMS.map((item) => {
                const present = item.test(assessment);
                return (
                  <div
                    key={item.key}
                    className={`rounded-xl border px-3 py-2 text-xs ${
                      present
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className="font-semibold">{present ? "Ready" : "Missing"}</span>
                    <span className="mx-1">-</span>
                    {item.label}
                    <span className="float-right font-mono">{item.points}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
