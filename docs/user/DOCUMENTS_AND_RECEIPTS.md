# Документы и квитанции (Spliton)

## Пользовательские документы

| Документ | API | Формат |
|----------|-----|--------|
| Квитанция пополнения | `POST /api/v1/wallet/deposits/:id/receipt` | PDF |
| Квитанция сделки (вторичка) | `POST /api/v1/documents/trades/:id/receipt` | PDF |
| Квитанция покупки (первичка) | `POST /api/v1/documents/orders/:id/receipt` | PDF |
| Выписка по кошельку | `POST /api/v1/documents/statement` | PDF / XLSX |
| Список | `GET /api/v1/documents` | — |
| Скачивание | `GET /api/v1/documents/:id/download` | по формату |

## Оформление

Все PDF/XLSX/DOCX формируются единым рендерером Spliton:

- фирменная шапка и цвет акцента;
- номер операции, статус, дата;
- таблицы с зеброй (отчёты);
- листы Summary / Data / Metadata (XLSX);
- дисклеймер и контакт поддержки в подвале;
- маскировка адресов кошельков и email в квитанциях.

Код: `apps/backend/src/common/export/report-renderer.service.ts`, тема: `spliton-document-theme.ts`.

## Безопасность

- только владелец (JWT);
- срок хранения записи — 7 дней (`DOCUMENT_TTL_DAYS`);
- счётчик скачиваний;
- без публичных URL на чувствительные файлы;
- production: bucket `user-documents` ([STORAGE_BUCKETS.md](../operations/STORAGE_BUCKETS.md)).

## UI

Раздел «Документы» в кабинете: список, статус готовности, повторное скачивание. При истечении срока — честный empty state с предложением сформировать заново.
