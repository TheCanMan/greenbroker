export type DataUploadCardProps = {
  title: string;
  whatWeDetect: string;
  timeToUse: string;
  privacy: string;
  exampleOutput: string;
};

export function DataUploadCard({
  title,
  whatWeDetect,
  timeToUse,
  privacy,
  exampleOutput,
}: DataUploadCardProps) {
  return (
    <div className="card p-5">
      <div className="text-sm font-bold text-slate-950">{title}</div>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Detect
          </dt>
          <dd className="mt-1 text-slate-700">{whatWeDetect}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Time
          </dt>
          <dd className="mt-1 text-slate-700">{timeToUse}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Privacy
          </dt>
          <dd className="mt-1 text-slate-700">{privacy}</dd>
        </div>
      </dl>
      <div className="mt-4 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
        Example: {exampleOutput}
      </div>
    </div>
  );
}
