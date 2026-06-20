# Payouts after secondary trade — audit

> Spliton revenue distribution (`admin-revenue.service.ts`, `revenue-distribution.calc.ts`).  
> Аудит: 2026-06-05. **Честный вывод:** payouts используют **текущие** holdings на момент run, не historical snapshot на cutoff периода.

---

## 1. Текущая модель

### Как определяется holder при distribution run

```typescript
// admin-revenue.service.ts runDistribution()
const positions = await tx.userPosition.findMany({
  where: { releaseId: period.releaseId, unitsTotal: { gt: 0 } },
});
// payout ∝ position.unitsTotal at RUN TIME
```

| Question | Answer |
|----------|--------|
| Holder на дату распределения | **Current `UserPosition.unitsTotal`** на момент `POST /distributions/run` |
| Historical ownership snapshot | ❌ Не используется для allocation |
| `OwnershipLedger` | Пишется `PAYOUT_SNAPSHOT` **после** payout (audit trail, не input) |
| `EarningDistribution.snapshotEligibleUnits` | Sum of units at run — metadata only |

### Workflow

1. Admin создаёт `EarningPeriod` + `EarningReport` (gross revenue).
2. Preview → `calculateDistribution()` по **current positions**.
3. Approve period → `APPROVED`.
4. Run (transactional):
   - `UNIQUE(earning_period_id)` → one distribution per period
   - Per holder: `creditAvailable` + `WalletTx PAYOUT` + `Payout` row
   - `UNIQUE(user_id, earning_distribution_id)` → no double payout per user
   - `runIdempotencyKey` on period → HTTP idempotency

---

## 2. Что происходит после secondary trade

### Scenario A: Trade **до** period end, distribution **после** trade

| Actor | Units before trade | After selling 3 of 10 | At distribution run |
|-------|-------------------|----------------------|---------------------|
| Seller (sold 3) | 10 | 7 | Gets payout for **7 units** ✅ |
| Buyer (bought 3) | 0 | 3 | Gets payout for **3 units** ✅ |

**Если trade завершён до run:** новый владелец получает будущие начисления — **корректно** для current-holdings модели.

### Scenario B: Trade **после** period end, distribution run **до** trade

| Actor | Held during period | Bought after period end | At distribution (before trade) |
|-------|------------------|-------------------------|-------------------------------|
| Old owner | 10 | sold later | Gets payout for 10 |
| New owner | 0 | buys after cutoff | Gets **0** |

**Корректно** если run до trade.

### Scenario C: ⚠️ Trade **после** period end but **before** distribution run

| Actor | Held during earning period | Action after period end | At distribution run |
|-------|---------------------------|-------------------------|---------------------|
| Old owner | 10 | Sells all 10 | **0 units → 0 payout** ✅ |
| New owner | 0 | Buys 10 | **Gets full payout for period they didn't earn** ❌ |

**Риск production:** distribution по current holdings без cutoff date позволяет новому покупателю получить revenue за период до покупки.

### Scenario D: Partial sale

| Seller | unitsTotal | Sells 3 on secondary | Remaining 7 |
|--------|------------|---------------------|-------------|
| Payout | — | — | `7/Σ × holdersPool` ✅ |

Buyer of 3 units gets proportional payout if still holding at run time.

---

## 3. Double payout protection

| Mechanism | Status |
|-----------|--------|
| `UNIQUE(earning_period_id)` on `EarningDistribution` | ✅ |
| `UNIQUE(user_id, earning_distribution_id)` on `Payout` | ✅ |
| `runIdempotencyKey` on `EarningPeriod` | ✅ |
| Re-run same period | 409 `ALREADY_DISTRIBUTED` |
| Ledger idempotency keys `payout-tx:{distributionId}:{userId}` | ✅ |

**Нет** защиты от semantic double-pay (scenario C) — это product/model gap, не duplicate-run gap.

---

## 4. Связь payouts ↔ wallet ledger

Each holder payout in one transaction:

1. `WalletTransaction` type `PAYOUT`, direction `IN`, status `COMPLETED`
2. `LedgerPosting` CREDIT `USER_AVAILABLE`
3. `Payout` row linked to `earningDistributionId` + `walletTxId`
4. `OwnershipLedger` `PAYOUT_SNAPSHOT` (unitsDelta=0)

Rollback: entire `$transaction` fails → period → `FAILED`, no partial payouts (except Prisma/ledger edge cases — needs isolated e2e proof).

---

## 5. Риски

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Payout новому owner за период до покупки | Medium (ops timing) | High | **Cutoff snapshot** at period end |
| Payout старому owner после полной продажи | Low at run time | None | Current model OK |
| Double distribution same period | Low | High | ✅ DB unique |
| Partial inconsistent state on failure | Low | High | Transactional run; needs e2e |
| Frontend mock payouts | High in dev | Medium | `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` on staging/prod |

---

## 6. Implemented cutoff snapshot model (2026-06-05)

### Правило простым языком

**Выплату за earning period получает тот, кто владел units на конец этого периода (cutoff), а не тот, кто владеет units в момент запуска distribution.**

Cutoff = конец UTC-дня `periodEnd` (`23:59:59.999Z`).

### Как работает

1. **Preview и run** считают eligible holders через `OwnershipLedger` (события `PRIMARY_BUY`, `SECONDARY_BUY`, `SECONDARY_SELL`) с `happenedAt <= cutoff`.
2. При **approve** периода создаётся frozen snapshot в таблице `earning_period_holder_snapshots` (unique: period + user + release).
3. **Run distribution** использует frozen snapshot, если он есть; иначе пересчитывает ledger на cutoff (backfill для старых периодов).
4. Сделки **после cutoff** не меняют payout за прошлый период.
5. Сделки **до cutoff** (включая partial sale) корректно делят payout между seller/buyer по units на cutoff.
6. Double payout по-прежнему блокируется `UNIQUE(earning_period_id)` и `UNIQUE(user_id, earning_distribution_id)`.

### Файлы

- `apps/backend/src/modules/admin/v1/utils/earning-period-holder-snapshot.util.ts`
- `apps/backend/src/modules/admin/v1/admin-revenue.service.ts` (`buildPreview`, `approveDistribution`, `runDistribution`)
- Migration: `prisma/migrations/20260605140000_earning_period_holder_snapshots`

### Data migration note

Периоды, созданные до ledger backfill, могут не иметь ownership events → holders = 0. Для production нужен one-time backfill `PRIMARY_BUY`/`SECONDARY_*` из `UserPosition` + trades или ручной snapshot.

---

## Related

- [REVENUE_DISTRIBUTION.md](./REVENUE_DISTRIBUTION.md)
- [SECONDARY_MARKET_FINANCIAL_INVARIANTS.md](./SECONDARY_MARKET_FINANCIAL_INVARIANTS.md)
- [../staging/POST_STAGING_PRODUCTION_BLOCKERS.md](../staging/POST_STAGING_PRODUCTION_BLOCKERS.md)
