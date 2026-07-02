interface ApplicantTimelineProps {
  createdAt: Date;
  transitions: {
    id: string;
    fromStage: string | null;
    toStage: string;
    createdAt: Date;
    changedBy: { name: string | null } | null;
  }[];
}

export function ApplicantTimeline({ createdAt, transitions }: ApplicantTimelineProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Activity timeline</h3>
      <div className="mt-3 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-slate-900">Application submitted</p>
            <p className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(createdAt)}
            </p>
          </div>
        </div>
        {transitions.map((t) => (
          <div key={t.id} className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100">
              <div className="h-2 w-2 rounded-full bg-sky-500" />
            </div>
            <div>
              <p className="text-sm text-slate-900">
                Moved from <span className="font-medium">{t.fromStage}</span> to{" "}
                <span className="font-medium">{t.toStage}</span>
                {t.changedBy?.name && <span> by {t.changedBy.name}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(t.createdAt)}
              </p>
            </div>
          </div>
        ))}
        {transitions.length === 0 && (
          <p className="text-sm text-muted-foreground">No stage changes yet.</p>
        )}
      </div>
    </div>
  );
}
