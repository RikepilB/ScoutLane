import { Target } from "lucide-react";
import { RescoreButton } from "./RescoreButton";
import { matchBadgeColor } from "../_lib/applicant-detail";

interface ApplicantMatchPanelProps {
  applicantId: string;
  jobTitle: string;
  hasParsedData: boolean;
  match?: {
    score: number;
    matchedSkills?: string[];
    missingSkills?: string[];
    rationale?: string;
    scoredAt?: string;
  };
}

export function ApplicantMatchPanel({ applicantId, jobTitle, hasParsedData, match }: ApplicantMatchPanelProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Target className="h-4 w-4 text-muted-foreground" />
          Match to job
        </h3>
        {hasParsedData && <RescoreButton applicantId={applicantId} />}
      </div>

      {!hasParsedData ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Not yet scored. Parsing must complete first.
        </p>
      ) : match ? (
        <div className="mt-4 space-y-5">
          <div className="flex items-baseline gap-3">
            <div
              className={`inline-flex items-center rounded-2xl px-4 py-2 text-2xl font-semibold ${matchBadgeColor(match.score)}`}
            >
              {Math.round(match.score * 100)}%
            </div>
            <span className="text-xs text-muted-foreground">
              fit for {jobTitle}
            </span>
          </div>

          {match.rationale && (
            <p className="rounded-xl border border-border/50 bg-muted/20 p-3 text-sm text-slate-700">
              {match.rationale}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Matched skills
              </h4>
              {match.matchedSkills && match.matchedSkills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {match.matchedSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">None.</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-red-700">
                Missing skills
              </h4>
              {match.missingSkills && match.missingSkills.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {match.missingSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">None.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Scoring did not produce a result. Click Re-score to try again.
        </p>
      )}
    </div>
  );
}
