# Treasury operations (Spliton)

> **No private keys in app.** Hot/cold addresses — public env only. Real sends — external custody/manual.

## Implemented

- `TreasuryAccount` types: USER_LIABILITY, HOT_WALLET, COLD_WALLET, clearing accounts, SUSPENSE.
- Admin API: `/api/admin/v1/treasury/*`
- Seed: `SEED_TREASURY_ACCOUNTS_ON_BOOT=true` + `TREASURY_HOT_WALLET_ADDRESS`, `TREASURY_COLD_WALLET_ADDRESS`.
- Operational limits singleton `treasury_operational_limits`.
- Withdrawal approval tiers (ACCOUNTANT → COMPLIANCE → SUPER_ADMIN by amount).
- Provider lifecycle guard on complete (tx hash or CONFIRMED, or SUPER_ADMIN manual override + reason).
- Treasury reconciliation dry-run / persist run.
- Deposit address rotation (`user_deposit_addresses`).

## Env

| Variable | Purpose |
|----------|---------|
| `TREASURY_HOT_WALLET_ADDRESS` | Public hot wallet address (no key) |
| `TREASURY_COLD_WALLET_ADDRESS` | Documented cold storage address |
| `TREASURY_HOT_MIN_BALANCE_USDT` | Alert threshold |
| `TREASURY_HOT_MAX_BALANCE_USDT` | Alert threshold |
| `SEED_TREASURY_ACCOUNTS_ON_BOOT` | Create treasury accounts on boot |

## Staging rehearsal

```powershell
curl -H "Authorization: Bearer $TOKEN" "$API/api/admin/v1/treasury/reconciliation/run?dryRun=true"
curl -H "Authorization: Bearer $TOKEN" "$API/api/admin/v1/treasury/console"
```

**Admin UI:** `/admin/treasury` — summary, kill switches, reconciliation dry-run/persist, observed balances, limits (SUPER_ADMIN edit), deposit network settings.
