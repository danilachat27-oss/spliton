# Country restrictions (Spliton)

> Список стран и статусы **требуют юридического решения** перед production.

## Модель

`CountryRestriction`: `countryCode`, `status` (ALLOWED/RESTRICTED/BLOCKED), `appliesTo` (registration, deposits, withdrawals, primary, secondary, payouts).

## Источник страны пользователя

Профиль (`profile.countryCode`), далее KYC; IP — только soft signal (не реализован как enforcement).

## Admin

`GET/POST /api/admin/v1/legal/countries` — upsert с audit.

## Enforcement

`CountryRestrictionsService.checkCountry` в `EligibilityService`.
