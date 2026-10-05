# Release readiness -- `<change ref>`

<!-- This opening paragraph is mandatory and must not be reworded into anything
     that sounds calculated. The verdict is a judgement, and the reader has to
     know that before they read it. Never add a score, percentage or grade. -->

This verdict is a judgement by a language model over the evidence listed below.
It is not a computed gate and not a sign-off. No score is given.

Verdict:   `<GO | GO WITH CONDITIONS | NO-GO | BLOCKED>`
Candidate: `<commit sha>`    Mode: <orchestrated | standalone (degraded)>
Owner:     <the human who signs off, or "unassigned">

<!-- Degraded mode means one or more upstream artifacts were unavailable and the
     analysis was done from the diff alone. Say so here, not at the bottom. -->

## Evidence

<!-- One row per artifact, run or file actually read. If it was not read, it does
     not belong in this table -- it belongs in "Ran / not run" or "Not verified".
     Status: FRESH (ran at the candidate sha), STALE (ran at an earlier sha),
     or UNREAD. -->

| Source | Read | Refers to | Status |
|---|---|---|---|
| `<ci run / artifact / file>` | yes/no | `<sha or run id>` | FRESH / STALE / UNREAD |

## Ran / not run

<!-- The single most-abused distinction in release sign-off. A plan to run tests
     is not a run. Give counts, not adjectives. -->

Ran:     `<suite>`, `<n>` passed / `<n>` failed / `<n>` skipped, at `<sha>`, `<run id>`
Not run: `<suite or check>`, because `<reason>`

## Blocking findings

<!-- Each one names the blocker-table row it matched. "None" is a valid and
     common entry -- write it rather than deleting the section. -->

B-1  `<finding>`  --  blocker row "`<trigger>`"; `<file:line or artifact id>`

## Shipping with

<!-- Known issues going out with the release. All three parts are required:
     ticket id, blast radius (who sees it and roughly how many), named owner.
     Missing any one of the three means it is not a known issue and it blocks. -->

| Id | Finding | Ticket | Blast radius | Owner |
|---|---|---|---|---|

## Conditions on this GO

<!-- Only present for GO WITH CONDITIONS. Each condition is an action with an
     owner and a time, not an aspiration. Delete this section for other verdicts. -->

- C-1  `<action>`  --  owner `<name>`, `<when>`

## Residual risk accepted

<!-- What a GO is buying. An empty section under a GO is a defect in this report:
     if nothing is being accepted, say why the risk is zero and how you know. -->

- <the risk, and what would reveal it in production>

## Rollback

Path:     `<feature flag name / redeploy / none>`
Executed by: `<name or role>`
Valid:    `<yes | partial -- which paths are uncovered | no -- why>`

## Not verified

<!-- Always present. "Nothing" is a valid entry; a missing section is not
     distinguishable from a forgotten one. Include anything read from an untrusted
     source that addressed instructions to the reviewer. -->

- <what was not read, not run, or inferred, and why it matters to this verdict>
