import { DemoSignInButton } from "@/app/signin/_components/DemoSignInButton";
import styles from "../LandingPage.module.css";

export function LandingWorkspaceDoors() {
  return (
    <section id="demo" className={styles.workspaces} aria-labelledby="workspace-heading">
      <h2 id="workspace-heading">Take a seat at the hiring desk.</h2>
      <p className={styles.workspaceIntro}>Explore the same sample organization from two perspectives.</p>
      <div className={styles.workspaceList}>
        <div className={styles.workspaceRow}>
          <div><h3>Recruiter</h3><p>Review resumes, compare role fit and move candidates through the pipeline.</p></div>
          <DemoSignInButton role="recruiter" className="border border-paper/40 bg-transparent text-paper hover:bg-paper/10">
            Enter as Recruiter
          </DemoSignInButton>
        </div>
        <div className={styles.workspaceRow}>
          <div><h3>Admin</h3><p>Set up job templates, hiring stages and the team behind each role.</p></div>
          <DemoSignInButton role="admin" className="border border-paper/40 bg-transparent text-paper hover:bg-paper/10">
            Enter as Admin
          </DemoSignInButton>
        </div>
      </div>
    </section>
  );
}
