# Release Detail Page (Spliton)

Страница одного релиза — professional release detail / data room. Публичный бренд: **Spliton**.

## Маршруты

| Route | Компонент |
|-------|-----------|
| `/analytics/releases/[id]` | `ReleaseDetailLivePage` → `ReleaseDetailScreen` |
| `/catalog/market-overview/analytics/[id]` | Market overview analytics |
| `/catalog/buy/[id]` | Primary buy flow |

## Live mode (frontend)

`ReleaseDetailLivePage` при `NEXT_PUBLIC_WALLET_DATA_SOURCE=live`:

1. `GET /api/v1/releases/:id/detail` — единый DTO (identity, pulse, deal terms, payout history, secondary, FAQ, user block)
2. `GET /api/v1/releases/:id/charts/price?period=30d` — все периоды в `seriesByPeriod` (7d/30d/90d/ytd/all)
3. `GET /api/v1/releases/:id/my-history` — при `?view=ledger` и auth

Mock (`release-detail.mock.ts`) используется **только** когда data source ≠ live.

## Legacy split endpoints

Сохранены для обратной совместимости; новый код предпочитает unified `/api/v1/releases/:id/detail`.

## Обязательные поля для публикации

См. `ReleaseApprovalService.readiness`:

- title, artist, cover, genre, description
- deal terms (holder + artist share)
- risk disclosure
- primary round, unit price, total units
- published FAQ (≥1 item)
- published data room document
- legal / finance / compliance approvals

## Mock vs live

- **Mock**: только при `getWalletDataSource() !== "live"` — fixtures в `mocks/analytics/release-detail.mock.ts`
- **Live**: все KPI, chart, payout, secondary, FAQ, video states, data room — из backend
- Empty state если данных нет (не fake numbers)

## Admin CMS

- Release fields: admin tracks drawer (cover, description, shares, video URL/status)
- FAQ: `POST/PATCH/DELETE /api/admin/v1/releases/:id/faq`
- Documents: admin uploads + `ReleaseDocument` visibility
- Readiness checklist blocks publish

## Tests

- `apps/backend/src/modules/user-analytics/user-analytics.service.spec.ts`
- Frontend: build + route smoke via CI
