# Risk analysis -- BASE...HEAD

Scope:  N files, +N/-N, N commits
Method: static imports only; tiers are a judgement, not a score
Repo:   available | diff only -- fan-in marked [ASSUMPTION]

## Ranked risks

<!-- Highest tier first. At most 12 entries. Merge risks that share one root
     cause. Every entry cites file:line from the diff. -->

### R-1  [T1]  SHORT CLAIM IN ONE LINE

Where:      path/to/file.ext:START-END
Class:      behavioural | contract | config | schema | dependency | cosmetic
Trigger:    the area name from references/risk-triggers.md, or none
Failure:    what breaks, for whom, and what the wrong output actually is
Radius:     named callers with file:line, or [ASSUMPTION] plus the search that would resolve it
Reversible: yes (redeploy) | no (state why)
Notices:    who sees it first -- customer, on-call alert, nobody
Untested:   test file found, or "no test file names X"  [heuristic: proximity only]

## Untested surface

<!-- Proximity heuristic only. A test naming the file may not touch the changed
     line. Never call this coverage. -->

| File | Changed lines | Test file found | Tier |
|---|---|---|---|

## Signals

<!-- Facts read straight from the diff text. No repo access required. -->

| Signal | Where | Note |
|---|---|---|

## Change inventory

| File | Class | Lines | Fan-in | Tier |
|---|---|---|---|---|

<!-- T4 files may be collapsed into a single row with a count. -->

## Open questions

<!-- Only questions whose answer would change a tier. Number them Q-1, Q-2 and
     reference them from the risk entries they block. -->

| # | Question | Blocks | Who can answer |
|---|---|---|---|

## Not verified

<!-- Always present. "Nothing" is a valid entry; a missing section is not. -->

- what was elided, inferred, unreadable, or out of scope, and why

## Handoff

```text
next: regression-selector
input: risk-analysis.md -- "Ranked risks" and "Untested surface"
blocked_by: Q-n | none
```

<!-- This artifact names no tests to run and states no ship-or-hold verdict.
     Those are regression-selector's and release-readiness's outputs. -->
