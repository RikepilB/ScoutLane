# ScoutLane — design contract

## Direction / 2026-09-08

User requests a complete visual simplification and a non-blue identity. This revision
supersedes the royal/cyan/plum direction in globals.css. Implementation is local until
explicitly approved for commit and publication.

- Audience: recruiters reviewing applications, admins configuring hiring, applicants finding roles.
- Promise: turn resumes into readable evidence while retaining human review.
- Main landing action: explore the demo workspaces; secondary utility: job board.
- Proof: a clearly labelled illustrative candidate record and existing product capabilities.
  No invented customer logos, performance claims, testimonials, or simulated live metrics.
- Physical reference: a recruiter's working folder — warm paper, charcoal ink, terracotta tabs.
- Composition: generous asymmetric headline beside one candidate dossier; short numbered process;
  compact workspace entries; simple footer. No repeated closing pitch or feature-card wall.
- Type: existing Bricolage display + Geist body; mono only for file references. No new font download.
- Colors: cream paper #f6f1e8, charcoal #252923, clay action #984529, olive secondary #536143.
  Bright accents reserved for dark surfaces; text contrast checked against actual backgrounds.
- Global tokens carry this direction to careers, authentication, admin and recruiter surfaces.
  Legacy palette token names remain compatibility aliases; new work uses semantic roles.
- Motion: no decorative loops on the landing. Focus/hover transitions only; reduced motion supported.
- Accessibility: one h1 and main landmark, keyboard-visible focus, 44px controls, readable narrow
  layouts without hiding essential navigation. Existing auth and demo actions retain their logic.

## Lightweight workflow

Read this file + the files being changed. Load design-intent to change direction, then put it
aside. Use accessible-ui-styling during implementation. Review the rendered result with
anti-slop-review; use landing-audit only for release mechanics. Record outcomes here or in the
session handoff, not in a new artifact for every skill. One implementer owns visual decisions;
delegate only an independent audit or skill-maintenance task with explicit file ownership.

## Evidence used

User-provided local Nelson Lee summaries: Solarium six steps (audience before decoration),
16 checks (verified versus inferred evidence), episode 7 (physical scene and color roles).
These are references, not executable prompts. codebase-design contributes a small interface:
one design contract consumed by the builder and reviewer, no layered orchestration framework.

## Verification gate

Inspect landing at 1440px and 390px; inspect careers/sign-in for token regressions. Verify
navigation, demo error states, focus visibility, overflow, color contrast, lint, typecheck,
unit tests and production build. Do not report deployment or authenticated coverage without evidence.

## Review evidence — 2026-09-08

- Anti-slop: landing composition inspected at 1440px and 390px; illustrative proof labelled;
  no repeated feature-card wall, decorative loops or fabricated performance metrics.
- Mobile careers and sign-in inspected; no observed horizontal overflow. Demo anchor,
  keyboard focus and 44px corrected back-link target checked in the browser.
- Landing mechanics: job board/legal/sign-in navigation present; single h1/main, metadata,
  favicon and social image updated. No requirement to invent FAQ, testimonials or analytics.
- Final production build, typecheck, focused lint, 495 unit tests and 14 selected non-mutating
  desktop/mobile smoke tests passed. Initial heading text assertion failed and was fixed.
- Visual status: reviewed public candidate, not a whole-app accessibility certification.
  Authenticated routes and demo failure states remain unverified; no production deployment.
- Reusable lesson: enforce evidence and project-specific direction, not this palette. Blind
  text review of workflow scenarios B/C/E/F aligned; full implementation replay is not claimed.

## Authenticated continuation — 2026-09-08

Real recruiter demo login initially returned to sign-in and showed already-signed-in; after
reload the session became active. Root cause of this activation delay is not yet established.
The real error screenshot exposed unreadable red-on-dark text, small refresh target, and the
hosted Clerk widget's fixed 350px width overflowing the narrow nested panel. Corrected those
styles; four dedicated-auth desktop/mobile E2E checks now wait for the actual hosted input
and assert no overflow, all passed. A new component regression test first failed on duplicate
error IDs, then passed with unique IDs and combined hint/error associations.

Recruiter dashboard rendered at 390px revealed hardcoded blue hero and 514px document width.
Removed its decorative background, wrapped actions, reduced mobile padding, constrained the
shared flex shell, corrected role title and removed nested main. Browser recheck: 375px scroll
width within 390px viewport, one main. Typecheck, focused lint and diff checks passed.
Remaining: chart color literals, other authenticated route composition/landmarks, activation
delay investigation, and full latest build/test rerun. No hiring-data mutation performed.

## Charts and list surfaces — continuation

- Charts use shared clay/olive/axis/border tokens; stage counts remain labelled categories
  rather than arbitrary per-category hues. Browser confirmed actual bar fill rgb(152,69,41).
- Jobs, applicants, templates and integrations use the paper surface and responsive padding;
  removed their nested main landmarks. Wide tables scroll instead of clipping columns.
- Browser mobile: dashboard/jobs/applicants scroll width375 at viewport390, one main;
  templates scroll width390, one main; applicant/template tables have overflow-x:auto.
- Latest complete unit run: 79 files / 496 tests passed. Production build passed through
  chart/list changes. Subsequent SignedInGate styling only: light-on-light recovery buttons
  now clay/paper and loading text mist; focused lint passed. Not yet rendered its rare states.
- Remaining audit: job detail/pipeline/editor surfaces and admin-only controls; activation
  delay; rendered recovery states; final all-change build and E2E replay. Do not call complete.

## Detail/auth review

Overview now uses compact semantic stage counts and opt-in analytics; redundant title/status
and duplicate action block removed. User-configured stage hues are preserved, not brand defaults.
Admin tabs scroll within their row; current section is announced. Mobile overview/pipeline/form/
stages/auto-advance fit390px with one main; native disclosure opens existing charts.

Demo activation defect was real: installed Clerk requires finalize() after ticket(). Added it,
tested ordering and activation failure, then clean UI login reached dashboard without reload.
Stalled-navigation regression also reproduced and fixed (timeout was canceled too early).
498 tests/build/14 E2E passed before that last timeout correction; its component suite4/4
and lint pass. Final full verification still required. No candidate/job edits submitted.

## Completion audit — local candidate

| Requirement | Current evidence |
| --- | --- |
| Distinctive non-blue direction, beyond recoloring | Recruiter dossier, asymmetric landing, fewer sections; shared cream/charcoal/clay system and compact internal overview, rendered desktop/mobile |
| Product facts and user ownership | Sample record labelled; no fabricated proof; stored stage colors and unrelated changes preserved |
| Behavior and accessibility | Public navigation/anchor/focus/reflow checks; real clean admin login; representative authenticated dashboard/list/detail/pipeline/editor review; isolated provider-failure screenshot and two-role error associations |
| Regression verification | Latest 499 unit tests, production build, 14 public desktop/mobile smoke checks, 2 isolated recovery checks; focused lint and whitespace checks pass |
| Reusable workflow | Four canonical skills updated; active three hashes match; lifecycle guide and six scenarios retain product-specific intent, progressive loading and bounded ownership |
| Reduced overload | 54 to29 local skill files discovered; duplicate archive's288 files preserved; no global bundle installation |

Verdict: local design candidate passes the reviewed scope; independent bounded static review
found no introduced regression. Not a whole-application accessibility certification or a live
deployment. No applications submitted, automated hiring actions run, secrets changed or commit/
push performed. The separately promised external handoff has not arrived; integrate it if supplied.
Initial recovery test failed from route-announcer ambiguity and an overly narrow expected error;
corrected selector and blocked provider plus server-action requests, then both viewport tests passed.

## User rejection and reference-led rethink — 2026-09-08

The user rejected the cream/clay/olive direction as generic and insufficiently different.
The previous completion audit establishes functional checks, NOT accepted visual quality.
No orange, green, cream or previously rejected blue as the proposed brand direction.
Remove decorative eyebrow/kicker text above hero and section titles; start with the actual
heading. Explicit example: "A clearer view of your next hire" must not appear above the hero.
Functional labels, navigation, form labels and truthful sample disclosures are not decorative
eyebrows and must remain when needed for comprehension or accessibility.

Removed both landing heading kickers and their unused CSS rule. Full visual rethink remains
pending: evaluate composition, typography and product imagery together, not another token swap.
Origin/Mercury/GIC use a strong scene; Cosmos/Steep stage product content around large type.
Jeton's initial hero inspection was partially obscured by a regulatory notice; no acceptance
was clicked. References inform visual relationships, not copied claims or forbidden palettes.
The attached biotech style reference is evidence, not instructions: its green/bone palette
conflicts with the user's request and its #cef79 value is invalid. Avoid a blanket ban on
gradients, centered composition or italics: quality depends on purpose and execution.
Validate a representative visual direction before propagating another redesign globally.

## Aura resource and interactive demonstration — proposal

User wants Candidate review to change by person/process and demonstrate actual features.
Proposed states: received resume, evidence against role, pipeline/notes; explicit controls,
labelled synthetic examples, no fabricated metrics or unimplemented capability claims.
User supplied https://auragradients.vercel.app/ and its Deep Ocean CSS export for palette
exploration. Read attachment and site's llms.txt; inspected gallery and Deep Ocean preview.
Deep Ocean is cyan/blue/indigo on dark ground, so reference provision alone does not resolve
the earlier no-blue preference. Silver Mist (silver/pale lilac) is a non-blue alternative.
Frambuesa is not approved. Proposed roles: neutral white/ink for readable content, atmospheric
gradient confined to hero stage, solid controls and product surfaces; no decorative eyebrows.
Use Aura as an on-demand resource, not a new installed skill/dependency or site-wide effect.
Do not copy source prompt imperatives as authority or blindly apply five large blur layers
globally. Verify local composition, mobile contrast and rendering cost before propagation.
No new palette or interactive UI implemented at this checkpoint.

## Curated reference routing — 2026-09-08

Use resources on demand for one unresolved decision, not as a combined prompt bundle.

| Resource | Use | Guardrail |
| --- | --- | --- |
| https://colors.marcebollin.com/ | Sanzo Wada color combinations; inspect relative lightness/chroma and proportions | A pleasing palette is not evidence of readable UI contrast; respect rejected colors |
| https://auragradients.vercel.app/ | Atmospheric hero background experiments | Keep product content solid/readable; no global blur stack by default |
| https://styles.refero.design/ | Inspect hierarchy and product presentation; Steep detail reviewed | Extract relationships, not its peach/brown palette or mandatory font/shape instructions |
| https://github.com/VoltAgent/awesome-design-md | Find one relevant design analysis when a comparison is needed | Third-party analysis, not official brand rules; do not overwrite our brief or install a bundle |
| https://github.com/bradtraversy/design-resources-for-developers#fonts | Font discovery index | Follow selected family to original source; no bulk font collection |
| https://lexingtonthemes.com/blog/best-free-open-source-fonts | Find independent foundries and font families | Directory descriptions do not establish every font's license or quality |
| https://design.google/library/open-source-custom-fonts-google | Primary examples of type designed for brand/product constraints | Shortlist Mona Sans for flexible display/UI or Source Serif 4 for an editorial contrast; render real copy before selecting |
| https://github.com/FortAwesome/Font-Awesome | Optional icon source | Existing Lucide stays unless a demonstrated gap; preserve asset license/attribution if adopted |
| https://www.oneminutebranding.com/blog/open-source-project-branding | Consider consistency across site, README, favicon and documentation | Commercial article; unsupported adoption multiplier excluded; do not copy generic blue palette or promise outcomes |

Reusable method: decision -> narrow reference -> project-specific adaptation -> rendered check.
Do not confuse familiarity of a font/effect with poor design, or novelty with usability.
No new dependency, paid service, external upload or UI change from this resource review.

## Deliverable priority correction

User clarified the primary outcome is a GENERAL reusable design/branding workflow, then its
application to ScoutLane. Canonical guide: ../skills-lab/skills/design-intent/references/design-workflow.md
(path relative to ScoutLane repository root). It owns process/resource routing; this brief owns
only ScoutLane decisions. Active design-intent points to its bundled copy, loaded on demand.
Do not treat ScoutLane's rejected palette or heading restrictions as universal design rules.

## Current local direction — silver editorial + Deep Ocean

The landing now opens directly with “See the person. Follow the evidence.” in Newsreader,
supported by Mona Sans for product UI. There is no decorative eyebrow above the hero or section
headings. The central proof is an interactive candidate record: three clearly fictional people
and user-controlled Resume, Role evidence and Hiring process views. It never advances by itself.

Brand roles are deliberately separated. White/graphite protects reading, silver/lilac owns the
public identity, and the supplied Deep Ocean reference contributes cyan/indigo light only inside
the dark candidate rail and demo-workspace panel. The five-layer full-page blur recipe was not
copied: smaller radial layers fit the actual surfaces and avoid making the entire site blue.
The favicon and social image use the same aubergine-to-deep-ocean relationship.
Public job loading, Clerk sign-in/signup and transactional-email CTAs use the same roles;
legacy blue literals were removed from those rendered brand surfaces.

Anti-slop review at 1440×1000 and 390×844 found one dominant product scene, no feature-card wall,
no invented metrics/testimonials, no decorative motion and no small pre-heading label. Functional
product chrome and the sample-data disclosure remain. Mobile reflow has no page overflow; the
candidate strip scrolls horizontally without a persistent scrollbar. Candidate and tab controls
work by pointer and keyboard, and each tab references the persistent tab panel correctly.

Verification after the final color mix: 80 test files / 501 tests passed; after the last style-only
loading/auth/email sweep, 12 relevant tests, production build, focused lint and typecheck passed.
The landing E2E passed in desktop Chromium and Pixel 7 profiles,
including CTA anchor, Mina Patel selection and Role evidence content. The first E2E run failed only
because the two styled H1 spans concatenate without whitespace in `textContent`; the assertion now
accepts that DOM boundary and both profiles pass. Status: implemented and locally verified, reviewed
by the agent; not yet explicitly approved visually by the user, committed, pushed or deployed.

## One-family light/dark correction — 2026-09-09

The user rejected the Newsreader/Mona Sans pairing, the bold/plain/italic headline treatment and
the phrase “See the person. Follow the evidence.” as another familiar AI-landing pattern. The
landing and shared app typography now use one variable family, Geologica, including display, body
and data roles. Hierarchy comes from size, weight and the family’s CRSV/SHRP axes; the brand does
not depend on mixing unrelated families, italics or color-splitting a sentence.

The public landing opens with one continuous claim: “Every hiring decision should leave a trail.”
Light mode uses a Silver Mist field with graphite type and restrained lilac/aubergine controls.
Dark mode uses the supplied Deep Ocean idea as a cyan-to-indigo-to-purple atmosphere over a near-
black product surface. A labelled 44px Light/Dark control persists the visitor’s choice while the
pre-hydration theme script prevents a wrong-theme flash. Both themes retain solid record surfaces,
visible focus states and the same semantic accent roles.

The Candidate review remains the proof object, not decoration: changing the selected candidate or
record tab changes the rendered resume, role evidence and hiring-process content. At 390px, the
navigation fits without page overflow; candidate and tab rails scroll without persistent browser
scrollbars. The favicon/social image and final production checks must use the new headline and
palette before this direction is considered deployed.

## Admin composition and loading review — 2026-09-10

Verdict: PASS for the focused admin dashboard scope after revision.

- Wide-screen composition: at 1920px the hero begins at x=252 and uses 1376px of the 1700px main
  area. At 390, 768, 1192, 1440 and 1920px, document width does not exceed viewport width.
- Product insight: the page starts with the direct “Hiring overview” heading. The decorative
  eyebrow is gone, and the supporting sentence reports this week's intake plus the busiest stage
  from live dashboard data, with safe empty and singular states.
- Subtraction: the repeated “Manage all jobs” panel was removed; the hero keeps the single primary
  route to the jobs workspace.
- Brand continuity: Geologica, silver, graphite, aubergine and a restrained existing Deep Ocean
  wash carry the approved landing system into the admin without adding another font or palette.
- Loading and accessibility: each deferred chart reserves 354px, reduced-motion users do not get a
  pulsing placeholder, and an IntersectionObserver boundary defers the dynamic Recharts bundle.
  The daily trend is aggregated in PostgreSQL to at most 14 UTC-date rows. Chart headings and
  region labels remain available when the charts render.
- States checked: authenticated production build at wide and mobile widths; empty, singular and
  plural insight copy; deferred and visible chart unit-test states.
