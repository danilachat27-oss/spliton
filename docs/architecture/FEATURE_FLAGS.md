# Feature flags & kill switches

`FeatureFlagsService` reads env (see `env.validation.ts`).

## User capabilities

| Flag | Env | Default |
|------|-----|---------|
| enableDeposits | FEATURE_ENABLE_DEPOSITS | true |
| enableWithdrawals | FEATURE_ENABLE_WITHDRAWALS | true |
| enablePrimaryMarket | FEATURE_ENABLE_PRIMARY_MARKET | true |
| enableSecondaryMarket | FEATURE_ENABLE_SECONDARY_MARKET | true |

## Kill switches (instant off)

| Switch | Env |
|--------|-----|
| disableWithdrawalsImmediately | KILL_SWITCH_DISABLE_WITHDRAWALS |
| disableSecondaryTradingImmediately | KILL_SWITCH_DISABLE_SECONDARY_TRADING |
| disablePrimaryPurchasesImmediately | KILL_SWITCH_DISABLE_PRIMARY_PURCHASES |
| disableDepositsCredit | KILL_SWITCH_DISABLE_DEPOSIT_CREDIT |

API returns `503 FEATURE_DISABLED` with Russian message.

Snapshot visible in `GET /api/admin/v1/safety/console`.
