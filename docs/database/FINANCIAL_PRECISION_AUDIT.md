# Financial Precision Audit

## Storage types

| Domain | Prisma / PG type | Status |
|--------|------------------|--------|
| USDT amounts | `Decimal` @db.Decimal(20, 8) | ✓ No float |
| Percentages / fees | `Decimal(10, 6)` | ✓ |
| Unit counts | `Decimal(20, 8)` | ✓ |
| Prices | `Decimal(20, 8)` | ✓ |

## Source of truth

| Concern | Source of truth |
|---------|-----------------|
| Money movement history | `wallet_transactions` (append-only policy) |
| Ownership history | `ownership_ledger` |
| Display balance | `wallet_balances` (derived from ledger ops in services) |
| UI amounts | Backend DTOs — **not** client-calculated settlement |

## Fee & split logic

| Flow | Where calculated | Persisted |
|------|------------------|-----------|
| Withdrawal fee | `UserWithdrawalsService` + `platform_fee_settings` | `wallet_tx.fee_amount`, `fees` row |
| Primary purchase fee | Order/trade services | `fees` |
| Secondary fee | Trade settlement | `trade.fee_total`, `fees` |
| Revenue split 70/15/15 | `AdminRevenueService` constants | `earning_distribution`, `payouts` |

## Rounding

- Prisma `Decimal` arithmetic in TS — no JS `number` for settlement
- Display: `toLocaleString('ru-RU')` on frontend — formatting only
- **Risk:** Revenue distribution uses `div` on totals — document rounding residue to platform treasury (future)

## Gaps

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| No `NUMERIC` CHECK on non-negative balances | Medium | Service guards today; DB CHECK after validation |
| Withdrawal gross/fee/net only on `wallet_tx`, not on `withdrawals` | Low | OK — join wallet_tx for reports |
| No `idempotency_key` column | Medium | Use `(reference_type, reference_id)` + partial unique index when duplicates ruled out |

## Verification query (run on Supabase SQL editor)

```sql
SELECT wallet_id, available, locked, pending
FROM wallet_balances
WHERE available < 0 OR locked < 0 OR pending < 0;
```

Must return **0 rows** before adding CHECK constraints.
