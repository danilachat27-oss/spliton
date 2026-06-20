# Реферальная программа Spliton

## Атрибуция

- Параметр `?ref=` на `/auth/register` (или `referralCode` в API регистрации).
- Cookie `spliton_ref` хранится 30 дней (first-touch).
- Коды одобренных партнёров (`P-…`) также принимаются как referrer.
- Один referred user — одна атрибуция; self-referral блокируется с risk flag `REFERRAL_SELF_ATTEMPT`.

## События и правила (seed)

| Событие | Награда |
|---------|---------|
| EMAIL_VERIFIED | 2 USDT |
| FIRST_DEPOSIT (min 10 USDT) | 5 USDT |
| FIRST_PRIMARY_PURCHASE (min 20 USDT) | 10 USDT |
| SECONDARY_TRADE_FEE | 10% комиссии, max 50 USDT |

## API (пользователь)

- `GET /api/v1/referrals/me`
- `POST /api/v1/referrals/apply-code`
- `GET /api/v1/referrals/invites`
- `GET /api/v1/referrals/rewards`
- `GET /api/v1/referrals/statement` (JSON)

## Выплаты

Одобренные награды зачисляются через `WalletLedgerService` (`REFERRAL_REWARD`), audit и уведомления.

## Админка

`/admin/referrals` — сводка, одобрение/отклонение наград и партнёров (RBAC).
