# UI test design

Framework-independent thinking about browser tests. The Playwright-specific
mechanics live in the generator skill; what to test, what to assert and what to
leave alone lives here.

## What belongs in a browser test

Browser tests are the slowest and most fragile tests you own, so the bar is: does
the value of this test come from it running in a real browser? If the same
guarantee is available one layer down, take it one layer down.

| Belongs in the browser | Belongs at the API layer | Belongs in a unit test |
|---|---|---|
| The primary happy path through a real flow | Authorisation on every id-taking endpoint | Calculation, rounding, formatting |
| Navigation and state across pages | Boundary values on every field | Validation rules |
| Anything where the rendering *is* the behaviour | Idempotency and retry behaviour | Pure branching logic |
| Keyboard operability and focus management | Error responses and status codes | Date and currency arithmetic |

A suite of forty browser tests covering every validation message is a suite that
will be deleted within a year. Cover validation once in the browser to prove the
message surfaces, then cover the rules underneath it where they are cheap.

## Selecting elements

In descending order of durability:

1. **Accessible role and name** — how a user finds the control, and it fails when
   the control stops being reachable, which is a real bug worth failing on.
2. **Label, placeholder or visible text** — durable while the copy is stable.
3. **A dedicated test id** — stable, but asserts nothing about the user
   experience. Correct for elements with no accessible identity.
4. **CSS or XPath structure** — records today's DOM shape, not the behaviour.
   Breaks on refactors that changed nothing a user can perceive.

Never select by generated class names, `nth-child`, or a path through wrapper
elements. Those tests fail on cosmetic changes and pass through real regressions,
which is the worst of both directions.

If an element has no accessible name, that is usually a real accessibility defect.
Report it rather than reaching for a structural selector to work around it.

## Waiting

Every fixed sleep is either flake or wasted time, and usually both. Wait for the
condition you actually care about: the element being visible, the request having
settled, the text having changed.

The tell for a bad wait is a duration in the test. `waitForTimeout(2000)` says
"I do not know what I am waiting for". Replace it with the state that must hold
before the next step is meaningful.

## Assertions

An assertion that cannot fail is documentation. Three rules:

- **Assert the state, not the message.** For a rejected action, assert both the
  message *and* that nothing changed — no row written, no counter moved, no email
  queued. "An error appeared" is half a test.
- **Assert what the user perceives**, not implementation detail. Assert that the
  order shows as cancelled, not that a particular function was called.
- **One behaviour per test.** A test asserting six unrelated things reports one
  failure and hides five.

Snapshot assertions deserve suspicion. A snapshot that nobody reads passes until
someone regenerates it, at which point it passes again. Use them for genuinely
structural output, never as a substitute for asserting the thing you care about.

## Test independence

Each test creates what it needs and cleans up after itself. Tests that depend on
execution order pass locally and fail under parallelism, and the failure looks
like flakiness rather than the design error it is.

Shared mutable state between tests — a seeded user, a fixed account, a global
counter — is the most common cause of a suite that fails only in CI. If two tests
mutate the same record, they cannot run in parallel and one of them will
eventually lose.

Authentication is the usual exception worth making: signing in through the UI for
every test is slow and tests the login flow hundreds of times. Establish the
session once and reuse it, while keeping one test that genuinely exercises login.

## Sources of nondeterminism

Check each before concluding a test is "just flaky":

- **Time** — `now()` in the code under test, dates near midnight, timezone
  differences between the runner and the assertion, daylight-saving boundaries.
- **Ordering** — unsorted API responses rendered in arrival order, parallel
  workers touching shared data, animation timing.
- **Data** — leftover records from a previous run, autoincrement ids assumed to
  start at 1, tests asserting on "the first row".
- **Environment** — locale affecting number and date formatting, viewport size
  changing which elements render, network latency turning a race into a failure.

A test that fails one run in twenty has a cause. Retrying it until it passes
converts a real defect into invisible technical debt.
