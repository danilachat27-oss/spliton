# Enum Status Audit

| Enum | Prisma | Frontend API | Mapping before | Migration | Production OK |
|------|--------|--------------|----------------|-----------|---------------|
| DepositStatus | PENDING, CONFIRMING, MANUAL_REVIEW, CONFIRMED, FAILED | pending, confirming, manual_review, completed, failed | DTO hack | `20260531120000_financial_status_enums` | Yes |
| WithdrawalStatus | REQUESTED, PROCESSING, ON_HOLD, COMPLETED, FAILED, CANCELLED | pending, approved, on_hold, completed, failed, rejected | on_hold via PROCESSING flag | same migration | Yes |
| WalletTxType | DEPOSIT, WITHDRAWAL, PAYOUT, FEE, … | ledger operationType strings | mapper in `admin-wallet.mapper.ts` | none | Partial — UI labels richer than DB |
| WalletTxStatus | PENDING, COMPLETED, FAILED, CANCELLED, REVERSED | pending, completed, … | direct | none | Yes |
| ListingStatus | ACTIVE, PAUSED, SOLD_OUT, CANCELLED, EXPIRED | lowercase in API | direct | none | Yes |
| TradeSettlementStatus | PENDING, SETTLED, FAILED, REVERSED | settlement status | direct | none | Yes |
| EarningPeriodStatus | OPEN, CALCULATED, DISTRIBUTED, CANCELLED | draft, preview, completed, cancelled | maps in revenue service | none | Yes (revenue events) |
| UserStatus | ACTIVE, PENDING, … | ACTIVE, SUSPENDED, … | mapper | none | Yes |

## Notes

- PostgreSQL enum additions are in a dedicated migration; deploy before using new values in app code.
- Wallet ledger UI types (`deposit_pending`, `withdrawal_locked`, …) are **display labels** mapped from `WalletTxType` + context; full 1:1 enum not required until on-chain automation.
