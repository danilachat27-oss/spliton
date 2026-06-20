# Secondary market financial invariants

> Spliton — backend source of truth. Инварианты зафиксированы по коду (`user-market.service.ts`, `wallet-ledger.service.ts`, `ledger-posting.service.ts`).  
> Аудит: 2026-06-05. Статус: **частично production-safe** — см. gaps ниже.

---

## 1. Создание listing (`POST /api/v1/market/listings`)

| Rule | Enforced | Where |
|------|----------|-------|
| User owns units (`UserPosition`) | ✅ | `unitsAvailable >= units` |
| `units > 0`, `pricePerUnit > 0` | ✅ | DTO + DB CHECK |
| `listing.units <= position.unitsAvailable` | ✅ | Transaction |
| Units blocked: `available ↓`, `locked ↑` | ✅ | `userPosition.update` |
| Release active / secondary enabled | ✅ | Release lookup + flags |
| Cannot list without ownership | ✅ | 404/409 if no position |
| Idempotency | ❌ | DTO field exists, **not used** |
| `enforcement.assertUserCanTransact` | ❌ | Only `eligibility` (create); cancel/buy use enforcement |
| Ledger posting on create | ❌ | Only `OwnershipLedger` `LOCK_FOR_SELL` |
| Audit log | ✅ | `listing.create` |

**Post-conditions:** `MarketListing.status = ACTIVE`, `unitsAvailable = units`, seller `unitsLocked += units`.

---

## 2. Отмена listing (`POST /api/v1/market/listings/:id/cancel`)

| Rule | Enforced | Where |
|------|----------|-------|
| Only owner (`sellerUserId`) | ✅ | 403 otherwise |
| Only `ACTIVE` / `PAUSED` | ✅ | 409 otherwise |
| Unlock `listing.unitsAvailable` from `unitsLocked` | ✅ | User cancel path |
| Status → `CANCELLED` | ✅ | |
| Repeated cancel → controlled error | ✅ | 409 not active |
| `OwnershipLedger` `UNLOCK_AFTER_CANCEL` | ✅ | |
| Admin cancel unlock | ❌ | **Admin path sets CANCELLED without unlock** (`admin-secondary-market.service.ts`) |

---

## 3. Покупка listing (`POST /api/v1/market/trades`)

| Rule | Enforced | Where |
|------|----------|-------|
| `buyerId !== sellerId` | ✅ | `assertListingCanBeBought` |
| Listing `ACTIVE`, `unitsAvailable > 0` | ✅ | + `SELECT FOR UPDATE` |
| Buyer `available >= gross` | ✅ | `debitAvailable` → `INSUFFICIENT_BALANCE` |
| Buyer debited `gross` | ✅ | `LedgerOperationType.SECONDARY_TRADE` |
| Seller credited `gross - fee` | ✅ | `creditAvailable` |
| Platform fee from `PlatformFeeSetting` | ✅ | `secondaryMarketFeePct`, not hardcoded |
| Fee ledger + `Fee` row | ✅ | `recordPlatformFee` |
| Seller units: `unitsTotal ↓`, `unitsLocked ↓` | ✅ | |
| Buyer units: `unitsTotal ↑`, `unitsAvailable ↑`, `avgEntryPrice` | ✅ | |
| Listing → `SOLD_OUT`, `unitsAvailable = 0` | ✅ | Whole-lot buy |
| `Trade` + `Order` + `OrderFill` rows | ✅ | |
| Single `$transaction` | ✅ | |
| Race: two buyers same listing | ✅ | Row lock + status check |
| Idempotency (HTTP) | ❌ | Keys per listingId, not client idempotency |
| Audit | ✅ | `secondary.buy` |

**Money math:**

```
gross     = units × pricePerUnit
fee       = gross × secondaryMarketFeePct / 100
sellerNet = gross - fee
buyerDebit = gross
```

---

## 4. Post-trade invariants (must hold)

| Invariant | DB CHECK | App |
|-----------|----------|-----|
| `availableBalance >= 0` | ✅ wallet_balances | ✅ `assertNonNegative` |
| `lockedBalance >= 0` | ✅ | ✅ |
| `unitsTotal >= 0` | ✅ user_positions | ✅ |
| `unitsAvailable + unitsLocked <= unitsTotal` | ✅ | ✅ |
| `listing` sold/cancelled not reusable | ✅ status | ✅ |
| `trade.gross = price × units` | ✅ trades CHECK | ✅ |
| `fee_total <= gross` | ✅ | ✅ |
| Ledger debits = credits per mutation | — | ✅ `LedgerPostingService` |
| `sourceEntityId` valid UUID | ✅ PG UUID type | ⚠️ **withdraw path bug** (non-UUID idempotency key) |

---

## 5. Wallet / ledger (secondary-related)

| Operation | Ledger op | Balance effect |
|-----------|-----------|----------------|
| Secondary buy (buyer) | `SECONDARY_TRADE` DEBIT available | `available ↓` |
| Secondary sell (seller) | `SECONDARY_TRADE` CREDIT available | `available ↑` |
| Platform fee | `PLATFORM_FEE` | Fee tx + postings |
| Primary purchase | `PRIMARY_PURCHASE` | Buyer debit |
| Withdraw lock | `WITHDRAWAL_LOCK` | `available → locked` |
| Withdraw complete | `WITHDRAWAL_DEBIT` | `locked ↓` |
| Payout | `PAYOUT` | `available ↑` |
| Deposit | `DEPOSIT_SETTLE` | `available ↑` |

**Source of truth:** `ledger_postings` + `wallet_balances` cache (reconciliation via `wallet_reconciliation_*`).

---

## 6. Known gaps (production risks)

| # | Gap | Severity |
|---|-----|----------|
| 1 | Withdraw `sourceEntityId` = idempotency key (non-UUID) → **500** | P0 |
| 2 | Admin listing cancel without unit unlock | P1 |
| 3 | Create listing idempotency not implemented | P2 |
| 4 | `price_history` never written on trade — charts empty | P2 |
| 5 | Create listing skips `compliance.enforcement` | P2 |

---

## Related

- [SECONDARY_MARKET.md](./SECONDARY_MARKET.md)
- [WALLET_LEDGER.md](./WALLET_LEDGER.md)
- [PAYOUTS_AFTER_SECONDARY_TRADE_AUDIT.md](./PAYOUTS_AFTER_SECONDARY_TRADE_AUDIT.md)
- [../staging/STAGING_KNOWN_ISSUES.md](../staging/STAGING_KNOWN_ISSUES.md)
