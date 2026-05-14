# ScoutLane — Docs Index

Tracked documentation for ScoutLane. The authoritative source for outstanding work is `BACKLOG.md`; per-session progress lands in `session-reports/`.

## Contents

| File | Purpose |
|------|---------|
| **`PROJECT-GUIDE.md`** | Full project overview — use cases, user personas, user manual per feature, OpenVid demo plan, architecture reference |
| **`PLAN.md`** | Spec completion plan against the take-home assessment — what's done, gap analysis, execution phases |
| **`BACKLOG.md`** | Single source of truth for outstanding work. Tasks organized by sprint (E=foundation, M=demo-critical, H=architectural). Each task is a 30–90 minute subtask |
| **`NEXT-STEPS.md`** | Archived original roadmap from early development. Many items now implemented |
| **`PROGRESS-REPORT.md`** | Archived gap analysis. Original assessment of requirements vs current state |
| **`UX-TEST-PROTOCOL.md`** | Dual-layer testing protocol: automated Playwright smoke (Phase A) + moderated human UX sessions (Phase B) |
| **`codebase/`** | Auto-generated architecture documentation: ARCHITECTURE.md, CONCERNS.md, CONVENTIONS.md, INTEGRATIONS.md, STACK.md, STRUCTURE.md, TESTING.md |
| **`session-reports/`** | Per-session development reports documenting progress, decisions, and blockers |

## Workflow

1. **`docs/BACKLOG.md`** drives all development — pick a task, create a branch, implement, merge
2. Each session logs progress to **`docs/session-reports/`** with date-stamped files
3. **`docs/UX-TEST-PROTOCOL.md`** is referenced before merges (Phase A smoke) and at milestone boundaries (Phase B human sessions)
4. **`docs/PROJECT-GUIDE.md`** is updated when features stabilize (use cases, user manual, demo script)
5. **`docs/PLAN.md`** tracks overall spec completion posture
