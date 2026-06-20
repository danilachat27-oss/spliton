# Партнёрская программа Spliton

Отдельный контур от пользовательской реферальной программы.

## Статусы

`APPLIED` → `IN_REVIEW` → `APPROVED` / `REJECTED` / `SUSPENDED`

## Типы

`AFFILIATE`, `INFLUENCER`, `AGENCY`, `ARTIST_MANAGER`, `STRATEGIC_PARTNER`

## API

- `POST /api/v1/partners/apply`
- `GET /api/v1/partners/me`
- `GET /api/v1/partners/performance` (после APPROVED)

## Админ

`POST /api/admin/v1/referrals/partners/:id/approve|reject|suspend`
