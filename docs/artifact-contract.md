# Artifact contract

The skills in this repo compose by reading and writing **named markdown files**.
No skill names the skill that runs after it in control flow; each declares only
the artifacts it consumes and produces. This file is the single source of truth
for those names and is what keeps the chain from drifting.

If you change an artifact name, change it here first.

## The artifacts

| Artifact | Produced by | Contains |
|---|---|---|
| `risk-analysis.md` | `pr-risk-analyzer` | Ranked risks with tiers T1–T4, blast radius, diff signals |
| `regression-set.md` | `regression-selector` | Tiered test selection **and a runnable command** |
| `test-review.md` | `test-code-reviewer` | Findings as `file:line` + severity + suggested rewrite |
| `vacuity-report.md` | `test-vacuity-verifier` | Mutations attempted, killed, and survived |
| `release-readiness.md` | `release-readiness` | Verdict, blockers, residual risk, rollback |
| `RUN.md` | `qa-orchestrator` | The run ledger: every planned step, its status, its artifact |

Two skills do not fit the pattern, deliberately:

- **`playwright-test-generator` emits source code, not a markdown artifact.** Generated
  specs go to the repository's real test directory, never into a run directory. A test
  that lives in a run folder cannot be run by CI, which defeats the point of generating it.
- **`qa-orchestrator` owns `RUN.md` and the run directory itself.** It is the only skill
  that creates either.

## The graph

It is a directed **acyclic** graph. No back edges: a skill must never hand off
to something upstream of it, or two skills bounce forever.

```text
qa-orchestrator  (entry point only — never a downstream step)
      │  routes to one of the chains below, and owns RUN.md
      ↓
pr-risk-analyzer ──risk-analysis.md──> regression-selector
                                              │
                                     regression-set.md
                                              │
                                    [ the caller runs it ]
                                              │
                                     regression run result
                                              │
playwright-test-generator ──spec files──┐     │
        │                               │     │
test-code-reviewer ──test-review.md─────┤     │
        │                               │     │
  vacuity targets                       │     │
        ↓                               │     │
test-vacuity-verifier ──vacuity-report.md─────┤
                                              ↓
                                     release-readiness  (terminal)
```

`qa-orchestrator` has no inbound edge and `release-readiness` has no outbound one,
so the graph terminates from any entry point.

## The gap that is deliberate

**Nothing in this repo produces a regression *run result*.** `regression-selector`
emits a command; it does not execute it. The caller — a person, CI, or the
orchestrating agent — runs that command and supplies the output.

This is intentional and load-bearing. `release-readiness` must never issue a GO
without a real run result, and a skill that both selected and claimed to have run
the tests could satisfy that rule by asserting it. Keeping execution outside the
chain means the evidence has to come from somewhere real.

So `release-readiness` takes the run result as an input sourced from *the user or
CI*, not from an upstream skill. If it is absent, the verdict is `BLOCKED`.

## Tier vocabulary

`pr-risk-analyzer` assigns `T1`–`T4`. Consumers must map the tier rather than
re-deriving risk in a private vocabulary — two risk scales in one chain means the
downstream verdict silently disagrees with the upstream analysis.

| Tier | Meaning | `regression-selector` minimum | `release-readiness` |
|---|---|---|---|
| T1 | Highest risk | Tier A regardless of budget or mapping | HIGH; blocker lookup required |
| T2 | Elevated | Tier A if mapped at rank 1–3 | HIGH |
| T3 | Ordinary | Tier B | LOW unless a blocker trigger fires |
| T4 | Cosmetic | Tier C, may be skipped | LOW |

**The tier sets a floor, not a ceiling.** A test mapped at rank 1–3 directly to
changed code belongs in Tier A even when the change is T4 — running a test that
provably covers the edit is cheap, and a cosmetic classification is itself a
judgement that can be wrong. The tier can only promote a test, never demote one
that direct evidence places in Tier A.

A tier is a judgement, not a computation, and every skill that prints one says so.

## Where artifacts live

Every skill uses this wording, verbatim, so behaviour does not vary across the
chain:

> Under an orchestrator, read upstream artifacts from, and write this artifact
> into, the run directory the orchestrator names. Standalone, report the artifact
> in the reply and create no directories.

A standalone skill **never** creates `.testpilot/`. Only the orchestrator does.
No skill hardcodes a run-directory path.

## Degraded inputs

Every consumer works without its upstream artifact, at stated lower confidence.
A skill that cannot run without an upstream file is not independently useful,
which is a requirement here.

| Consumer | Missing upstream | Behaviour |
|---|---|---|
| `regression-selector` | `risk-analysis.md` | Select by mapping rank alone; `Confidence: low` |
| `test-vacuity-verifier` | `regression-set.md` | Choose targets from the diff; never mutate known-uncovered code |
| `release-readiness` | any of the four | Name it under `Not verified`; a missing run result means `BLOCKED` |

The one exception: `regression-selector` **requires** a test inventory and
refuses without it. That refusal is what distinguishes it from `pr-risk-analyzer`,
since both otherwise read a diff.

## Handing work to a skill that does not exist

Several skills are planned but unbuilt (see the README roadmap). A redirect to a
skill that is not installed is a dead end for the agent, so every such reference
must name the fallback:

> use `playwright-test-generator` (not yet in this repo — report the gap and stop)

Never redirect to an unbuilt skill without that clause.
