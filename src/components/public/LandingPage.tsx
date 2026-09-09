import Link from "next/link";
import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";
import { LandingWorkspaceDoors } from "./landing/LandingWorkspaceDoors";
import { LandingCandidateDemo } from "./landing/LandingCandidateDemo";
import styles from "./LandingPage.module.css";

interface LandingPageProps {
  session: { user?: { email?: string } } | null;
}

const moments = [
  { title: "Start with the source", body: "Read structured experience, education and skills beside the resume they came from." },
  { title: "Make evidence discussable", body: "Connect role requirements to what was found, and keep uncertainty visible." },
  { title: "Carry the context forward", body: "Move the application through your stages without separating notes from the person." },
];

export function LandingPage({ session }: LandingPageProps) {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main-content">Skip to content</a>
      <div className={styles.aura} aria-hidden="true" />
      <div className={styles.container}>
        <PublicNav session={session} tone="paper" className={styles.nav} showThemeToggle />
        <main id="main-content">
          <section className={styles.hero} aria-labelledby="landing-title">
            <div className={styles.heroCopy}>
              <h1 id="landing-title">Every hiring decision should leave a trail.</h1>
              <div className={styles.heroSupport}>
                <p>
                  ScoutLane turns resumes into reviewable evidence and keeps every hiring
                  decision connected to the candidate.
                </p>
                <div className={styles.heroActions}>
                  <a href="#candidate-demo" className={styles.primary}>Explore a candidate</a>
                  <Link href="/jobs" className={styles.secondary}>Browse open roles</Link>
                </div>
              </div>
            </div>
            <div id="candidate-demo" className={styles.demoAnchor}><LandingCandidateDemo /></div>
          </section>
          <section className={styles.process} aria-labelledby="process-heading">
            <h2 id="process-heading">The record should survive every conversation.</h2>
            <ol className={styles.moments}>
              {moments.map((moment, index) => (
                <li key={moment.title}>
                  <span className={styles.stepNumber}>0{index + 1}</span>
                  <h3>{moment.title}</h3>
                  <p>{moment.body}</p>
                </li>
              ))}
            </ol>
          </section>
          <LandingWorkspaceDoors />
        </main>
        <PublicFooter tone="paper" />
      </div>
    </div>
  );
}
