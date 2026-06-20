# Hot / cold wallet policy (Spliton)

> Требует финального решения treasury + юристов перед production.

## Hot wallet

- Operational USDT outflows (withdrawals).
- Address in `TREASURY_HOT_WALLET_ADDRESS` — **never** private key in Spliton.
- Min/max thresholds → system alerts (`treasury.hot_wallet.low` / `.high`).

## Cold wallet

- Long-term storage; **no automated send** from application code.
- Address in `TREASURY_COLD_WALLET_ADDRESS` for reconciliation display only.
- Refill hot wallet — manual process outside app (documented in runbook).

## Large withdrawals

Above `largeWithdrawalUsdt` limit → SUPER_ADMIN approval tier + manual provider send.
