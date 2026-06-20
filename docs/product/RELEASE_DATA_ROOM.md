# Release Data Room

`GET /api/v1/releases/:id/data-room`

## Visibility

| Level | Access |
|-------|--------|
| PUBLIC | Anyone |
| AUTHENTICATED | Logged-in users |
| HOLDERS_ONLY | Users with units > 0 |
| ADMIN_ONLY | Hidden from public API |

## Document model

`ReleaseDocument`: title, docType, locale, visibility, status, version, storageKey, url.

Downloads via controlled URL; sensitive docs in private storage.

## Frontend

- `ReleaseDetailDataRoom` on release detail page (dark theme, live only)
- `ReleaseDataRoomSection` on trust/catalog surfaces (light theme)

Empty section hidden when no published documents.
