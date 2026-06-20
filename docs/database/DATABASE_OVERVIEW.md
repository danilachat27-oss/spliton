# Database Overview — Spliton

## Architecture

PostgreSQL on **Supabase**, accessed exclusively via **NestJS + Prisma** (no client-side DB).

```
┌─────────────┐     JWT      ┌──────────────┐    Prisma     ┌─────────────────┐
│  Next.js    │ ──────────► │ NestJS API   │ ────────────► │ Supabase Postgres│
│  (no DB)    │             │              │   pooler 6543 │  public schema   │
└─────────────┘             └──────────────┘               └─────────────────┘
```

## Domain map

| Domain | Core tables |
|--------|-------------|
| Identity | `users`, `roles`, `user_roles`, `user_sessions` |
| Catalog | `releases`, `artists`, `primary_raise_rounds`, `user_positions` |
| Wallet | `wallets`, `wallet_balances`, `wallet_transactions`, `deposits`, `withdrawals`, `fees` |
| Revenue | `earning_periods`, `earning_reports`, `earning_distributions`, `payouts` |
| Market | `market_listings`, `orders`, `trades`, `order_fills`, `ownership_ledger` |
| Admin | `audit_logs`, `admin_actions`, `report_jobs`, `platform_fee_settings` |
| Ops | `support_tickets`, `risk_flags`, `compliance_freezes` |

## Financial model

- **Ledger:** `wallet_transactions` (canonical)  
- **Balances:** `wallet_balances` (aggregate, updated in txn with ledger)  
- **Units:** `user_positions` + `ownership_ledger`  
- **Precision:** `DECIMAL(20,8)` — see [FINANCIAL_PRECISION_AUDIT.md](FINANCIAL_PRECISION_AUDIT.md)

## Roles

Staff enums in `user_role_code`; assignment via `user_roles`.  
`SUPER_ADMIN` bootstrap: seed + service guard for last admin.  
`BUSINESS_ANALYST`: read-only analytics — see [../analytics/BUSINESS_ANALYST_ROLE.md](../analytics/BUSINESS_ANALYST_ROLE.md).

## Migrations

18 files (indexes, CHECK constraints, distribution UNIQUE, report storage columns).  
Status: [MIGRATION_AUDIT.md](MIGRATION_AUDIT.md).  
Prechecks: [DB_CONSTRAINT_PRECHECKS.md](DB_CONSTRAINT_PRECHECKS.md).

## Indexes & performance

- Analytics: `20260531210000_analytics_indexes`  
- Operational: `20260531320000_db_operational_indexes`  
- Detail: [INDEX_AUDIT.md](INDEX_AUDIT.md)

## Views & functions

- Views: planned — [REPORTING_VIEWS_PLAN.md](REPORTING_VIEWS_PLAN.md)  
- Stored procedures: **not used** — [POSTGRES_FUNCTIONS_REVIEW.md](POSTGRES_FUNCTIONS_REVIEW.md)

## Security

[SUPABASE_SECURITY_REVIEW.md](SUPABASE_SECURITY_REVIEW.md)

## Audit

[AUDIT_COVERAGE_REVIEW.md](AUDIT_COVERAGE_REVIEW.md)

## Production hardening (2026-05-31)

- CHECK constraints on balances, positions, releases, rounds, wallet tx amounts  
- `UNIQUE(earning_period_id)` on `earning_distributions`  
- `ReportStorageService` + `report_jobs` storage metadata  
- Precheck script: `npm run db:constraint-prechecks`  

## Risks & next steps

| Risk | Mitigation |
|------|------------|
| CHECK migration on dirty prod | Run prechecks on staging/prod before deploy |
| Report blobs in DB | `REPORT_STORAGE_MODE=object` + worker (phase 2) |
| Heavy analytics on raw tx | Materialized views at scale |
| E2E on shared Supabase | Dedicated test project |
| pg_trgm | Plan in [ADMIN_SEARCH_PERFORMANCE.md](ADMIN_SEARCH_PERFORMANCE.md) |

## Doc index

- [DATABASE_AUDIT.md](DATABASE_AUDIT.md) — entity matrix  
- [schema.md](schema.md) — original schema design doc  
- [erd.md](erd.md) — ERD  
- [../operations/SUPABASE_DATABASE_WORKFLOW.md](../operations/SUPABASE_DATABASE_WORKFLOW.md)
