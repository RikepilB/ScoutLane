"use client";

import { useId, useRef, useState } from "react";
import styles from "../LandingPage.module.css";

const views = [
  { id: "resume", label: "Resume" },
  { id: "evidence", label: "Role evidence" },
  { id: "process", label: "Hiring process" },
] as const;

type ViewId = (typeof views)[number]["id"];

const candidates = [
  {
    id: "alex",
    name: "Alex Morgan",
    initials: "AM",
    role: "Product designer",
    location: "London · Remote",
    resume: {
      summary: "Six years turning complex workflows into products teams can understand and use.",
      experience: "Northstar Studio · Product designer · 2021—present",
      skills: "Research · Prototyping · Design systems",
      education: "BA Interaction Design",
    },
    evidence: [
      ["Product discovery", "Led research and prototyping across two workflow products", "found"],
      ["Systems thinking", "Built and maintained a shared component system", "found"],
      ["Team leadership", "Project ownership is clear; people management needs discussion", "discuss"],
    ],
    process: {
      current: "Phone screen",
      note: "Ask Alex to show how research changed the direction of a shipped project.",
      next: "Portfolio conversation · Thu 10:30",
    },
  },
  {
    id: "mina",
    name: "Mina Patel",
    initials: "MP",
    role: "Operations lead",
    location: "Toronto · Hybrid",
    resume: {
      summary: "Operations leader focused on turning scattered hand-offs into measurable routines.",
      experience: "Fieldwork Labs · Operations manager · 2020—present",
      skills: "Process design · Planning · Vendor operations",
      education: "BCom Operations Management",
    },
    evidence: [
      ["Process design", "Rebuilt fulfilment hand-offs across four regional teams", "found"],
      ["Planning", "Owned quarterly capacity planning and weekly operating reviews", "found"],
      ["Hiring", "Interview participation listed; hiring ownership needs discussion", "discuss"],
    ],
    process: {
      current: "In review",
      note: "Clarify the size of the teams and operating budget Mina owned directly.",
      next: "Recruiter review · Today",
    },
  },
  {
    id: "jon",
    name: "Jon Bell",
    initials: "JB",
    role: "Support engineer",
    location: "Austin · Remote",
    resume: {
      summary: "Customer-facing engineer who investigates technical issues and makes fixes reusable.",
      experience: "Parcel Systems · Support engineer · 2022—present",
      skills: "Debugging · SQL · Customer communication",
      education: "BSc Computer Science",
    },
    evidence: [
      ["Technical support", "Owns escalations from reproduction through customer follow-up", "found"],
      ["SQL", "Uses SQL for investigation and incident reporting", "found"],
      ["On-call", "Incident work is present; rotation experience needs discussion", "discuss"],
    ],
    process: {
      current: "Interview",
      note: "Use one recent escalation to explore diagnosis, communication and follow-through.",
      next: "Technical interview · Fri 14:00",
    },
  },
] as const;

const stageNames = ["Applied", "In review", "Phone screen", "Interview"];

export function LandingCandidateDemo() {
  const [candidateId, setCandidateId] = useState<(typeof candidates)[number]["id"]>(
    candidates[0].id,
  );
  const [view, setView] = useState<ViewId>("resume");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const candidate = candidates.find((item) => item.id === candidateId) ?? candidates[0];

  function moveTab(currentIndex: number, key: string) {
    let nextIndex = currentIndex;
    if (key === "ArrowRight") nextIndex = (currentIndex + 1) % views.length;
    if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + views.length) % views.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = views.length - 1;
    if (nextIndex === currentIndex && !["Home", "End"].includes(key)) return;

    setView(views[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <figure className={styles.productDemo} aria-label="Interactive ScoutLane sample">
      <div className={styles.demoBar}>
        <span className={styles.demoWordmark}>ScoutLane / Candidates</span>
        <span>Sample data</span>
      </div>

      <div className={styles.demoWorkspace}>
        <aside className={styles.candidateRail} aria-label="Sample candidates">
          <p className={styles.railTitle}>Three applications</p>
          <div className={styles.candidateList}>
            {candidates.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.candidateButton}
                aria-pressed={candidate.id === item.id}
                onClick={() => setCandidateId(item.id)}
              >
                <span className={styles.candidateInitials} aria-hidden="true">{item.initials}</span>
                <span><strong>{item.name}</strong><small>{item.role}</small></span>
              </button>
            ))}
          </div>
          <p className={styles.railFoot}>Select a person. The record stays connected as the process moves.</p>
        </aside>

        <div className={styles.candidateRecord}>
          <header className={styles.recordHeader}>
            <div>
              <h2>{candidate.name}</h2>
              <p>{candidate.role}<span aria-hidden="true"> · </span>{candidate.location}</p>
            </div>
            <span className={styles.recordId}>SL—{candidate.id.toUpperCase()}</span>
          </header>

          <div className={styles.viewTabs} role="tablist" aria-label="Candidate record views">
            {views.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => { tabRefs.current[index] = node; }}
                type="button"
                role="tab"
                id={`${id}-${item.id}-tab`}
                aria-controls={`${id}-panel`}
                aria-selected={view === item.id}
                tabIndex={view === item.id ? 0 : -1}
                onClick={() => setView(item.id)}
                onKeyDown={(event) => moveTab(index, event.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            className={styles.recordPanel}
            role="tabpanel"
            id={`${id}-panel`}
            aria-labelledby={`${id}-${view}-tab`}
          >
            {view === "resume" && (
              <div className={styles.resumeView}>
                <blockquote>{candidate.resume.summary}</blockquote>
                <dl className={styles.factList}>
                  <div><dt>Experience</dt><dd>{candidate.resume.experience}</dd></div>
                  <div><dt>Skills</dt><dd>{candidate.resume.skills}</dd></div>
                  <div><dt>Education</dt><dd>{candidate.resume.education}</dd></div>
                </dl>
                <p className={styles.sourceNote}>Structured from a sample resume. The original remains available for review.</p>
              </div>
            )}

            {view === "evidence" && (
              <div className={styles.evidenceView}>
                {candidate.evidence.map(([requirement, evidence, status]) => (
                  <div className={styles.evidenceRow} key={requirement}>
                    <strong>{requirement}</strong>
                    <p>{evidence}</p>
                    <span data-status={status}>{status === "found" ? "Evidence found" : "Discuss"}</span>
                  </div>
                ))}
                <p className={styles.sourceNote}>ScoutLane organizes evidence. Your team decides what it means.</p>
              </div>
            )}

            {view === "process" && (
              <div className={styles.processView}>
                <ol className={styles.stageTrack} aria-label={`${candidate.name} hiring stages`}>
                  {stageNames.map((stage) => {
                    const currentIndex = stageNames.indexOf(candidate.process.current);
                    const stageIndex = stageNames.indexOf(stage);
                    return (
                      <li key={stage} data-state={stageIndex < currentIndex ? "complete" : stageIndex === currentIndex ? "current" : "upcoming"}>
                        <span aria-hidden="true" />
                        <strong>{stage}</strong>
                      </li>
                    );
                  })}
                </ol>
                <div className={styles.processDetail}>
                  <div><span>Review note</span><p>{candidate.process.note}</p></div>
                  <div><span>Next conversation</span><p>{candidate.process.next}</p></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <figcaption>Illustrative candidates and notes. No real applicant or automated hiring decision.</figcaption>
    </figure>
  );
}
