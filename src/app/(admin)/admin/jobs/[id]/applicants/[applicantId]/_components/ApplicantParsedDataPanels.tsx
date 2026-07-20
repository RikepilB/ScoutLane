import { GraduationCap, Building, Wrench } from "lucide-react";

const confidenceColors: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

interface ApplicantParsedDataPanelsProps {
  education?: { institution: string; degree: string; field: string; graduationYear: string; timePeriod?: string; confidence?: "high" | "medium" | "low" }[];
  work?: { company: string; title: string; duration: string; confidence?: "high" | "medium" | "low" }[];
  skills?: string[];
  skillsConfidence?: "high" | "medium" | "low";
}

export function ApplicantParsedDataPanels({ education, work, skills, skillsConfidence }: ApplicantParsedDataPanelsProps) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            Education
          </h3>
          {education && education.length > 0 ? (
            <div className="mt-3 space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{edu.institution}</div>
                    {edu.confidence && (
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${confidenceColors[edu.confidence]}`}>
                        {edu.confidence}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {edu.degree} in {edu.field} · {edu.graduationYear}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No education data available.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Building className="h-4 w-4 text-muted-foreground" />
            Work experience
          </h3>
          {work && work.length > 0 ? (
            <div className="mt-3 space-y-3">
              {work.map((w, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{w.title}</div>
                    {w.confidence && (
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${confidenceColors[w.confidence]}`}>
                        {w.confidence}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {w.company} · {w.duration}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No work experience data available.</p>
          )}
        </div>
      </div>

      {skills && skills.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Skills
            {skillsConfidence && (
              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${confidenceColors[skillsConfidence]}`}>
                {skillsConfidence}
              </span>
            )}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
