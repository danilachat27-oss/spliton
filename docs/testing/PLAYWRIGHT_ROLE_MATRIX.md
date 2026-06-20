# Playwright role matrix

Installed in `apps/frontend` (`@playwright/test`).

## Run locally

```powershell
cd apps/frontend
npm install
npx playwright install chromium
npm run build
npm run test:e2e
```

Optional UI mode: `npm run test:e2e:ui`.

Environment:

| Variable | Default |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:3000` |

Config: `apps/frontend/playwright.config.ts` (starts `next start` unless server already running).

## What is covered

| File | Scope |
|------|--------|
| `e2e/admin/role-matrix.spec.ts` | Nav `data-testid` per role; BA settings forbidden; SUPER_ADMIN settings/roles |
| `e2e/smoke/public-routes.spec.ts` | Login, admin login, guest redirect, catalog, wallet, secondary, assets |

Roles in matrix: `SUPER_ADMIN`, `ACCOUNTANT`, `CONTENT_MANAGER`, `SUPPORT_MANAGER`, `COMPLIANCE`, `BUSINESS_ANALYST`, `NEWS_MANAGER`.

Admin tests **mock** `POST /auth/refresh`, `GET /users/me`, and `GET /api/admin/v1/access` so CI does not require a live API. Nav expectations are derived from `getVisibleAdminNav()` (same source as the UI).

## Adding a scenario

1. Extend `mockStaffSession` in `e2e/helpers/mock-staff-session.ts` if new API calls block rendering.
2. Add `data-testid={`admin-nav-${item.id}`}` via `AdminNavLink` (sidebar already passes `testId`).
3. For forbidden pages, assert copy from `AdminSectionForbidden` (`нет доступа к этому разделу`).

## CI

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) job `playwright` runs after frontend build.

## Manual QA (live API)

When `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live`, verify with real staff accounts on staging — see [STAGING_LIVE_CHECKLIST.md](../operations/STAGING_LIVE_CHECKLIST.md).
