# Eligibility rules (Spliton)

Центральный сервис: `apps/backend/src/modules/compliance/eligibility.service.ts`.

## Методы

- `canDeposit`, `canWithdraw`, `canBuyPrimary`, `canTradeSecondary`, `canCreateListing`
- `assertAllowed(userId, ConsentSource)` — бросает `COMPLIANCE_RESTRICTED`

## Проверки (порядок)

1. Аккаунт / email verified / suspended
2. AML BLOCKED / freeze account
3. Country restrictions (профиль → scope)
4. Missing legal consents
5. KYC (если env-флаги)
6. AML restrictions по действию
7. Feature flags (withdrawals / markets)

## Интеграция

- `PrimaryOrderService.purchase`
- `UserMarketService.buyListing`, `createListing`
- `UserWithdrawalsService.create`

## API для UI

`GET /api/v1/compliance/eligibility/{primary|secondary|withdrawal|deposit}`
