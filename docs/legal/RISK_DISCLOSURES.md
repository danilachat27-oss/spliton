# Risk disclosures (Spliton)

> **Требует проверки юристом.** Seed-тексты не являются финальными.

## Где применяется

- Политика `RISK_DISCLOSURE` — обязательна перед **первичной покупкой**.
- `SECONDARY_MARKET_RULES` + risk — перед **вторичной сделкой**.

## UI

- Модальное подтверждение при покупке в каталоге (live).
- Вкладка «Правовой центр» в профиле.
- Статические страницы `/terms`, `/privacy`, `/fees` — fallback; актуальные версии из API.

## Backend

`EligibilityService` + `LegalConsentsService.getMissingConsents`.
