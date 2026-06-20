# User consents (Spliton)

> Юридические формулировки согласий — **требуют проверки юристом**.

## Модель

`UserLegalConsent`: `userId`, `policyType`, `policyVersion`, `policyId`, `source`, `ip`, `userAgent`, `acceptedAt`.

## Источники (`ConsentSource`)

| Источник | Обязательные политики |
|----------|----------------------|
| `REGISTER` | Terms, Privacy |
| `PRIMARY_PURCHASE` | Terms, Risk disclosure, Investor agreement, Fee policy |
| `SECONDARY_TRADE` | Secondary market rules, Risk disclosure, Fee policy |
| `WITHDRAWAL` | Withdrawal policy, AML policy |

## API

- `GET /api/v1/legal/consents` — список принятых.
- `POST /api/v1/legal/consents` — принять по `policyIds` + `source`.
- `GET /api/v1/legal/center` — активные, принятые, недостающие.

## Поведение

При смене ACTIVE-версии политики с `requiresUserConsent=true` backend возвращает `CONSENT_REQUIRED` до повторного принятия.
