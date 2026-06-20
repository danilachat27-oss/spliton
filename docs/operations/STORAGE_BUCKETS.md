# Storage buckets (Spliton / Supabase)

| Bucket | Доступ | Назначение |
|--------|--------|------------|
| `release-covers` | public CDN | обложки релизов |
| `release-audio` | private + signed URL | превью аудио |
| `reports` | private | CSV/XLSX отчёты операторов |
| `user-documents` | private | квитанции и документы пользователя |
| `news-images` | public или signed CDN | обложки новостей |
| `support-attachments` | private | вложения тикетов поддержки |
| `report-documents` | private | PDF/XLSX/DOCX отчётов операторов (альт. `reports`) |

## Download policy

1. Sensitive buckets — только service role + controlled API (`GET …/download`).
2. Signed URL — TTL ≤ 15 мин, одноразовое назначение по запросу авторизованного пользователя.
3. Audit: генерация и скачивание отчётов/квитанций в admin audit / document `downloadCount`.
4. MIME whitelist, max size на upload; path traversal запрещён на backend.
5. Storage health: deep health / admin system status.

## Env

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `REPORT_STORAGE_BUCKET` (default: `reports`)
- `NEWS_MEDIA_BUCKET` (default: `news-images`)

## Политики

- Private buckets: только service role + signed URLs для авторизованных запросов.
- Не загружать исполняемые файлы; проверять MIME и размер на backend.
