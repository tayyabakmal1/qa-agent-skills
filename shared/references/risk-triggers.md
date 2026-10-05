# Risk triggers

The areas where an ordinary-looking change carries above-ordinary consequences.
Shared so that the skill which *ranks* risk and the skill which *blocks a release*
work from one list instead of two that drift apart.

## The critical distinction

**Touching one of these areas is not a defect.** It raises the stakes of a defect.

Conflating the two is the most common failure in automated release gating: every
pull request that touches payments gets marked blocking, the signal becomes noise,
and people start overriding the gate by reflex.

| Question | Answer |
|---|---|
| Does the change touch a trigger area? | Raises risk. Demands evidence. Blocks nothing on its own. |
| Does a *finding* assert a defect in that area? | That is what can block a release. |

So: `Money path changed` raises risk and requires test evidence.
`Ledger row written twice on retry` is a blocker.

## The areas

| Area | Recognise it by | Why consequence is elevated |
|---|---|---|
| Money | Amounts, pricing, refunds, ledger, invoicing, currency, tax, payouts | Errors are financially material and often irreversible |
| Authentication | Login, session, token issue or refresh, password, MFA | Failure exposes every account, not one |
| Authorization | Roles, permissions, ownership checks, tenant scoping, admin paths | The common defect is authenticated-but-not-the-owner |
| Personal data | PII fields, exports, logging of user data, retention, deletion | Disclosure cannot be recalled |
| Destructive migration | Column or table drop, type narrowing, backfill, data rewrite | Irreversible once run against production |
| Concurrency | Shared counters, inventory, locks, retries, webhook handlers, queues | Defects appear only under load, after release |
| External integration | Third-party API, webhook, payment processor, email or SMS | Failure modes are outside your control and often silent |
| Feature flags | Flag added, default flipped, rollout percentage | Changes behaviour without a deploy, so it escapes review |
| Caching | Cache keys, TTL, invalidation | Stale data is silent and can cross users |
| Time and timezone | Scheduling, expiry, date arithmetic, cron | Breaks at boundaries nobody tests: DST, midnight, leap day |
| Error handling removed | Deleted try/catch, removed null check, deleted guard, widened type | Removes a defence with no visible symptom until it matters |

## Irreversibility

Independent of area, and it changes the calculus more than severity does. A
recoverable high-severity defect is often shippable behind a fast rollback; an
irreversible low-severity one may not be.

| Irreversible when | Examples |
|---|---|
| Data cannot be restored | Hard delete, destructive migration with no down path |
| The action reached a third party | Payment captured, email or SMS sent, webhook delivered |
| The user observed it | Balance shown, notification displayed, document issued |
| Rollback is unavailable or unowned | No down migration, or no named person to execute it |

## How each skill uses this list

| Skill | Use |
|---|---|
| `pr-risk-analyzer` | A hit raises the risk tier. Record the area and the evidence. Never rank by lines changed. |
| `release-readiness` | A hit sets risk HIGH and demands run evidence. Only a *finding asserting a defect* in that area can block. |

Neither skill restates this table. They reference it and state what they do with a hit.
