# Vacuity report -- `<scope>`

Baseline: `<n>` tests, all passing, `<duration>`
Mutations: `<n>` attempted, `<n>` killed, `<n>` survived, `<n>` equivalent
Working tree: restored and verified clean

## Survivors

<!-- One block per survivor. These are the findings; put them first.
     Delete this section entirely and say "None" if there were no survivors. -->

### S-1  `<file>`:`<line>`  --  `<mutation in three words>`

Mutation:  `<the exact edit applied>`
Ran:       `<test file>` (`<n>` tests)
Result:    `<n>`/`<n>` passed -- SURVIVED
Missing:   `<what no test currently does>`
Suggested: `<the concrete assertion that would kill this mutant>`

## Killed

| # | File:line | Mutation | Killed by |
|---|---|---|---|
| K-1 | `<file>`:`<line>` | `<mutation>` | `<test name>` |

## Equivalent

<!-- A mutation that changed no observable behaviour. Each needs a one-sentence
     reason. If you cannot write the reason, it is a survivor, not an equivalent. -->

| # | File:line | Mutation | Why no behaviour changed |
|---|---|---|---|

## Not verified

<!-- Always present. "Nothing" is a valid entry; a missing section is not. -->

- <what was out of scope, inferred, or skipped, and why>
