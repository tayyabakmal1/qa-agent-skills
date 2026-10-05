# Regression set -- `<change label>`

Base:       `<base>`...HEAD (`<n>` files, `<n>` with logic changes)
Runner:     `<runner>` (filter syntax from `<file>`:`<line>`)
Full suite: `<duration>` (source: `<CI run id | durations report | user>`) -> `<selecting | running everything>`
Risk input: `<risk-analysis.md present | absent -- proximity-only selection>`
Confidence: `<high | medium | low>` -- `<n>` of `<n>` mappings at rank 1-3

## Run this

<!-- One command per runner. Every selector must appear verbatim in the inventory.
     If the runner is parallel with fail-fast off, emit a fast gate and a remainder
     command instead of one ordered list. -->

    <command with its real filter flags, ordered fastest-failing first>

## Tier A -- must run (`<n>`)

| # | Test | Maps to | Rank | Evidence |
|---|---|---|---|---|
| A-1 | `<test selector>` | `<file>`:`<line>` | `<1-3>` | <import, coverage record, or verified convention> |

## Tier B -- should run (`<n>`)

| # | Test | Why it is pulled in | Rank |
|---|---|---|---|
| B-1 | `<test selector>` | `<caller of changed symbol / shares fixture X / contract test>` | `<1-4>` |

## Skipped, with reason (`<n>`)

<!-- Never omit this. A silent skip is indistinguishable from a miss. -->

| Test or group | Reason |
|---|---|
| `<selector or directory>` | `<no import path to the change / rank-5 mapping only / formatting-only hunk>` |

## Gaps -- changed code with no covering test

<!-- The most valuable section in the file. A gap is a finding, not a failure of
     selection. Write "None" if there are none. -->

- `<file>`:`<line>` `<symbol>` -- <what changed, and that nothing in the command detects it>

## Residual risk -- not selectable statically

<!-- Named tests and flows, never categories. -->

- `<test or flow>` -- `<cross-service / time-dependent / shared mutable state / external sandbox>`

## Not verified

<!-- Always present. "Nothing" is a valid entry; a missing section is not. -->

- <stale coverage rejected, unconfirmed filter syntax, inferred mappings, untimed suite>
