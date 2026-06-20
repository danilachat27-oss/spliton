# TRON Provider Setup — Spliton

## Modes

| `TRON_PROVIDER_MODE` | Use |
|----------------------|-----|
| `mock` | Local dev / e2e only |
| `tron` | Production real USDT TRC20 deposits |

## Production requirements

When `NODE_ENV=production` AND `FEATURE_ENABLE_DEPOSITS=true` AND `DEPOSIT_INGESTION_ENABLED=true`:

- **Joi** requires `TRON_PROVIDER_MODE=tron`
- **Boot guard** (`production-boot-guard.ts`) fails on `mock`
- `ALLOW_DEV_DEPOSIT_ADDRESS` must be `false`

## Env

```env
DEPOSIT_INGESTION_ENABLED=true
TRON_PROVIDER_MODE=tron
TRON_PROVIDER_URL=https://api.trongrid.io
TRON_API_KEY=...
TRON_CONFIRMATIONS=20
TRON_POLL_INTERVAL=15000
TRON_USDT_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
```

## Smoke checklist

| Step | Command / action | Expected |
|------|------------------|----------|
| 1 | `GET /health/deep` | `tronProvider: true` |
| 2 | User requests deposit address | TRC20 address returned |
| 3 | Ingest poll (cron/worker) | Tx detected, pending state |
| 4 | Duplicate tx hash | No double credit (idempotency) |
| 5 | Amount > `maxAutoCreditDepositUsdt` | Manual review queue |
| 6 | `KILL_SWITCH_DISABLE_DEPOSIT_CREDIT=true` | Credit blocked |
| 7 | Admin reconciliation dry-run | No mismatch |

## Kill switches

```env
KILL_SWITCH_DISABLE_DEPOSITS=true        # no new addresses
KILL_SWITCH_DISABLE_DEPOSIT_CREDIT=true  # detect but don't credit
```

Verify: `GET /api/admin/v1/safety/console`

## Admin visibility

- `/admin/deposits` — KPI, filters, reconcile/review actions
- Treasury console — provider mode status
- Audit log — all credit/settle actions

## Failed deposit recovery

1. Find deposit in `deposits` + `deposit_ingestion_log`
2. Admin review → approve/reject via deposits API
3. Never manual SQL on `wallet_transactions` / `ledger_postings`

## Code references

- `apps/backend/src/modules/deposit-ingestion/`
- `apps/backend/src/config/env.validation.ts` (Joi)
- `apps/backend/src/config/production-boot-guard.ts`
