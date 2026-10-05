# QA run `<run-id>`

<!-- Written BEFORE anything is invoked, with every row PLANNED, and shown to the
     user at that point. Filling it in afterwards makes it a summary, not a plan. -->

Objective: "`<the user's sentence, verbatim — never tidied>`"
Matched:   `<R1 | R2 | R3>` on the phrase "`<the literal phrase matched>`"
Route:     reproducible from that phrase; every tie-break is model judgement.
           No verdict is computed in this file.
Directory: `.testpilot/runs/<run-id>/` — contains a `.gitignore` holding only `*`.
           Delete that one file to commit this run.

## Ledger

<!-- One row per planned step, including steps the caller performs.
     Status is one of exactly these, and nothing else:
       PLANNED  DONE  BLOCKED  FAILED
       SKIPPED:NO-INPUT  SKIPPED:NOT-APPLICABLE
       SKIPPED:USER-DECLINED  SKIPPED:TOOL-UNAVAILABLE
     There is no code for "seemed unnecessary". If none fits, the row is BLOCKED. -->

| # | Step | Skill | Status | Artifact | Note |
|---|---|---|---|---|---|
| 1 | `<what this step produces>` | `<skill or (caller)>` | `PLANNED` | - | - |
| 2 | `<...>` | `<...>` | `PLANNED` | - | - |

<!-- Note column is mandatory for every row that is not DONE:
     NO-INPUT          -> which input, and where you looked
     NOT-APPLICABLE    -> the cited observation that decides it
     USER-DECLINED     -> the question asked and the answer, quoted
     TOOL-UNAVAILABLE  -> the missing skill or command, and the substitute used
     BLOCKED           -> the row id that blocked it
     FAILED            -> the error, and whether the chain continued -->

## Inputs handed to each step

<!-- Pointers only: objective verbatim, run id, upstream artifact PATHS, output
     directory. Never a summary of an upstream artifact. -->

| # | Objective passed | Upstream paths passed | Output directory |
|---|---|---|---|
| 1 | verbatim | none | `.testpilot/runs/<run-id>/` |

## Reconciliation

<!-- Run this before reporting. For every DONE row, confirm the artifact exists on
     disk. If it does not, rewrite that row to FAILED, say so, then reprint the
     whole ledger verbatim. -->

- Rows claiming `DONE`: `<n>`
- Artifacts found on disk: `<n>`
- Rows rewritten to `FAILED` at reconciliation: `<none, or the row ids and why>`
- Files changed in this run: `<n>` (`<list>`)

<!-- A run in which RUN.md is the only file that changed is a failed run. -->

## Not run, and why

<!-- Always present. Every step that did not run, restated in one line each, so the
     omissions are readable without parsing the table. "Nothing" is a valid entry. -->

- `<step>` — `<status>` — `<reason>`
