# Maintenance mode

## Backend enforcement

`FeatureFlagsService.assertEnabled()` бросает dedicated error codes:

| Flag | Code |
|------|------|
| `enableMaintenanceMode` | `SYSTEM_MAINTENANCE` |
| withdrawals off | `WITHDRAWAL_DISABLED` |
| secondary off | `MARKET_DISABLED` |
| primary off | `PURCHASE_DISABLED` |
| deposits off | `DEPOSIT_DISABLED` |
| reports off | `REPORT_FORBIDDEN` |

Env: `FEATURE_MAINTENANCE_MODE`, `KILL_SWITCH_DISABLE_*`, `FEATURE_ENABLE_*`.

## User communication

1. System announcement (banner) — `/admin/system-status`
2. Public status — `/api/v1/system-status`, `/system-status` page
3. Localized API errors in UI via i18n mapper

## Admin workflow

1. Создайте announcement type `MAINTENANCE` или `INCIDENT`
2. Укажите `startsAt` / `endsAt`, audience `ALL`
3. Publish → banner на всех поверхностях
4. При необходимости включите kill switch в env

## Checklist

- [ ] Banner visible RU/EN/KA
- [ ] API returns localized code (not raw env message only)
- [ ] Audit entry created
