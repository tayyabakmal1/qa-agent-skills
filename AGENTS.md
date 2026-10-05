# AGENTS.md

Conventions for an agent working **on** this repository. The skills this repo
ships are in `skills/` and are installed into other projects; this file is about
maintaining the repo itself.

## What this repo is

A collection of Agent Skills for quality engineering. The repo is the product:
no backend, no database, no web app, no published package. Markdown plus two
Node scripts with zero dependencies.

## Commands

```bash
node tests/run.mjs                    # test the validator against its fixtures
node scripts/validate-skills.mjs      # validate every SKILL.md
node scripts/sync-shared.mjs --check  # verify vendored references are current
node scripts/sync-shared.mjs --write  # refresh vendored references after editing shared/
```

All four run in CI. There is nothing to install and no build step.

## Layout

| Path | Purpose |
|---|---|
| `skills/<name>/SKILL.md` | The product. The only thing `npx skills add` installs. |
| `shared/references/` | Canonical copies of knowledge used by more than one skill. |
| `examples/` | Committed real runs. Must contain no `SKILL.md` files. |
| `evals/` | Per-skill eval cases. |
| `docs/` | Contributor documentation, including the skill template. |
| `scripts/` | Repo maintenance only. Never invoked by a skill. |

## Rules that the validator enforces

Read [docs/authoring-standard.md](docs/authoring-standard.md) before writing or
editing a skill. The rules most often broken:

- `name` in frontmatter must equal the skill's directory name.
- Frontmatter may contain only `name`, `description`, `license`, `compatibility`,
  `metadata`, `allowed-tools`. Anything else fails.
- A skill may not link outside its own directory. Shared content is vendored by
  `scripts/sync-shared.mjs`, never linked with `../`.
- Only `references/`, `scripts/` and `assets/` may exist inside a skill.
- Never add a `SKILL.md` outside `skills/` -- it would be installed as a real skill.

## Style

Prose is direct and specific. No marketing language. Claims are falsifiable or
absent -- if something has not been verified, say so rather than implying it has.
