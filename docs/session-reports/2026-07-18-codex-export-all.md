# Codex Export All

## Request

Richard invoked the `codex-export` skill and wanted all Codex sections/sessions exported so old sessions can be closed.

## Action

Ran from ScoutLane root:

```powershell
codex-export -All
```

## Result

Batch manifest:

```text
C:\Users\a2021\.codex\exports\codex-export-batch-2026-07-18-161326.json
```

Manifest summary:

- `exported`: 80
- `skipped-locked`: 5
- `skipped-workspace-root`: 13
- `failed`: 1

Locked sessions to retry after closing active sessions:

- `019e3c74-01b1-77c2-ac2b-6991ba7b0d21` - ScoutLane
- `019f76d9-7acf-7473-bdce-d7d551ff05c1` - ScoutLane
- `019f76ca-2446-7071-ba50-812c7b0fb788` - empenalo-2.0
- `019f64cf-81ed-7e70-8450-e57dc1c37eb2` - peru-tech-map
- `019f7132-31ea-77b2-b379-c3fde8bedaf2` - Second Brain root

One failed session:

- `019f70e6-b570-7242-8abf-2e9136ee82d3` - ScoutLane - `Cannot create a file when that file already exists.`

## Risk

The export integration created very large files under `docs/handoff/`:

- `docs/handoff/HANDOFF.md` - about 1.08 GB
- `docs/handoff/.handoff-index-cf42e513a49949a88a6a72abebb16923.tmp` - about 1.08 GB

They also showed encoding noise when read. Do not commit them without review. Prefer cleaning or regenerating the handoff index in a controlled pass.

## Next

Close inactive Codex sessions, then rerun targeted exports for locked session IDs with:

```powershell
codex-export -SessionId <id>
```

For workspace-root skips, only use `-IncludeWorkspaceRoots` after reviewing whether those generic roots should be archived.
