# Skill template

Copy the block below into `skills/<your-skill-name>/SKILL.md` and replace every
angle-bracketed placeholder. Then run `node scripts/validate-skills.mjs`.

This file deliberately lives in `docs/` rather than `skills/_TEMPLATE/`. The
`skills` CLI discovers any directory under `skills/` that contains a `SKILL.md`
and would install a template as though it were a real skill.

Read [authoring-standard.md](authoring-standard.md) for why each section exists
and what makes a good one.

---

````markdown
---
name: skill-name-in-kebab-case
description: >-
  <What it converts: INPUT to OUTPUT, in one clause.> Use when <two to four
  literal phrasings a user would actually type>. Not for <the nearest
  neighbouring skill's job>.
---

# <Skill Name>

## Purpose

<Two to four sentences. What this skill produces, and the one judgement call it
exists to make. Name the artifact it emits.>

**Use when**

- <a situation, phrased as something that is true in the repo or the conversation>
- <a situation>
- <a situation>

**Do not use when**

- <situation> -- use `<other-skill>` instead
- <situation> -- this skill will produce confident garbage because <reason>

## Inputs

| Input | Required | Where to get it | If missing |
|---|---|---|---|
| <name> | yes | <file path, ticket, git range, the user> | <ask / stop / infer and flag> |
| <name> | no | <...> | <default behaviour> |

## Workflow

1. **<Imperative verb and object.>** <One or two lines on how.> Produces: `<artifact>`.
2. **<Verb and object.>** Consult [references/<file>.md](references/<file>.md) when <condition>.
3. **<Verb and object.>** Stop and ask the user when <condition>.
4. **Self-check** against Definition of done. Do not report completion before every box is true.

## Decision logic

<The tables and rules that make this a skill rather than a prompt. At least one
table. Every row must be decidable from the inputs -- no row may require taste.>

| Condition | Then | Skip when |
|---|---|---|
| ... | ... | ... |

## Outputs

**Artifact:** `<filename>.md`

**Shape:**

```text
<15-25 line skeleton of the real artifact, with field names>
```

**Evidence requirements**

- Every claim cites its source: `file:line`, a ticket id, command output, or an HTTP response.
- Anything inferred rather than read is marked `[ASSUMPTION]`.
- <one domain-specific evidence rule>

**Definition of done** (all must be true; this is the stop condition)

- [ ] <objectively checkable>
- [ ] <objectively checkable>
- [ ] Output size within <explicit cap>

**Handoff**

```text
next: <downstream-skill> | none
input: <path or section of this skill's artifact>
blocked_by: <ids of open questions that must resolve first> | none
```

## Failure handling

| Situation | Do this |
|---|---|
| <missing input> | <stop / degrade / ask> |
| <input too large or too vague> | <split and say so> |
| <conflicting sources> | <surface both, never silently pick> |
| <cannot produce evidence> | <emit a partial artifact and record what is blocked; never fabricate> |

## Example

**Input:** <three to six lines of realistic input>

**Output (slice):**

```text
<10-20 lines of REAL output, not a description of output>
```

## Related skills

| Skill | Relationship |
|---|---|
| `<skill>` | Upstream -- consumes its `<artifact>` |
| `<skill>` | Downstream -- hand off `<section>` |
| `<skill>` | Easily confused -- that one does X, this one does Y |
````

---

## Length targets

| Thing | Target | Hard cap |
|---|---|---|
| `description` | 200-500 characters | 1024 (spec limit) |
| `SKILL.md` body | 120-280 lines | 500 (spec recommendation; the validator errors above it) |
| Any single table | 25 rows | more goes to `references/` |
| Inline example | 25 lines | more goes to `references/` |

Move content into `references/` when it is a lookup catalogue, is consulted in
only one branch of the workflow, or exceeds about 40 lines. Keep it in `SKILL.md`
when it is consulted on every run, is a decision rule, or is the output contract.

## Allowed subdirectories

Only the three the specification defines:

| Directory | Contents |
|---|---|
| `references/` | Documentation the agent reads on demand |
| `scripts/` | Executable code the agent can run |
| `assets/` | Templates and static resources the agent fills in or copies |

There is no `templates/` or `examples/` inside a skill. Output templates belong
in `assets/`. Worked examples belong in the repo-root `examples/` directory,
which is not installed.
