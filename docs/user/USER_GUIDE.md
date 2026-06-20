# User Guide — Spliton SaaS

## Основные разделы

| Раздел | Route | Статус |
|--------|-------|--------|
| Профиль | `/dashboard/profile` | Live wallet/holdings; onboarding checklist |
| Настройки | `?tab=settings` | PATCH `/users/me/preferences` (live) |
| Безопасность | `?tab=security` | 2FA API; sessions — `/api/v1/me/sessions` |
| Уведомления | `/dashboard/notifications` | Live in-app + preferences |
| Документы | `/dashboard/documents` | Live list + download |
| Поддержка | `/dashboard/support` | Live tickets |
| Trust Center | `/trust` | Static + links |
| Комиссии | `/fees` | Public fee transparency |
| Legal | `/terms`, `/privacy`, profile legal tab | Versioned policies + consents |

## Первый вход

1. Register → verify email  
2. Onboarding checklist в профиле  
3. Deposit → catalog → buy → portfolio  

## Live vs mock

`NEXT_PUBLIC_WALLET_DATA_SOURCE=live` — финансы и onboarding из API.  
Mock только в dev fixtures.
