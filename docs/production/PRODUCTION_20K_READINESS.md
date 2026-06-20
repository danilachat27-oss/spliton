# Spliton — Production 20k Readiness

Статус: **pre-launch checklist** для публичного запуска на 20 000+ пользователей.

## P0 gates (must pass before marketing spend)

| # | Gate | Verify |
|---|------|--------|
| 1 | Frontend all `*_DATA_SOURCE=live` | `npm run build` in `apps/frontend` with production env |
| 2 | TRON live when deposits on | `TRON_PROVIDER_MODE=tron`, boot guard passes |
| 3 | Email provider configured | `EMAIL_PROVIDER=postmark\|resend`, domain verified |
| 4 | RBAC FE/BE synced | `admin-rbac-hardening.e2e-spec.ts` green |
| 5 | Full backend e2e | `ALLOW_E2E_ON_DATABASE_URL=1 npm run test:e2e` |
| 6 | Load baseline | `npm run load:baseline` on staging/prod-like host |
| 7 | Ownership ledger | `npx tsx scripts/finance/backfill-ownership-ledger.ts --dry-run` → 0 missing |
| 8 | Redis rate limits | `RATE_LIMIT_STORAGE=redis` + `REDIS_URL` + `RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION=true` |
| 9 | DB constraints | `npm run db:constraint-prechecks` |
| 10 | Kill switches tested | `/api/admin/v1/safety/console` |

## Launch week limits (enforced in DB via `treasury_operational_limits`)

| Limit | Default |
|-------|---------|
| Daily withdrawal / user | 500 USDT |
| Manual approval threshold | > 200 USDT (`mediumWithdrawalUsdt`) |
| Auto-complete withdrawal max | 200 USDT |
| Auto-credit deposit max | 2000 USDT (manual review above) |

Update via **Admin → Treasury** if row already exists from older defaults.

## First 7 days operations

1. Keep `KILL_SWITCH_DISABLE_DEPOSIT_CREDIT=true` first 48h OR manual review all credits.
2. Monitor Sentry + slow queries (`PRISMA_SLOW_QUERY_MS=500`).
3. Run reconciliation dry-run daily: admin ledger reconciliation API.
4. No mass ads until load baseline p95 < 2s on catalog/wallet/admin lists.

## Related docs

- [ENV_CHECKLIST.md](./ENV_CHECKLIST.md)
- [TRON_PROVIDER_SETUP.md](./TRON_PROVIDER_SETUP.md)
- [EMAIL_PROVIDER_SETUP.md](./EMAIL_PROVIDER_SETUP.md)
- [RBAC_MATRIX.md](./RBAC_MATRIX.md)
- [E2E_CURRENT_DB_RUNBOOK.md](./E2E_CURRENT_DB_RUNBOOK.md)
- [LOAD_BASELINE_REPORT.md](./LOAD_BASELINE_REPORT.md)
