# Ownership ledger backfill plan

> Post–payout cutoff fix. Distribution preview/run uses `OwnershipLedger` ownership-changing events at period cutoff. Legacy `UserPosition` rows without ledger events yield **0 eligible holders**.

## Why needed

After the cutoff snapshot model (`earning_period_holder_snapshots`), payout allocation reads:

- `PRIMARY_BUY`, `SECONDARY_BUY`, `SECONDARY_SELL`, `LEGACY_POSITION_BACKFILL`

Early seeds, manual QA inserts, and pre-ledger primary purchases may have `UserPosition` but **no** matching ledger rows. Distribution preview then shows `holdersCount: 0` or blocks run.

## Affected data

| Source | Risk |
|--------|------|
| Staging QA seed before ledger writes | Medium |
| E2e `userPosition.create` without ledger | Low (test DB only) |
| Production primary purchases via API | **Low** — `primary-order.service` writes `PRIMARY_BUY` |
| Admin/manual DB fixes | High if positions exist without events |

Run dry-run on each environment before first distribution after deploy.

## Script

`scripts/finance/backfill-ownership-ledger.ts`

| Flag | Behaviour |
|------|-----------|
| `--dry-run` | Report counts + planned rows, no writes |
| `--apply` | Create missing `LEGACY_POSITION_BACKFILL` events in one transaction |

npm script:

```bash
# npm requires `--` before script flags:
npm run finance:ownership-ledger:backfill -- --dry-run
npm run finance:ownership-ledger:backfill -- --apply

# Or directly:
npx tsx scripts/finance/backfill-ownership-ledger.ts --dry-run
```

### Idempotency

- Re-run sums all ownership-changing events including existing `LEGACY_POSITION_BACKFILL`.
- Apply only inserts when `position.unitsTotal > sum(ledger unitsDelta)`.
- Second dry-run should show **0** missing (or only new positions created since last run).

### `happenedAt` rule

1. If release has `EarningPeriod`: **day before earliest `periodStart`**, 12:00 UTC.
2. Else: `UserPosition.createdAt`.

**Data limitation:** exact historical purchase time is unknown for legacy rows. Backfill uses a safe pre-period timestamp so cutoff-based distribution includes these holders. This may over-attribute pre-cutoff ownership if the real purchase was later — acceptable only for legacy cleanup; new purchases must use real ledger events.

### What we do **not** do

- No fake secondary trades
- No modification of existing ledger rows
- No automatic changes to `UserPosition`

## Dry-run instructions

```bash
# Staging / prod — with correct DATABASE_URL + DIRECT_URL
npm run finance:ownership-ledger:backfill -- --dry-run
```

Review output:

- `Positions with missing ledger units`
- Per-row `position` vs `ledger` vs `+missing`
- `Approved earning periods without holder snapshot` (informational)

## Apply instructions

1. Backup DB or run on staging first.
2. `npx prisma migrate deploy` (includes `LEGACY_POSITION_BACKFILL` enum).
3. `npm run finance:ownership-ledger:backfill -- --apply`
4. `npm run finance:ownership-ledger:backfill -- --dry-run` → expect 0 missing.

## Rollback strategy

Each apply run sets `backfill_batch_id` on created rows. The script prints:

- `batchId`
- Exact rollback SQL

```sql
-- Emergency only — replace with batch id from apply output
DELETE FROM ownership_ledger
WHERE event_type = 'LEGACY_POSITION_BACKFILL'
  AND backfill_batch_id = '<batch-id-from-apply-output>';
```

**Never** delete `PRIMARY_BUY`, `SECONDARY_BUY`, `SECONDARY_SELL`, or rows without `backfill_batch_id`.

If distribution already ran on backfilled data, **do not** delete ledger rows without finance review (payouts already sent).

## Risks

| Risk | Mitigation |
|------|------------|
| Wrong `happenedAt` for legacy holder | Document limitation; prefer real `PRIMARY_BUY` for new data |
| Double backfill | Idempotent sum check |
| Approved periods without snapshot | Re-approve or run distribution only after backfill + snapshot on approve |
| Production run before migrate | Enum missing → apply fails fast |

## QA checklist

- [ ] Dry-run on staging shows expected users/releases
- [ ] Apply creates rows; second dry-run = 0
- [ ] Distribution preview shows correct holder units
- [ ] Post-cutoff secondary trade does not change closed period payout
- [ ] `earning_period_holder_snapshots` populated on approve

## Related

- [PAYOUTS_AFTER_SECONDARY_TRADE_AUDIT.md](./PAYOUTS_AFTER_SECONDARY_TRADE_AUDIT.md)
- [../testing/BACKEND_E2E_TEST_DB.md](../testing/BACKEND_E2E_TEST_DB.md)
