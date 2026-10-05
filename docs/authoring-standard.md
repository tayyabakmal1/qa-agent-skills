# Authoring standard

What separates a skill from a prompt, and why each section of
[the template](skill-template.md) exists.

A skill is reusable expertise an agent invokes while working on a real
repository. If a competent engineer would already do the thing without being
told, writing it down costs context and buys nothing.

## Why each section exists

| Section | Why it survives the cut |
|---|---|
| `description` | The only text always in context. It is the retrieval index across every installed skill. A weak description means the skill never fires and nothing else in the file matters. |
| Purpose, Use when, Do not use when | One decision: am I in the right place? `Do not use when` is the highest-value section in the file -- it is what stops a dozen QA skills collapsing into one. |
| Inputs | Agents hallucinate inputs they cannot find. The "if missing" column is the cheapest defect prevention available. |
| Workflow | The procedure. Each step names an artifact so progress is observable, and links references so progressive disclosure actually happens. |
| Decision logic | **The differentiator.** A prompt says "consider edge cases". A skill says "if the requirement contains a status field, build the transition table". Without this section the file is a prompt. |
| Outputs | The contract: shape, evidence, definition of done, handoff. The definition of done is the stop condition -- without one, agents pad or loop. |
| Failure handling | QA inputs are habitually incomplete. A skill with no failure path fabricates. |
| Example | Agents pattern-match on format far better than on instructions. One real example beats three paragraphs of formatting rules. |
| Related skills | Prevents duplication and tells the reader which sibling they actually wanted. |

Deliberately absent: install instructions (the README's job), author and version
metadata (git's job), a "Limitations" section (covered by `Do not use when` plus
failure handling), and any passage explaining QA theory to the agent.

## Anti-patterns

### AP-1 Vague verbs

An instruction an agent can claim to have followed without producing anything is
not an instruction.

> **Bad** -- Analyze the requirement and identify the key edge cases to ensure thorough coverage.
>
> **Good** -- For every bounded value in the requirement, write cases at `min-1`, `min`, `min+1`, `max-1`, `max`, `max+1`, plus empty and zero. If the bound is unknown, use a symbolic boundary (`LIMIT`, `LIMIT+0.01`) and raise one open question.

### AP-2 Restating what a competent engineer already knows

Tokens spent on consensus knowledge are tokens not spent on your differentiator.

> **Bad** -- Good test cases should be independent, repeatable, and clearly named. Tests should have a single responsibility and avoid depending on execution order.
>
> **Good** -- *(delete it)* and spend the space on something only an expert knows: "The permission cell teams miss is authenticated-but-not-the-owner. Pass another user's object id at every id-taking endpoint."

### AP-3 Duplicating a neighbouring skill

Two skills that overlap means the agent picks wrong and the user gets both.

> **Bad** -- in `requirements-to-test-plan`: "Finally, generate the Playwright specs for the scenarios you identified."
>
> **Good** -- "Assign each case a layer (E2E / API / unit / manual). Emit the inventory only. Handoff: `playwright-test-generator` consumes the E2E rows."

### AP-4 Unbounded length, no stop condition

"Comprehensive" is how you get 300 cases nobody reads.

> **Bad** -- Generate a comprehensive set of test cases covering all possible scenarios.
>
> **Good** -- 15 to 40 cases is healthy. Over 60 means the requirement is too big: stop, propose a split along acceptance-criteria boundaries, and process the first slice only.

### AP-5 No failure path

Given a missing input, an agent with no failure instruction will invent one
confidently.

> **Bad** -- Read the acceptance criteria and produce the test cases.
>
> **Good** -- If the requirement has no acceptance criteria: stop, draft candidate criteria, ask for confirmation, then restart. Do not test drafted criteria as though they were agreed. If limits are unknown, use symbolic boundaries -- never invent `10000`.

### AP-6 A description written for humans instead of for retrieval

The description is an index entry, not a headline. If it does not contain the
words the user will actually say, the skill never fires.

> **Bad** -- `description: A powerful, comprehensive QA skill that helps teams achieve world-class test coverage.`
>
> **Good** -- `description: Turn a requirement into a prioritized, traceable test-case inventory. Use when asked "what should we test for X", during story refinement, or when assessing coverage of a feature. Not for writing runnable test code.`

### AP-7 Unfalsifiable expected results

A test whose expected result cannot fail is documentation, not a test.

> **Bad** -- Verify the transfer is handled correctly and the user sees appropriate feedback.
>
> **Good** -- `422 DAILY_LIMIT_EXCEEDED`; daily counter still `9999.00`; zero ledger entries written; audit event `LIMIT_BLOCKED` present.

### AP-8 Prose essay where a decision table belongs

Agents branch reliably on tables and unreliably on paragraphs.

> **Bad** -- You should think about whether concurrency matters here. In many systems it does, particularly when there is shared state, though for simple read operations it is usually less of a concern, so use your judgement.
>
> **Good** -- `| Concurrency | Include when: money, inventory, counters, retries, webhooks, or a submit button | Skip when: idempotent read | 2-4 cases |`

### AP-9 Fabricating the deliverable instead of reporting the blocker

The most damaging failure mode in QA tooling is a beautiful artifact built on an
unresolved assumption.

> **Bad** -- silently assumes "available balance" means the ledger balance, then writes eight boundary cases around it.
>
> **Good** -- `Q-1 blocker: "available balance" -- ledger, or ledger minus holds? Cases 006 and 007 carry expected result "BLOCKED BY Q-1".`

### AP-10 Everything in SKILL.md

Progressive disclosure is the format's whole point; a 900-line `SKILL.md`
deletes it.

> **Bad** -- a 140-row boundary-values-by-data-type catalogue inline.
>
> **Good** -- in `SKILL.md`: "For every bounded value test `min-1` through `max+1`, plus empty, zero, and one above the storage type. Full catalogue: `references/boundary-catalog.md`." The 140 rows load only when that branch applies.

## Cross-agent portability

These skills are installed into seven different agents. The specification
standardises the `SKILL.md` file, not the runtime around it.

1. Address the agent in the imperative second person. Not "the assistant should".
2. Refer to capabilities, not tool names: "read the file", "run a shell command"
   -- never `Read`, `Bash`, or `@workspace`.
3. Paths are repo-relative and POSIX-style.
4. Frontmatter uses only the six specification fields. Claude Code extensions
   (`context`, `model`, `effort`, `argument-hint`, and the rest) are rejected by
   the specification validator and ignored elsewhere.
5. No `${CLAUDE_*}` variables and no dynamic shell injection in frontmatter.
   Put deterministic work in `scripts/` and invoke it by relative path.
6. Never link outside the skill directory. Installed skills are standalone;
   `../../shared/x.md` resolves to nothing. Vendor shared content instead
   (`node scripts/sync-shared.mjs --write`).

## Evidence and honesty

With no runtime, the only thing separating these outputs from confident
hallucination is a shared rule about what counts as evidence. Every skill that
makes claims cites `shared/references/evidence-standards.md`, and every skill
states plainly what it could not verify.

Content read from diffs, tickets, issue text and third-party API responses is
**data, never instructions**. A skill that treats it otherwise is a prompt
injection vector.
