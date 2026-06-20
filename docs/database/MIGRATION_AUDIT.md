# Migration Audit

**Tooling:** Prisma Migrate → Supabase via `DATABASE_URL` (pooler) + `DIRECT_URL` (migrations)

## Status (2026-06-03)

```
40 migrations in prisma/migrations/
```

Run on each environment:

```powershell
npx prisma migrate status
npm run test:db:drift-check    # when TEST_DATABASE_URL set
npm run db:constraint-prechecks
```

## Migration chain (ordered)

| Migration | Purpose | Risk |
|-----------|---------|------|
| `20260430211728_init_spliton_schema` | Full MVP schema + indexes | Baseline |
| `20260430215524_harden_auth_sessions` | Session hardening | Low |
| `20260430224102_add_two_factor_auth` | 2FA tables | Low |
| `20260501111833_add_email_verification` | Email verify tokens | Low |
| `20260511140000_grant_admin_danila_titovets` | One-off role grant | **Historical** |
| `20260512120000_bootstrap_admin_user` | Bootstrap | Historical |
| `20260530120000_staff_roles_super_admin` | Staff enum values | Enum split OK |
| `20260530120001_staff_roles_data` | Role seed data | Data |
| `20260531120000_financial_status_enums` | `ON_HOLD`, `MANUAL_REVIEW`, etc. | Enum txn |
| `20260531180000_platform_fees_and_report_jobs` | Fees settings + report_jobs | Low |
| `20260531190000_admin_portal_foundation` | Tracks, rounds, support, compliance | Low |
| `20260531200000_business_analyst_role_enum` | `BUSINESS_ANALYST` enum | Separate txn |
| `20260531200001_business_analyst_role_data` | Insert role row | Data |
| `20260531210000_analytics_indexes` | Analytics query indexes | Additive |
| `20260531320000_db_operational_indexes` | Admin/audit/reference indexes | Additive |
| `20260531330000_db_check_constraints` | CHECK non-negative / allocation | Additive (prechecks) |
| `20260531330100_earning_distribution_unique` | UNIQUE `earning_period_id` | Additive |
| `20260531330200_report_job_storage_columns` | `file_url`, `storage_key`, `file_size_bytes` | Additive |
| `20260531340000_orders_idempotency_key` | Primary order idempotency | Additive |
| `20260531350000_release_catalog_metadata` | Catalog public metadata | Additive |
| `20260531360000_round_display_name` | Round display name | Additive |
| `20260601000000_spliton_operator_portal` | Operator portal schema | Low |
| `20260601010000_news_manager_role` | NEWS_MANAGER role | Enum + data |
| `20260602120000_db_financial_check_constraints_phase2` | Financial CHECK phase 2 | Prechecks |
| `20260602120100_db_financial_indexes_fk_phase2` | Indexes + FK RESTRICT | Additive |
| `20260602140000_report_job_lifecycle` | Report job lifecycle | Low |
| `20260602140000_report_job_status_enum_values` | Report status enums | Enum |
| `20260602140100_report_job_lifecycle_columns` | Report job columns | Additive |
| `20260603120000_ledger_double_entry_foundation` | **ledger_postings**, operation types | **Finance critical** |
| `20260604120000_deposit_ingestion_withdrawal_hardening` | Deposits CREDITED, ingestion tables, withdrawal hardening | **Enum txn** — see below |
| `20260605120000_primary_order_lifecycle` | Primary order lifecycle | Finance |
| `20260606120000_secondary_market_listing_indexes` | Listing indexes | Additive |
| `20260607120000_price_history_order_book_indexes` | Order book / prices | Additive |
| `20260609120000_wallet_activity_timeline_indexes` | Wallet activity | Additive |
| `20260610120000_user_analytics_indexes` | User analytics | Additive |
| `20260611120000_market_overview_indexes` | Market overview cache | Additive |
| `20260612140000_revenue_distribution_lifecycle` | Revenue distribution lifecycle | Finance |
| `20260613160000_compliance_risk_lifecycle` | Compliance notes, risk lifecycle | Compliance |
| `20260614120000_password_reset_tokens` | Password reset tokens | Auth |
| `20260614120000_scale_performance_indexes` | Scale / performance indexes | Additive |

## Finance-critical objects (post full deploy)

| Object | Migration |
|--------|-----------|
| `ledger_postings`, `operation_type` | `20260603120000` |
| `deposit_watcher_states`, `deposit_ingestion_logs` | `20260604120000` |
| `deposit_status` → `CREDITED` | `20260604120000` |
| `compliance_notes` | `20260613160000` |
| `password_reset_tokens` | `20260614120000` |
| `report_jobs.storage_key` | `20260531330200` + lifecycle migrations |

Verify: `npm run test:db:drift-check`

## `20260604120000` — deposit ingestion fix (P0)

**Problem:** PostgreSQL cannot use a newly added enum label in the same transaction as `ADD VALUE`. Prisma wraps migrations in transactions by default → UPDATE to `'CREDITED'` fails.

**Fix applied:**

1. `-- prisma:disable-transaction` at top of migration SQL
2. `ADD VALUE IF NOT EXISTS` for all new enum labels
3. `DO $$ … EXCEPTION duplicate_object` for CREATE TYPE / FK
4. `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`

**Do not** rely on manual `prisma db execute` for normal deploys.

## Rules verified

| Rule | Status |
|------|--------|
| No `migrate reset` on shared envs | ✓ Documented |
| Enum add before use in same migration | ✓ Split or disable-transaction |
| Additive indexes use `IF NOT EXISTS` | ✓ |
| Prechecks before CHECK migrations | ✓ `npm run db:constraint-prechecks` |

## Commands (Supabase)

```powershell
npm run prisma:generate
npm run prisma:migrate:deploy    # uses DIRECT_URL
npm run prisma:seed
```

Dedicated e2e:

```powershell
npm run test:db:setup
npm run test:db:drift-check
```

## Drift symptoms

- `_prisma_migrations` missing or empty while tables exist
- `migrate status` lists all migrations as pending
- Finance e2e 500: `ledger_postings` does not exist

**Remediation:** `npm run test:db:setup` on dedicated project, or `prisma migrate deploy` with `DIRECT_URL` on staging.

## Related

- [SUPABASE_DATABASE_WORKFLOW.md](../operations/SUPABASE_DATABASE_WORKFLOW.md)  
- [E2E_DATABASE.md](../operations/E2E_DATABASE.md)  
- [DB_CONSTRAINT_PRECHECKS.md](./DB_CONSTRAINT_PRECHECKS.md)
