"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FileText, LoaderCircle, RotateCcw } from "lucide-react";
import { matchResultSchema, type MatchResult } from "@/schemas/resume-match";

const field = "w-full rounded-md border border-[var(--landing-line-strong)] bg-[var(--landing-surface)] p-3 text-[var(--landing-text)]";

export function ResumeMatchForm() {
  const [mode, setMode] = useState("text");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const output = useRef<HTMLDivElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (mode === "role") {
      const value = String(data.get("jobSlug") ?? "").trim();
      try { data.set("jobSlug", new URL(value).pathname.split("/").filter(Boolean).at(-1) ?? ""); }
      catch { data.set("jobSlug", value); }
    }
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/public/resume-match", { method: "POST", body: data, signal: AbortSignal.timeout(120_000) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Comparison failed. Please try again.");
      setResult(matchResultSchema.parse(body));
      setTimeout(() => output.current?.focus(), 0);
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "ZodError" ? failure.message : "Unexpected response. Please try again.");
    } finally { setBusy(false); }
  }

  return <>
    <form onSubmit={submit} onChange={() => { setResult(null); setError(""); }}>
      <fieldset disabled={busy} className="space-y-6">
        <div>
          <label htmlFor="resume" className="mb-2 flex items-center gap-2 font-medium"><FileText size={18} />Your resume</label>
          <input id="resume" name="resumeFile" type="file" accept=".pdf,.docx,.txt" required className={field} />
          <p className="mt-2 text-sm text-[var(--landing-muted)]">PDF, DOCX or TXT. Maximum 5 MB.</p>
        </div>
        <div>
          <label htmlFor="source" className="mb-2 block font-medium">Compare against</label>
          <select id="source" value={mode} onChange={event => setMode(event.target.value)} className={field}>
            <option value="text">A job description</option><option value="role">A ScoutLane role</option>
          </select>
        </div>
        {mode === "text" ? <div>
          <label htmlFor="description" className="mb-2 block font-medium">Job description</label>
          <textarea id="description" name="jobDescription" required minLength={40} maxLength={12000} rows={8} className={field} placeholder="Paste responsibilities, requirements and skills from the job posting." />
        </div> : <div>
          <label htmlFor="role" className="mb-2 block font-medium">ScoutLane job link or slug</label>
          <input id="role" name="jobSlug" required maxLength={500} className={field} placeholder="https://scoutlane.net/careers/role-name" />
          <Link href="/jobs" className="mt-2 inline-block underline">Browse open roles</Link>
        </div>}
        <label className="flex items-start gap-3 text-sm leading-6">
          <input type="checkbox" name="consent" value="true" required className="mt-1 h-5 w-5 shrink-0" />
          <span>I agree to send my resume and job text to AI providers through OpenRouter for this comparison. ScoutLane does not save this comparison or submit an application. <Link href="/legal#privacy" className="underline">Privacy details</Link></span>
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--landing-button)] px-5 py-3 font-medium text-[var(--landing-button-text)] disabled:opacity-60">
          {busy && <LoaderCircle className="animate-spin" size={18} />}{busy ? "Comparing your resume..." : "Compare resume"}
        </button>
      </fieldset>
    </form>
    {error && <p role="alert" className="mt-6 border-l-4 border-red-500 pl-4">{error}</p>}
    {result && <div ref={output} tabIndex={-1} className="mt-10 space-y-6 border-t border-[var(--landing-line)] pt-8">
      <h2 className="text-2xl font-semibold">{Math.round(result.score * 100)}% evidence match</h2>
      <p>{result.rationale}</p>
      <p className="text-sm text-[var(--landing-muted)]">This is an AI assessment of the submitted evidence, not a hiring prediction. Missing evidence does not mean you lack the skill.</p>
      <div className="grid gap-8 sm:grid-cols-2">
        <section><h3 className="mb-3 font-semibold">Demonstrated skills</h3><ul className="list-disc space-y-2 pl-5">{result.matchedSkills.map((skill, i) => <li key={i}>{skill}</li>)}</ul>{!result.matchedSkills.length && <p>No clear skill overlap was identified.</p>}</section>
        <section><h3 className="mb-3 font-semibold">Missing evidence</h3><ul className="list-disc space-y-2 pl-5">{result.missingSkills.map((skill, i) => <li key={i}>{skill}</li>)}</ul>{!result.missingSkills.length && <p>No specific missing skills were identified.</p>}</section>
      </div>
      <section><h3 className="mb-3 font-semibold">Before you apply</h3>{result.improvements?.length ? <ul className="list-disc space-y-2 pl-5">{result.improvements.map((tip, i) => <li key={i}>{tip}</li>)}</ul> : <p>For each missing requirement you actually meet, add a specific project, responsibility or result that demonstrates it. Keep claims truthful; discuss remaining gaps with the recruiter.</p>}</section>
      <button type="button" onClick={() => { setResult(null); document.getElementById("resume")?.focus(); }} className="inline-flex min-h-11 items-center gap-2 underline"><RotateCcw size={16} />Start another comparison</button>
    </div>}
  </>;
}
