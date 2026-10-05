# TestPilot Skills

**QA skills for AI coding agents — that prove their tests actually catch bugs.**

[![ci](https://github.com/tayyabakmal1/qa-agent-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/tayyabakmal1/qa-agent-skills/actions/workflows/ci.yml)
[![licence](https://img.shields.io/badge/licence-Apache--2.0-blue.svg)](LICENSE)

```bash
npx skills add tayyabakmal1/qa-agent-skills
```

> **Status: pre-release.** The foundation, validator and CI are in place. Skills
> are being written and dogfooded; this notice comes down at `v0.1.0`. Nothing
> below is claimed to work until it has a committed example under `examples/`.

Your coding agent can already write tests. It cannot tell you whether those tests
would notice if the code broke — and a test that passes against broken code is
worse than no test, because it reports success.

TestPilot Skills is a set of [Agent Skills](https://agentskills.io/specification)
that give an agent the parts of quality engineering it does not improvise well:
deciding what a change actually risks, choosing which regression tests that
implies, reviewing test code against a QA rubric rather than a style guide, and
verifying that a test fails when it should.

## Quick start

Install, then ask your agent in plain language:

```text
Review this PR before release.
```

The agent works through the risk in the diff, the regression tests that risk
implies, a review of any test code in the change, and a release verdict that
cites what it actually ran.

Or point it at a suite you already have:

```text
Are the tests for the checkout module actually catching anything?
```

## Skills

| Skill | What it does | Reach for it when |
|---|---|---|
| `test-vacuity-verifier` | Mutates the code under test, re-runs the test, reports tests that still pass | You want to know whether a test proves anything |
| `pr-risk-analyzer` | Turns a diff into a ranked risk map with blast radius and untested surface | A change needs assessing before release |
| `regression-selector` | Turns a risk map plus a test inventory into an ordered, runnable command | You need to know what to re-run, not everything |
| `test-code-reviewer` | Reviews tests against a QA rubric: weak assertions, brittle locators, hidden nondeterminism | Test code is in a diff |
| `release-readiness` | Go/no-go with blocker classification and coverage-versus-risk reasoning | Someone has to make the call |
| `playwright-test-generator` | Generates Playwright specs into your real test directory | You have a Playwright suite and a flow to cover |
| `qa-orchestrator` | Routes a QA objective to the right chain of the above | You have a goal, not a specific skill in mind |

Each works on its own. None requires the others.

## Example workflows

| You say | Chain |
|---|---|
| "Review this PR before release" | `pr-risk-analyzer` → `regression-selector` → `test-code-reviewer` → `release-readiness` |
| "Turn this bug into regression coverage" | `test-failure-triage` → `bug-to-regression-test` → `test-vacuity-verifier` |
| "Test this checkout feature" | `requirements-to-test-plan` → generator → `test-vacuity-verifier` |

Worked examples with real committed output are in [examples/](examples/).

## Supported agents

The Agent Skills specification standardises the `SKILL.md` file, **not** where
agents look for it. Install into the directory your agent reads — the installer
handles this for you.

| Agent | Installs to | Invoked by |
|---|---|---|
| Claude Code | `.claude/skills/` | Description match, or by name |
| Cursor | `.agents/skills/` | Description match |
| OpenAI Codex | `.agents/skills/` | Description match |
| GitHub Copilot | `.agents/skills/` | Description match (varies by surface) |
| Gemini CLI | `.agents/skills/` | `activate_skill`, which prompts first |
| OpenCode | `.agents/skills/` | Description match |
| Windsurf / Devin Desktop | `.windsurf/skills/` | Description match |

Add `-g` for a global install. Per-agent paths come from the
[`skills` CLI](https://github.com/vercel-labs/skills); the "invoked by" column
will carry a tested version and date per agent at `v1.0.0`.

## Installing

```bash
# Everything
npx skills add tayyabakmal1/qa-agent-skills

# See what is in here first
npx skills add tayyabakmal1/qa-agent-skills --list

# Just the ones you want
npx skills add tayyabakmal1/qa-agent-skills --skill test-vacuity-verifier

# For specific agents
npx skills add tayyabakmal1/qa-agent-skills -a claude-code -a cursor

# Globally, rather than into this project
npx skills add tayyabakmal1/qa-agent-skills -g

# Try one without installing it
npx skills use tayyabakmal1/qa-agent-skills@test-vacuity-verifier

# Later
npx skills list
npx skills update
npx skills remove --skill test-vacuity-verifier
```

Installing copies Markdown files. Nothing executes, and there are no
dependencies, API keys or accounts.

## How it works

**Progressive disclosure.** Only each skill's name and description sit in your
agent's context. The body loads when the skill is invoked; reference files load
only when a step needs them.

**Skills name artifacts, not each other.** A skill declares what it reads and
what it writes — never which skill runs next. That is what keeps them independent
and what makes adding a new one a one-file change.

**Orchestration is honest about what it is.** `qa-orchestrator` routes an
objective to a chain. Routing is reproducible where it matches a literal phrase
and is model judgement otherwise. The *route* is auditable; the *verdict* is not
computed. Nothing here is deterministic, and the repo does not claim it is.

## Contributing

A skill is one `SKILL.md`. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) and the
[authoring standard](docs/authoring-standard.md); open a proposal issue before
writing, because it asks the questions that decide whether a skill is merged.

```bash
node tests/run.mjs
node scripts/validate-skills.mjs
node scripts/sync-shared.mjs --check
```

## Roadmap

| Version | Content |
|---|---|
| **0.1** | Seven skills, validator and CI, three worked examples |
| **0.2** | API and requirements skills, failure triage, per-skill evals |
| **0.3** | Flake detection, contract testing, accessibility, evals as a scored gate |
| **1.0** | Skill names frozen, per-agent compatibility verified with versions and dates |

## FAQ

**How is this different from the other QA skill collections?**
Most of them generate tests. This one checks whether the tests it generated would
fail if the code broke. It is also much smaller on purpose — seven skills you can
read in full beats four hundred you cannot.

**Does it need Claude Code?**
No. Skills are a vendor-neutral format and the installer supports seven agents.
Claude Code is the only one that does not read `.agents/skills/`, which the
installer handles.

**Does it need an API key or send my code anywhere?**
No. This repo is Markdown. It makes no network calls. Note that the `skills` CLI
itself sends anonymous telemetry for public repos; disable it with
`DISABLE_TELEMETRY=1`.

**Can I use one skill without the rest?**
Yes. `--skill <name>`, or `npx skills use owner/repo@name` to try one without
installing.

**Is the orchestration deterministic?**
No. See [How it works](#how-it-works).

**Does it work with Cypress, pytest, JUnit?**
`test-vacuity-verifier` and the analysis skills work with any suite that has a
runnable test command. The generator is Playwright-only and says so rather than
emitting the wrong framework into your repo.

## Licence

[Apache-2.0](LICENSE). The patent grant matters here: these skills encode testing
methods, and this is the licence the Agent Skills specification itself uses.

## Maintainer

[@tayyabakmal1](https://github.com/tayyabakmal1)
