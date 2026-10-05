# Contributing

Thanks for considering a contribution. This repo has a deliberately high bar for
what becomes a skill and a deliberately low bar for everything else — fixing a
typo, sharpening a decision table, or reporting a skill that produced bad output
are all genuinely useful.

## Setup

There is nothing to install.

```bash
git clone https://github.com/tayyabakmal1/qa-agent-skills
cd qa-agent-skills

node tests/run.mjs                    # test the validator
node scripts/validate-skills.mjs      # validate every skill
node scripts/sync-shared.mjs --check  # verify vendored references
```

You need Node 22 or newer. Everything uses the standard library only.

## Adding a skill

A skill is one file:

```text
skills/my-new-skill/SKILL.md
```

Optionally plus `references/`, `scripts/` and `assets/`. Those three are the only
subdirectories the specification defines — output templates go in `assets/`, and
worked examples go in the repo-root `examples/` directory.

1. **Open a proposal issue first.** Use the "Propose a skill" template. It asks
   the four questions that decide whether a skill gets merged, so it saves you
   writing something that will be rejected.
2. Copy [docs/skill-template.md](docs/skill-template.md) into your skill directory.
3. Read [docs/authoring-standard.md](docs/authoring-standard.md). The anti-patterns
   section is the part that matters.
4. Write an eval file at `evals/my-new-skill.json` — ideally before the skill body,
   because it forces you to define what "done" means.
5. Add a worked example under `examples/` with real output, not a description of
   output.
6. Run the three commands above until they pass.

### What gets a skill rejected

In rough order of how often it happens:

- **It duplicates an existing skill's trigger.** Two skills competing for the same
  phrasing means the agent picks wrong and the user gets the worse one.
- **It has no decision logic.** If the body has no table and encodes no judgement
  an expert would make, it is a prompt, not a skill.
- **Its output cannot be verified.** "Analysis" and "recommendations" are not
  artifacts. Name the thing it produces and how a reviewer checks it.
- **It restates what a competent engineer already knows.** Every line of consensus
  knowledge is context spent not doing the job.
- **It has no failure path.** A skill that assumes its inputs exist will invent
  them when they do not.

## Editing shared content

`shared/references/` holds knowledge used by more than one skill. Those files are
**vendored** — copied into each consuming skill's `references/` directory.

This looks like duplication and is deliberate. The `skills` CLI installs
individual skill directories, so a link from a skill to `../../shared/x.md`
resolves to nothing the moment a user installs it. One editable source plus a
machine-enforced copy beats a link that breaks for every user.

```bash
# 1. edit the canonical copy
vim shared/references/evidence-standards.md

# 2. propagate
node scripts/sync-shared.mjs --write

# 3. commit both the source and the vendored copies
```

Never edit a vendored copy directly — it carries a banner saying so, and CI will
fail on the mismatch. To vendor a file into a new skill, add the skill to
`VENDOR_MAP` in `scripts/sync-shared.mjs`.

## Style

- Direct and specific. No marketing language.
- Claims are falsifiable or absent. If something has not been verified, say so
  rather than implying it has.
- Address the agent in the imperative second person.
- Refer to capabilities, not tool names: "read the file", not `Read`.
- Tables beat paragraphs for anything an agent must branch on.

## Pull requests

The PR checklist mirrors the validator, so CI should not surprise you. Small,
focused pull requests get reviewed faster than large ones.

By contributing you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE).
