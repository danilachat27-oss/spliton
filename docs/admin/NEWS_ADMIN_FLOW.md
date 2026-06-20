# News CMS (Spliton)

## Admin

- Route: `/admin/news`
- Roles: `SUPER_ADMIN`, `ADMIN`, `NEWS_MANAGER`, `CONTENT_MANAGER`
- API: `GET/POST /api/admin/v1/news`, `PATCH :id`, `POST :id/publish`, `POST :id/unpublish`

## Public

- `GET /api/v1/news` — published + `publishAt <= now`
- `GET /api/v1/news/:slug`

## Storage

Обложки: bucket `news-images` (Supabase) — TODO production; пока `coverUrl` text.

## Audit

`news.create`, `news.update`, `news.publish`, `news.unpublish`
