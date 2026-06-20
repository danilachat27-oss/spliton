# Release CMS and Readiness

Admin заполняет страницу релиза через tracks CMS + dedicated endpoints.

## Checklist (`GET /api/admin/v1/releases/:id/approval/readiness`)

| Code | Label | Critical |
|------|-------|----------|
| title | Название | yes |
| artist | Артист | yes |
| cover | Обложка | yes |
| genre | Жанр | yes |
| description | Описание | yes |
| deal_terms | Holder + artist share | yes |
| risk_disclosure | Risk disclosure text | yes |
| primary_price | Unit price | yes |
| total_units | Total units | yes |
| round | Primary raise round | yes |
| faq | ≥1 published FAQ | yes |
| data_room | ≥1 published document | yes |

Publish blocked until readiness ≥80% and all approval stages APPROVED.

## FAQ admin

`GET/POST /api/admin/v1/releases/:releaseId/faq`  
`PATCH/DELETE .../:faqId`

Global fallback FAQ: `release_faq_items` with `releaseId = null`.

## Video states

| Status | UI |
|--------|-----|
| NONE | Placeholder «Видео не добавлено» |
| PROCESSING | Spinner + «Видео обрабатывается» |
| READY | Player MP4/HLS |
| FAILED | Safe error message |

## Files

Upload via admin: cover (public), documents (private bucket), video (public).

Never seed fake legal PDFs into production — admin uploads real files.
