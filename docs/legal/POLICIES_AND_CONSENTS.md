# Политики и согласия (Spliton)

## Типы политик

- Terms of Service (`terms`)
- Privacy Policy (`privacy`)
- Risk disclosure
- Market rules
- Fee policy

Публичные страницы: `/terms`, `/privacy`, `/legal/:type`, `/fees`.

## Модель согласия

При принятии сохраняется:

- `userId`
- тип политики и версия
- `acceptedAt`
- IP / user agent (если доступны)
- источник (`registration`, `purchase`, `settings`)

## Обязательные точки

1. **Регистрация** — terms + privacy (checkbox required).
2. **Покупка UNT** — risk disclosure / market rules при необходимости.
3. **Профиль → Правовой центр** — просмотр принятых версий.

## API

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/v1/legal/policies` | Активные версии |
| GET | `/api/v1/legal/policies/:type` | Конкретная политика |
| GET | `/api/v1/legal/consents/me` | Согласия пользователя |
| POST | `/api/v1/legal/consents` | Принять политику |

## Админ

- Просмотр версий и публикация — `/admin/legal` (foundation CMS).
- Экспорт consents — через admin compliance при необходимости.

## Брендинг

В пользовательских текстах и письмах используется название **Spliton**, не RevShare.
