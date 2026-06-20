# Onboarding (Spliton)

После регистрации пользователь видит checklist в `/dashboard/profile` (overview).

## API

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/v1/onboarding` | Текущий прогресс |
| PATCH | `/api/v1/onboarding/steps/:stepId` | Отметить шаг (explore/support) |
| POST | `/api/v1/onboarding/steps/:stepId/skip` | Пропустить optional шаг |
| POST | `/api/v1/onboarding/dismiss` | Скрыть карточку |
| POST | `/api/v1/onboarding/complete` | Завершить onboarding |

## Шаги

Обязательные: verify_email, complete_profile, explore_catalog, deposit_wallet, first_purchase, view_portfolio.

Optional: explore_secondary, enable_2fa, open_support.

Auto-detect: email verified, displayName, deposits, orders/positions, 2FA.

## БД

`user_onboarding_state`: dismissedAt, completedAt, stepOverrides (JSON).

Migration: `20260603180000_user_onboarding_state`.
