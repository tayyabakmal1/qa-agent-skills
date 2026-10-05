# Vacuity report -- src/discount.js

Baseline: 9 tests, all passing, 137ms
Coverage: 100.00% line, 100.00% function, 88.24% branch
Mutations: 10 attempted, 4 killed, 6 survived, 0 equivalent
Working tree: restored and verified clean (`git status --porcelain` empty)

Every line of `src/discount.js` is executed by the suite and every test passes.
Six of ten deliberate defects went undetected.

## Survivors

### S-1  src/discount.js:11  --  guard deleted

```text
Mutation:  if (subtotal <= 0) return 0;   ->   if (false) return 0;
Ran:       test/discount.test.js (9 tests)
Result:    9/9 passed -- SURVIVED
Missing:   every applyPromo test passes a positive subtotal; nothing exercises
           zero or a negative, so the guard is unasserted
Suggested: assert.equal(applyPromo(0, 'SAVE10'), 0)
           assert.equal(applyPromo(-50, 'SAVE10'), 0)
```

### S-2  src/discount.js:19  --  guard deleted

```text
Mutation:  if (quantity <= 0) return 0;   ->   if (false) return 0;
Ran:       test/discount.test.js (9 tests)
Result:    9/9 passed -- SURVIVED
Missing:   no test calls volumeDiscount with a non-positive quantity
Suggested: assert.equal(volumeDiscount(0, 10), 0)
```

### S-3  src/discount.js:21  --  boundary relaxed

```text
Mutation:  quantity >= 50   ->   quantity > 50
Ran:       test/discount.test.js (9 tests)
Result:    9/9 passed -- SURVIVED
Missing:   the 15% tier is only tested at 60 units. Nothing tests exactly 50,
           so the tier boundary itself is unverified
Suggested: assert.equal(volumeDiscount(50, 10), 425)
```

### S-4  src/discount.js:22  --  boundary relaxed

```text
Mutation:  quantity >= 20   ->   quantity > 20
Ran:       test/discount.test.js (9 tests)
Result:    9/9 passed -- SURVIVED
Missing:   the 10% tier is only tested at 25 units; exactly 20 is untested
Suggested: assert.equal(volumeDiscount(20, 10), 180)
```

### S-5  src/discount.js:28  --  boundary flipped

```text
Mutation:  subtotal > FREE_SHIPPING_THRESHOLD   ->   subtotal >= FREE_SHIPPING_THRESHOLD
Ran:       test/discount.test.js (9 tests)
Result:    9/9 passed -- SURVIVED
Missing:   free shipping is tested at 150 and paid shipping at 50. An order of
           exactly 100 -- the threshold the rule is written about -- is never tested,
           so whether the threshold is inclusive is undefined by the suite
Suggested: assert.equal(shippingCost(100, false), 5.99)
```

### S-6  src/discount.js:34  --  rounding precision reduced

```text
Mutation:  Math.round(n * 100) / 100   ->   Math.round(n * 10) / 10
Ran:       test/discount.test.js (9 tests)
Result:    9/9 passed -- SURVIVED
Missing:   every expected value in the suite is a whole number or one decimal
           place, so cent-level rounding is never observed. A money function
           could silently round to 10c and no test would notice
Suggested: a case whose correct answer has non-zero cents, e.g.
           assert.equal(applyPromo(99.99, 'SAVE10'), 89.99)
```

## Killed

| # | File:line | Mutation | Killed by |
|---|---|---|---|
| K-1 | discount.js:23 | `quantity >= 10` to `quantity > 10` | volumeDiscount gives 5% at 10 units |
| K-2 | discount.js:28 | `&&` to `\|\|` | shippingCost charges standard rate for small orders |
| K-3 | discount.js:21 | `rate = 0.15` to `rate = 0.14` | volumeDiscount gives 15% at 60 units |
| K-4 | discount.js:13 | unknown code returns `0` instead of `subtotal` | applyPromo ignores an unknown code |

## Equivalent

None.

## Not verified

- Only `src/discount.js` was in scope. No other module was mutated.
- Ten mutation targets were selected from the Decision logic table; the file
  contains further candidates (the promo-rate table values, the expedited
  shipping constant) that were not attempted within the budget.
- Test-to-code mapping was read from the import statement in
  `test/discount.test.js`, not inferred.

## Reading of this result

The pattern in the survivors is one pattern, not six: **the suite tests values
inside each range and never the edge of any range.** Three of the six survivors
(S-3, S-4, S-5) are the same omission at three different boundaries, and the two
guard survivors (S-1, S-2) are the same omission at the lower edge of the input
domain.

That is what makes this worth running rather than reading the tests. The suite
looks thorough, covers 100% of lines, and would pass any review that asks whether
each function has tests. It cannot detect an off-by-one at any tier boundary.
