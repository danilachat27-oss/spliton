# Database Audit — Prisma vs Supabase

**Date:** 2026-05-31  
**Datasource:** Supabase PostgreSQL (`public`)  
**Prisma:** `prisma/schema.prisma` — 14 migrations applied, `prisma migrate status` → **up to date**

## Summary

| Status | Count | Notes |
|--------|------:|-------|
| OK | 38 | Core models aligned, Decimal money, FKs present |
| incomplete | 6 | App-level guards only; DB CHECK constraints missing |
| missing indexes | 5 | Addressed in `20260531320000_db_operational_indexes` |
| risky | 4 | Balance/position invariants not DB-enforced |
| needs migration | 1 | Optional CHECK constraints (future, after data validation) |

## Entity matrix

### Identity & access

| Entity | Prisma | Supabase table | Status | Issues | Recommendation |
|--------|--------|----------------|--------|--------|----------------|
| User | `User` | `users` | OK | No index on `status` alone | Partial index `users_status_active_idx` (migration) |
| UserProfile | `UserProfile` | `user_profiles` | OK | — | — |
| Role | `Role` | `roles` | OK | `code` unique | Seed + migration for `BUSINESS_ANALYST` |
| UserRole | `UserRole` | `user_roles` | OK | `@@unique([userId, roleId])` | Last SUPER_ADMIN guarded in service |
| UserSession | `UserSession` | `user_sessions` | OK | Indexes on user/revoked/expiry | — |

### Releases & primary market

| Entity | Prisma | Supabase | Status | Issues | Recommendation |
|--------|--------|----------|--------|--------|----------------|
| Release | `Release` | `releases` | incomplete | No CHECK: share % sum = 100; units ≥ 0 | Validate in admin create/update; optional CHECK later |
| Artist / Label | `Artist`, `Label` | `artists`, `labels` | OK | slug unique | — |
| ReleaseShareLot | `ReleaseShareLot` | `release_share_lots` | OK | `units_remaining` not CHECK ≤ `units_total` | Service-level on primary buy |
| UserPosition | `UserPosition` | `user_positions` | OK | CHECK allocation | Migration `20260531330000` |
| PrimaryRaiseRound | `PrimaryRaiseRound` | `primary_raise_rounds` | OK | CHECK units/targets | Migration `20260531330000` |
| ReleaseMetricsDaily | `ReleaseMetricsDaily` | `release_metrics_daily` | OK | Unique (release, date) | — |

### Wallet & ledger

| Entity | Prisma | Supabase | Status | Issues | Recommendation |
|--------|--------|----------|--------|--------|----------------|
| Wallet | `Wallet` | `wallets` | OK | Unique (user, asset, network) | — |
| WalletBalance | `WalletBalance` | `wallet_balances` | OK | CHECK `>= 0` added (`20260531330000`) | Prechecks passed |
| WalletTransaction | `WalletTransaction` | `wallet_transactions` | OK | Append-only ledger; Decimal amounts | Index on `(reference_type, reference_id)` (migration) |
| Deposit | `Deposit` | `deposits` | OK | `blockchain_txid` unique; status enum | Index `(status, created_at)` exists |
| Withdrawal | `Withdrawal` | `withdrawals` | OK | Amounts on linked `wallet_tx`; status enum | Index `(status, requested_at)` exists |
| Fee | `Fee` | `fees` | OK | Decimal `amount_charged` | Index `(created_at, fee_code)` |

### Revenue distribution

| Entity | Prisma | Supabase | Status | Issues | Recommendation |
|--------|--------|----------|--------|--------|----------------|
| EarningPeriod | `EarningPeriod` | `earning_periods` | OK | Unique (release, period range) | — |
| EarningReport | `EarningReport` | `earning_reports` | OK | — | — |
| EarningDistribution | `EarningDistribution` | `earning_distributions` | OK | UNIQUE `earning_period_id` + service guard | [REVENUE_DISTRIBUTION_DB_GUARDS.md](REVENUE_DISTRIBUTION_DB_GUARDS.md) |
| Payout | `Payout` | `payouts` | OK | Links wallet_tx + distribution | — |

### Secondary market

| Entity | Prisma | Supabase | Status | Issues | Recommendation |
|--------|--------|----------|--------|--------|----------------|
| MarketListing | `MarketListing` | `market_listings` | OK | Soft delete | Index `(status, created_at)` partial (migration) |
| Order | `Order` | `orders` | OK | Good composite indexes | — |
| Trade | `Trade` | `trades` | OK | Settlement enum | Index settlement+executed_at (migration) |
| OrderFill | `OrderFill` | `order_fills` | OK | — | — |
| OwnershipLedger | `OwnershipLedger` | `ownership_ledger` | OK | Append-only units events | — |

### Admin, compliance, support

| Entity | Prisma | Supabase | Status | Issues | Recommendation |
|--------|--------|----------|--------|--------|----------------|
| AuditLog | `AuditLog` | `audit_logs` | OK | JSON before/after | Index `(action, created_at)` (migration) |
| AdminAction | `AdminAction` | `admin_actions` | OK | Parallel to audit | — |
| RiskFlag | `RiskFlag` | `risk_flags` | OK | `ComplianceRiskStatus` enum | Indexes on status, entity |
| ComplianceFreeze | `ComplianceFreeze` | `compliance_freezes` | OK | `(operation_type, operation_id, is_active)` | — |
| SupportTicket | `SupportTicket` | `support_tickets` | OK | Full enum category/priority/status | Indexes present |
| SupportTicketNote | `SupportTicketNote` | `support_ticket_notes` | OK | — | — |
| PlatformFeeSetting | `PlatformFeeSetting` | `platform_fee_settings` | OK | Decimal rates | Active row via `is_active` |
| ReportJob | `ReportJob` | `report_jobs` | incomplete | `file_content` dev fallback; storage columns added | [REPORT_WORKER_AND_STORAGE.md](../operations/REPORT_WORKER_AND_STORAGE.md) |

### Auth / KYC (product)

| Entity | Prisma | Supabase | Status | Issues | Recommendation |
|--------|--------|----------|--------|--------|----------------|
| EmailVerificationToken | ✓ | ✓ | OK | — | — |
| TwoFactor* | ✓ | ✓ | OK | — | — |
| KycVerification | ✓ | ✓ | OK | — | — |

## Enum alignment

All financial/status enums mapped with `@@map` to PostgreSQL enums. Additive migrations use `ADD VALUE IF NOT EXISTS` in **separate** files before data migrations (`BUSINESS_ANALYST`, `ON_HOLD`, `MANUAL_REVIEW`) — **correct pattern**.

Legacy roles `ADMIN`, `SUPPORT` remain in enum — **deprecated** for new assignments; still staff in `admin-panel-roles.ts`.

## Prisma ↔ Supabase drift

**None detected** — `prisma migrate status`: Database schema is up to date (14 migrations).

## Related docs

- [MIGRATION_AUDIT.md](MIGRATION_AUDIT.md)
- [INDEX_AUDIT.md](INDEX_AUDIT.md)
- [DATABASE_OVERVIEW.md](DATABASE_OVERVIEW.md)
