# Emergency pause runbook (Spliton)

## Kill switches (env)

| Env | Effect |
|-----|--------|
| `KILL_SWITCH_DISABLE_WITHDRAWALS` | Blocks user withdrawals |
| `KILL_SWITCH_DISABLE_DEPOSITS` | Blocks deposit address / deposit flows |
| `KILL_SWITCH_DISABLE_DEPOSIT_CREDIT` | Blocks crediting detected deposits |
| `KILL_SWITCH_DISABLE_PRIMARY_PURCHASES` | Primary market |
| `KILL_SWITCH_DISABLE_SECONDARY_TRADING` | Secondary market |
| `KILL_SWITCH_DISABLE_REVENUE_DISTRIBUTION` | Distribution run |
| `KILL_SWITCH_DISABLE_REPORT_DOWNLOADS` | Report downloads |
| `FEATURE_ENABLE_EMAIL_DELIVERY=false` | Disables outbound email |
| `FEATURE_MAINTENANCE_MODE` | Global maintenance message |

Enforced in `FeatureFlagsService` backend-side. View: `GET /api/admin/v1/safety/console`.

Production boot guard (`apps/backend/src/config/production-boot-guard.ts`) blocks unsafe TRON/email/redis config at startup when `NODE_ENV=production`.

## Procedure

1. Confirm incident (finance/compliance).
2. Set kill switch env on API host; restart.
3. Verify `/api/admin/v1/safety/console` flags.
4. Notify operators via support/status page.
5. Document in audit; clear switch after root cause fixed.

## Phrase confirmation

Production UI for SUPER_ADMIN emergency toggles should require confirmation phrase (frontend follow-up). Backend logs all safety mutations.
