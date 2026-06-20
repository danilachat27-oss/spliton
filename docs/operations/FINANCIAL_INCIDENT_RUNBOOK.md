# Financial Incident Runbook — Spliton

## Immediate actions

| Symptom | Kill switch | Env |
|---------|-------------|-----|
| Suspicious withdrawals | Stop withdrawals | `KILL_SWITCH_DISABLE_WITHDRAWALS=true` |
| Bad deposit credits | Stop credit | `KILL_SWITCH_DISABLE_DEPOSIT_CREDIT=true` |
| Primary market issue | Stop buys | `KILL_SWITCH_DISABLE_PRIMARY_PURCHASES=true` |
| Secondary market issue | Stop trading | `KILL_SWITCH_DISABLE_SECONDARY_TRADING=true` |
| Email abuse | Stop email | `FEATURE_ENABLE_EMAIL_DELIVERY=false` |

Restart API after env change. Confirm at `GET /api/admin/v1/safety/console`.

## Reconciliation mismatch

1. Admin → Ledger reconciliation → **dry-run**
2. Export mismatch rows from report job
3. Do **not** manual SQL — use admin deposit/withdrawal workflows
4. Document in audit log

## Failed transaction recovery

### Stuck withdrawal
1. `/admin/withdrawals` → find status `PROCESSING` / `PENDING_APPROVAL`
2. Hold → investigate → reject or complete with phrase confirm
3. Verify `ledger_postings` balanced

### Duplicate deposit credit
1. Check `deposit_ingestion_log` for duplicate tx hash
2. If credited twice — compliance + SUPER_ADMIN only
3. Reverse via admin workflow (never delete ledger rows)

## Ownership / payout incident

```powershell
npx tsx scripts/finance/backfill-ownership-ledger.ts --dry-run
```

If missing > 0 — **do not run distribution** until finance approves `--apply`.

## Escalation

1. On-call enables kill switch
2. Post in operator channel + system status incident
3. Preserve logs (`LOG_LEVEL=error`, Sentry)
4. Post-mortem within 24h

See also [EMERGENCY_PAUSE_RUNBOOK.md](../operations/EMERGENCY_PAUSE_RUNBOOK.md).
