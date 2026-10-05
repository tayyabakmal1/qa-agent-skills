# Example: is this suite catching anything?

A worked run of [`test-vacuity-verifier`](../../skills/test-vacuity-verifier/SKILL.md)
against a small pricing module. Everything here is real output from a real run,
not an illustration.

## What the user asked

```text
Do the tests for the discount module actually catch anything?
```

## The starting position

[`input/`](input/) holds a pricing module and its test suite. The tests were
written the way people actually write them — one case per behaviour, sensible
values, nothing obviously missing. Before mutation:

```text
9 tests, all passing, 137ms
100.00% line coverage, 100.00% function coverage, 88.24% branch coverage
```

By the usual signals this suite is in good shape.

## The result

[`output/vacuity-report.md`](output/vacuity-report.md) — **6 of 10 mutations
survived**. The suite could not detect:

- a deleted zero-subtotal guard
- a deleted non-positive-quantity guard
- an off-by-one at the 50-unit discount tier
- an off-by-one at the 20-unit discount tier
- an off-by-one at the free-shipping threshold
- money rounding degraded from cents to ten-cent units

Four mutations were killed, so the suite is not worthless — it verifies the
discount rates themselves and the unknown-promo-code path.

## Why this is the point

The six survivors are one omission repeated: **the suite tests values inside each
range and never the edge of any range.** Line coverage cannot see that, because
every line does execute — just never with an input that would expose the
boundary. A reviewer asking "does each function have tests?" would pass this
suite too.

That is the gap this skill exists to close: not whether tests exist, and not
whether they run, but whether they would notice if the code broke.

## Reproducing it

```bash
cd input
npm test                                  # 9 passing
node --test --experimental-test-coverage test/discount.test.js
```

Then install the skill and ask your agent the question at the top of this file:

```bash
npx skills add tayyabakmal1/qa-agent-skills --skill test-vacuity-verifier
```

The mutations applied are listed in the report. Each was applied on its own, with
only the covering tests re-run, and the working tree restored and verified clean
between every one.
