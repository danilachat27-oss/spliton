# Revenue Distribution — DB Guards

## Application layer

`AdminRevenueService.runDistribution`:

- Loads `earning_period` in transaction  
- `findFirst` existing `earning_distribution` → `409 ALREADY_DISTRIBUTED`  
- Creates distribution + payouts + wallet credits atomically  
- Sets period status `DISTRIBUTED`  

## Database layer (added)

**Migration:** `20260531330100_earning_distribution_unique`

```sql
CREATE UNIQUE INDEX IF NOT EXISTS earning_distributions_earning_period_id_key
  ON earning_distributions (earning_period_id);
```

`earning_period_id` is **NOT NULL** — full unique index (no partial needed).

## Precheck

```sql
SELECT earning_period_id, COUNT(*)
FROM earning_distributions
GROUP BY earning_period_id
HAVING COUNT(*) > 1;
```

**Result (2026-05-31):** 0 duplicate groups.

## Prisma

```prisma
@@unique([earningPeriodId], map: "earning_distributions_earning_period_id_key")
```

## Failure modes

| Scenario | Behavior |
|----------|----------|
| Second run same period | Service 409; DB unique violation if race |
| Concurrent workers | Second txn fails on unique index — safe |

## Not in scope

- Per-holder payout idempotency (separate `payouts` rows per user)  
- Reversal / cancel distribution (future migration)  
