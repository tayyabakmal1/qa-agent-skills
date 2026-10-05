## What this changes

<!-- One or two sentences. -->

## Checklist

This mirrors `node scripts/validate-skills.mjs`, so CI failures should not surprise you.

- [ ] `node tests/run.mjs` and `node scripts/validate-skills.mjs` pass locally
- [ ] Frontmatter uses only spec fields (`name`, `description`, and optionally `license`, `compatibility`, `metadata`)
- [ ] `name` matches the directory name
- [ ] `description` names the input and output, contains a real trigger phrase, and has a `Not for:` clause
- [ ] `Do not use when` names at least one sibling skill
- [ ] Every input has an "if missing" behaviour
- [ ] There is at least one decision table, and every row is decidable from the inputs
- [ ] Outputs section shows the artifact shape rather than describing it
- [ ] Failure handling covers missing, oversized, and conflicting inputs
- [ ] Exactly one inline example, showing real output
- [ ] Shared content edited in `shared/`, then `node scripts/sync-shared.mjs --write`
- [ ] No agent-specific tool names, `${CLAUDE_*}` variables, or shell injection
