# Legal policies (Spliton)

> **Требует проверки юристом** перед production и реальными деньгами. Тексты в seed (`legal-policy-seed.content.ts`) — черновики.

## Реализовано в коде

- Модель `LegalPolicy` в Prisma: тип, версия, статус (`DRAFT` / `REVIEW` / `ACTIVE` / `ARCHIVED`), markdown-контент, `requiresUserConsent`.
- Публичные API: `GET /api/v1/legal/policies/active`, `GET /api/v1/legal/policies/:type/active`.
- Admin API: CRUD, publish, archive, подсчёт согласий — `apps/backend/src/modules/legal/`.
- Seed при `SEED_LEGAL_POLICIES_ON_BOOT=true`.

## Типы политик

`TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `RISK_DISCLOSURE`, `MARKET_RULES`, `FEE_POLICY`, `AML_POLICY`, `KYC_POLICY`, `INVESTOR_AGREEMENT`, `SECONDARY_MARKET_RULES`, `WITHDRAWAL_POLICY`, и др. (см. enum `LegalPolicyType`).

## Операции

1. Создать черновик в admin → Legal.
2. Опубликовать (`POST .../publish`) — предыдущая ACTIVE той же категории уходит в ARCHIVED.
3. Пользователи без согласия на новую версию блокируются `EligibilityService` на чувствительных действиях.
