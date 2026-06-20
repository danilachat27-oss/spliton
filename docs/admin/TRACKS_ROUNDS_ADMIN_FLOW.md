# Tracks & rounds admin flow (Spliton Operator Portal)

## Tracks (`/admin/tracks`)

Live CRUD via `/api/admin/v1/tracks`.

### Release form (drawer)

Секции:

1. **Основная информация** — название, артист (text + TODO Artists API), тип (single/EP/album), жанр, дата релиза, статус CRM (read-only, через actions).
2. **Медиа** — `coverUrl`, `audioPreviewUrl` (URL fallback) + **Supabase upload** (`POST .../tracks/:id/cover`, `.../audio-preview`) when storage configured.
3. **Описание и права** — description, label, copyright, ISRC/UPC, внешние ссылки.
4. **Параметры дохода** — holder / artist / platform % (sum = 100%).
5. **Юниты** — total, available, price, min/max purchase.
6. **Финансовые условия** — raise target, hard cap, promo, upfronts, distribution notes.
7. **Публикация** — checklist + actions.

Live preview: `AdminTrackCatalogPreview` (каталог Spliton).

### API

| Action | Method | Path |
|--------|--------|------|
| List | GET | `/api/admin/v1/tracks` |
| Detail | GET | `/api/admin/v1/tracks/:id` |
| Create | POST | `/api/admin/v1/tracks` |
| Update | PATCH | `/api/admin/v1/tracks/:id` |
| Submit review | POST | `/api/admin/v1/tracks/:id/submit-review` |
| Publish | POST | `/api/admin/v1/tracks/:id/publish` |
| Pause | POST | `/api/admin/v1/tracks/:id/pause` |
| Archive | POST | `/api/admin/v1/tracks/:id/archive` |

### DTO / validation (backend)

- `AdminTrackMutationDto` + `admin-track.validation.ts`
- Title & artist required on create
- Share split = 100% when all share fields sent
- Units & price non-negative; sold ≤ total
- Valid HTTP(S) URLs for cover, preview, external links
- Publish blocked until checklist fields valid (`TRACK_NOT_READY`)

### DB fields (Release)

Existing: title, slug, symbol, coverUrl, genre, shares, units, primaryUnitPrice, labelId, financial USDT fields.

Added (migration `20260531350000_release_catalog_metadata`):

- `description`, `audio_preview_url`, `release_date`, `release_type`
- `copyright_owner`, `isrc`, `upc`
- `spotify_url`, `apple_music_url`, `youtube_url`, `yandex_music_url`
- `min_purchase_units`, `max_purchase_units`, `distribution_notes`

### Permissions

| Role | Tracks |
|------|--------|
| SUPER_ADMIN / ADMIN / CONTENT_MANAGER | create, edit, publish, pause, archive |
| ACCOUNTANT / BUSINESS_ANALYST / COMPLIANCE | read (list/detail) |
| SUPPORT_MANAGER | no matrix access |

Frontend: `useAdminPermissions` — кнопки drawer.

### Audit

- `track.create`, `track.update`
- `track.cover_update`, `track.media_update`
- `track.financial_terms_update`, `track.units_update`
- `track.submit_review`, `track.publish`, `track.pause`, `track.archive`

### TODO

- **Public/Admin Artists API** — selector вместо text input
- ~~**MediaStorageService** + upload endpoints~~ — implemented ([SUPABASE_STORAGE.md](../operations/SUPABASE_STORAGE.md))
- Primary round linkage in publish checklist (создаётся в `/admin/rounds`)

---

## Rounds (`/admin/rounds`)

Первичное размещение юнитов по релизу. Продукт — **Spliton** (не RevShare Platform).

### Round form (drawer)

Секции:

1. **Релиз** — поиск, выбор релиза, карточка (обложка, артист, жанр, статус, доли, юниты). Без релиза числовые поля скрыты.
2. **Основные параметры** — `name` (внутреннее название), статус (read-only, через actions), даты начала/окончания.
3. **Юниты и цена** — total, available (computed), sold (read-only после продаж), `unitPriceUsdt` (на релизе), min/max purchase.
4. **Финансовые лимиты** — raise target, hard cap, raised (read-only), progress, потенциал при полной продаже.
5. **Условия для пользователей** — min/max, комиссия платформы (read-only), все пользователи (whitelist — TODO).
6. **Preview каталога** — `AdminRoundCatalogPreview` (sticky column).
7. **Checklist перед публикацией** — блокирует «Опубликовать» с причиной.

### API

| Action | Method | Path |
|--------|--------|------|
| List | GET | `/api/admin/v1/rounds` |
| Detail | GET | `/api/admin/v1/rounds/:id` |
| Create | POST | `/api/admin/v1/rounds` |
| Update | PATCH | `/api/admin/v1/rounds/:id` |
| Publish | POST | `/api/admin/v1/rounds/:id/publish` |
| Pause | POST | `/api/admin/v1/rounds/:id/pause` |
| Close | POST | `/api/admin/v1/rounds/:id/close` |

### DTO / validation (backend)

- `admin-round.validation.ts`
- Release exists, not archived
- `total_units > 0`, `sold_units <= total_units`, `unit_price > 0` (via release)
- Raise target / hard cap согласованы; dates valid
- Publish: cover, artist, shares, dates, no other LIVE round on same release (`ROUND_NOT_READY`)
- Terminal statuses (completed/cancelled) — no update/publish

### DB fields (`primary_raise_rounds`)

- `release_id`, `status` (DRAFT/LIVE/PAUSED/COMPLETED/CANCELLED)
- `name` (optional, migration `20260531360000_round_display_name`)
- `raise_target_usdt`, `hard_cap_usdt`, `raised_amount_usdt`
- `total_units`, `sold_units`
- `start_date`, `end_date`

**Цена за юнит и min/max purchase** хранятся на `releases` (`primary_unit_price`, `min_purchase_units`, `max_purchase_units`) — раунд PATCH может обновить их в одной транзакции.

### Permissions

| Role | Rounds |
|------|--------|
| SUPER_ADMIN / ADMIN / CONTENT_MANAGER | create, update, publish, pause, close |
| ACCOUNTANT / BUSINESS_ANALYST / COMPLIANCE | read (list/detail) |
| SUPPORT_MANAGER | no matrix access |

Frontend: `useAdminPermissions().can('Rounds', 'create'|'update'|'approve')`, read-only banner.

### Audit

- `round.create`, `round.update`
- `round.financial_terms_update`, `round.units_update`, `round.date_update`
- `round.publish`, `round.pause`, `round.close`

Payload: before/after по status, name, units, unit price, raise/hard cap, dates.

### Confirm dialogs

- **Publish** — раунд станет доступен для покупки юнитов.
- **Pause** — покупки временно недоступны.
- **Close** — закрытие для новых покупок, запись в audit.

### Analytics (`/admin/analytics/tracks`)

Track & Round Intelligence: portfolio health, KPI, round progress table, units/holders/revenue/secondary, readiness score, top/attention, insights. API: `/api/admin/v1/analytics/tracks/*`. См. [ANALYTICS_DASHBOARDS.md](../analytics/ANALYTICS_DASHBOARDS.md).

### TODO

- **Buyer whitelist** для primary rounds
- **Analytics filters** — query params (status, progress range, artist) на backend + UI filter bar
- **Improve release drawer** media/artist/genre если релиз без обложки/артиста
- Связать publish release ↔ active round в единый workflow

### DB constraints

Respect CHECK on `primary_raise_rounds` (`sold_units <= total_units`, etc.).
