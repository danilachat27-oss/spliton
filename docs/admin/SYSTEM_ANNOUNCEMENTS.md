# System announcements (admin)

## API

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/admin/v1/system-announcements` | Список |
| POST | `/api/admin/v1/system-announcements` | Создать черновик |
| PATCH | `/api/admin/v1/system-announcements/:id` | Обновить |
| POST | `/api/admin/v1/system-announcements/:id/publish` | Опубликовать / schedule |
| POST | `/api/admin/v1/system-announcements/:id/archive` | Архив |
| POST | `/api/admin/v1/system-announcements/:id/preview?locale=` | Preview RU/EN/KA |

Public: `GET /api/v1/system-announcements/active?locale=&surface=public|app|admin`

## RBAC (matrix section `systemStatus`)

- SUPER_ADMIN / ADMIN / NEWS_MANAGER — publish
- CONTENT_MANAGER / COMPLIANCE / ACCOUNTANT — draft (limited)
- CRITICAL notices — только SUPER_ADMIN / ADMIN
- SUPPORT_MANAGER / BUSINESS_ANALYST — read

## UI

`/admin/system-status` → блок «Системные оповещения»:

- Пресеты (техработы, депозиты, выводы, вторичный рынок)
- Вкладки **RU / EN / KA** для title/message/shortMessage
- Schedule: `startsAt` / `endsAt`
- Publish / Archive с audit

User banners: `SystemAnnouncementBanners` на public/app/admin surfaces.

## Переводы

Поле `translations` JSON:

```json
{
  "en": { "title": "…", "message": "…", "shortMessage": "…", "actionLabel": "…" },
  "ka": { "title": "…", "message": "…" }
}
```

Fallback: `ru` base fields (`title`, `message`, …).

## Audit

`announcement.created`, `announcement.updated`, `announcement.published`, `announcement.scheduled`, `announcement.archived`

## Dismiss

Authenticated: `POST /api/v1/system-announcements/:id/dismiss`  
Guests: localStorage `spliton_dismissed_announcements`
