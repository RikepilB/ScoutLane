# ScoutLane UX Test Protocol

Last reviewed: 2026-05-19.

Use two layers of validation:

1. Automated Playwright smoke tests for functional breakage.
2. Moderated human sessions for discoverability, trust, and workflow friction.

## Phase A: Automated Smoke

Run before every final handoff and on CI for integration branches.

Command:

```bash
pnpm test:e2e
```

Suggested smoke flows:

- Public careers board loads on desktop and mobile.
- Candidate opens a job and submits an application.
- Admin signs in and sees dashboard/jobs.
- Admin opens applicant list/detail.
- Admin moves an applicant across pipeline stages.
- CSV export returns a non-empty file.
- Integration test/retry screens do not throw.

Capture screenshots for any failure and save them under `test-results/` or Playwright's HTML report output.

## Phase B: Human UX Session

Run 3 to 5 testers per round:

- 1 to 2 recruiters familiar with Greenhouse, Lever, Workable, or similar.
- 2 to 3 hiring managers who review resumes but are not technical implementers.
- 1 engineering manager if available.

Format:

- 30 minutes.
- Moderated screen share.
- Think-aloud.
- Tester uses staging or production, not the developer's local machine.

## Moderator Script

Opening:

> Thanks for joining. I am testing a recruitment platform and want to see what is clear or confusing the first time someone uses it. Please think aloud. I will avoid helping unless you are fully stuck.

Tasks:

1. Create a reusable Software Engineer template with custom fields and screening questions.
2. Create and publish a Senior Full Stack Engineer job from that template.
3. Find the public job URL and submit an application as yourself.
4. Find your application in admin and move it from Applied to Interview.
5. Configure an integration for the Interview stage and verify a log appears.
6. Export applicants as CSV and confirm the file contains expected columns.

Closing questions:

- How easy was the platform to use from 1 to 5?
- What was the most confusing moment?
- What felt most polished?
- What would you change first?
- Would you use this instead of your current hiring tool? Why?

## Scoring Table

| Task | Time | Success | Errors | Frustration notes |
|---|---:|---|---|---|
| Template | | | | |
| Job publish | | | | |
| Application submit | | | | |
| Pipeline move | | | | |
| Integration | | | | |
| CSV export | | | | |

## Session Output

Save notes to:

```text
docs/UX-FEEDBACK/<YYYY-MM-DD>-session-<n>.md
```

Include persona, task notes, direct quotes marked `[verbatim]`, screenshots of confusion points, and survey responses.

After at least 3 sessions, create:

```text
docs/UX-FEEDBACK/<round>-summary.md
```

Prioritize top issues by frequency times severity.
