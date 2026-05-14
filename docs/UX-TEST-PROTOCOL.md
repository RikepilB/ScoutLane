# ScoutLane UX Test Protocol

Dual-layer prototype testing: an automated Playwright smoke that catches functional breakage, then moderated human sessions that catch UX friction the automation cannot see.

## Phase A — Automated smoke (Playwright)

Run before every human session. Run on every CI build of `main`.

**Location**: `tests/e2e/smoke.spec.ts` (created in Sprint 5 / H5)

### Flows covered

1. **Public submit → admin sees applicant**
   - Navigate `/careers/<slug>`
   - Fill form (firstName, lastName, email, phone, upload `tests/fixtures/resume.pdf`)
   - Submit → land on `/careers/<slug>/applied`
   - Sign in as admin → navigate to `/admin/jobs/<id>/applicants` → applicant visible with `Parsing...` status

2. **Pipeline drag-drop → activity timeline updates**
   - Open `/admin/jobs/<id>/pipeline`
   - Drag applicant from `Applied` → `Interview`
   - Open applicant detail → activity timeline shows transition with admin name + timestamp

3. **Integration fires on stage transition**
   - Configure integration on `Interview` stage with `https://webhook.site/<unique>` URL
   - Move an applicant to `Interview`
   - Open `/admin/jobs/<id>/integrations/logs` → entry with status 200
   - Optional: hit webhook.site API to confirm payload received

4. **Template → job apply**
   - Create template with 2 custom fields + 4 questions
   - Create new job, apply template
   - Job's custom fields page shows the 2 fields
   - Job's assessment questions show the 4 questions
   - Edit template — original job's fields/questions unchanged (snapshot)

5. **Applicant list filter/sort**
   - Apply filter: `pipelineStage = Screening`
   - Result count + visible rows match
   - Sort by name ascending → rows alphabetical
   - Search "@gmail.com" → only Gmail applicants visible

6. **CSV export**
   - Click "Export CSV" with active filters
   - Download succeeds; file is non-empty; first row matches expected column headers

### Screenshots

Each step saves `tests/e2e/screenshots/<flow>/<step>-<browser>.png`. Diffed against baseline; failures surface as PR review comments.

### Running

```bash
pnpm test:e2e           # full suite
pnpm test:e2e --headed  # watch browser
pnpm test:e2e -g "flow 3"  # one flow by name
```

---

## Phase B — Human UX session

### Recruitment

Target 3–5 testers per round. Mix of personas:

- **Recruiter persona** (1–2): has used Greenhouse / Lever / Workable
- **Non-technical hiring manager persona** (2–3): manages a team, has read resumes, has rejected candidates
- **Engineering manager persona** (1): not the same as the developer

Compensation: free lunch / coffee, or USD $25 gift card.

### Format

- 30 minutes per session
- Moderated (you on call, screen-share, think-aloud)
- Recorded with permission (Loom or Zoom)
- Tester uses staging URL on their own laptop (replicate real condition — not your dev machine)

### Pre-session prep

1. Seed fresh dataset: `pnpm prisma:reset && pnpm db:seed`
2. Create test admin account; share credentials in session
3. Confirm webhook.site URL is alive and capturing
4. Confirm staging URL is up

### Script

> **Opening (2 min)**
>
> "Thanks for joining. I'm building a recruitment platform and I want to see how it holds up when someone uses it for the first time. There are no wrong answers — if anything is confusing, that's information I need.
>
> Please think aloud as you go. I won't help unless you're really stuck, because watching you get stuck tells me where to fix things. We'll do six short tasks. Ready?"

---

**Task 1 — Create a template (4 min)**

> "You need to hire a Software Engineer. Create a reusable template called 'Software Engineer' that includes:
> - One custom form field for LinkedIn URL (optional)
> - One custom form field for years of experience (required)
> - Four assessment questions of your choice, each up to 2 minutes long.
>
> Save when you're done."

*Measures: discoverability of templates, form builder usability, question editor.*

---

**Task 2 — Create and publish a job (4 min)**

> "Now create a new job titled 'Senior Full Stack Engineer'. Apply the template you just made. Add a description. Publish it."

*Measures: template → job apply flow, draft → publish transition.*

---

**Task 3 — Submit your own application (3 min)**

> "Open the job's public page (you'll need to find the URL somewhere in the admin). Fill out the application as yourself. Upload this PDF [hand them `tests/fixtures/resume.pdf`]. Submit."

*Measures: 'copy public URL' discoverability, public form quality, mobile responsiveness if they happen to be on phone.*

---

**Task 4 — Find and move your application (5 min)**

> "Go back to the admin. Find your application in the dashboard. Move it from 'Applied' to 'Interview'."

*Measures: applicant list usability, pipeline DnD smoothness, status feedback.*

---

**Task 5 — Configure an integration (6 min)**

> "Imagine you have an external video assessment platform at this URL [provide webhook.site URL]. Configure it so that whenever an applicant reaches the 'Interview' stage, that platform gets pinged with the assessment questions.
>
> Then move another applicant into 'Interview' to verify it fires. Find the log of that call."

*Measures: integration config UX, "include assessment questions" toggle clarity, log discoverability, retry button visibility.*

---

**Task 6 — Export applicants (3 min)**

> "Export the full list of applicants for this job as a CSV. Open it to confirm it has the data you'd expect."

*Measures: export button discoverability, CSV column choices.*

---

> **Closing (3 min)**
>
> "Last questions:
> - On a scale of 1–5, how confident did you feel during the session?
> - What was the most confusing moment?
> - What's one thing you'd change first?
> - Would you use this daily over Greenhouse / Lever / your current tool? Why or why not?"

### Per-task scoring (moderator fills out during/after)

| Task | Time-to-complete | Success (yes/partial/no) | Errors observed | Verbal frustration count |
|------|------------------|--------------------------|-----------------|--------------------------|
| 1 — Template            |  |  |  |  |
| 2 — Job + publish       |  |  |  |  |
| 3 — Submit application  |  |  |  |  |
| 4 — Move applicant      |  |  |  |  |
| 5 — Configure integration |  |  |  |  |
| 6 — Export CSV          |  |  |  |  |

### Tester feedback form (embed in session)

Use Tally or Google Forms with these fields:

1. (1–5) Overall, how easy was the platform to use?
2. (1–5) How visually polished did it feel?
3. (1–5) Compared to tools you've used before (Greenhouse, Lever, etc.), how does this compare? (1 = much worse, 5 = much better)
4. (short text) Most confusing moment?
5. (short text) Best moment?
6. (short text) What would you change first?
7. (multi-select) Which features were obviously broken or missing? [list options]
8. (long text) Anything else?

### Output

After each session save to `docs/UX-FEEDBACK/<YYYY-MM-DD>-session-<n>.md` with:
- Tester persona + brief background
- Per-task notes
- Direct quotes (mark `[verbatim]`)
- Screenshots of moments where they stalled
- Form responses pasted in full

After ≥3 sessions: write `docs/UX-FEEDBACK/<round>-summary.md` aggregating top 5 issues, prioritized by frequency × severity. Fold into BACKLOG as new tasks.

---

## Cadence

- **Per sprint**: run Phase A (smoke) before merge to main
- **Per major feature batch** (end of Sprint 3 and end of Sprint 4): run Phase B (≥3 sessions)
- **Pre-submission**: run both phases one final time with fresh testers who have not seen earlier rounds

## Success criteria

The submission is ready when:
- Phase A: all 6 flows green; zero unhandled console errors; no visual diffs >5% on baselines
- Phase B: average ease-of-use score ≥4.0; ≥80% of tasks completed without moderator help; no single confusion theme repeated across >50% of testers
