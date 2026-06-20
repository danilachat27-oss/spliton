# Staging environment checklist

> Не коммитить реальные секреты. Примеры — в `.env.staging.example` (frontend) и `.env.example` (backend).

## Build guard (frontend)

При `NEXT_PUBLIC_APP_ENV=staging` или `production` сборка **падает**, если:

- любой `NEXT_PUBLIC_*_DATA_SOURCE=mock`
- не задан `NEXT_PUBLIC_API_BASE_URL`

Реализация: `apps/frontend/lib/validate-public-env.ts`, вызывается из `next.config`.

## Frontend (public)

| Env | Required | Example | Где используется | Риск если не задан |
|-----|----------|---------|------------------|-------------------|
| `NEXT_PUBLIC_APP_ENV` | **yes** | `staging` | `lib/public-env.ts`, build guard | Сборка может пройти в dev-режиме с mock |
| `NEXT_PUBLIC_API_BASE_URL` | **yes** | `https://api.staging.spliton.example` | Auth, wallet, catalog, support fetch | Build fail; live UI без API |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | no | same as API | Admin portal | Fallback на основной API |
| `NEXT_PUBLIC_WALLET_DATA_SOURCE` | **yes** | `live` | Wallet, orders, payouts | Build fail; демо-покупки/фейк receipt |
| `NEXT_PUBLIC_CATALOG_DATA_SOURCE` | **yes** | `live` | Catalog list/buy | Build fail; mock-каталог |
| `NEXT_PUBLIC_ADMIN_DATA_SOURCE` | **yes** | `live` | Admin portal | Build fail |
| `NEXT_PUBLIC_SUPPORT_DATA_SOURCE` | **yes** | `live` | Support tickets | Build fail; demo-chat |
| `NEXT_PUBLIC_NEWS_DATA_SOURCE` | **yes** | `live` | `/news` | Build fail |
| `NEXT_PUBLIC_STATUS_DATA_SOURCE` | **yes** | `live` | `/system-status` | Build fail |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_USDT` | no | `50` | Withdraw UI hint | Backend min остаётся источником истины |

### Playwright (staging smoke only)

| Env | Required | Example | Где используется | Риск если не задан |
|-----|----------|---------|------------------|-------------------|
| `PLAYWRIGHT_BASE_URL` | no | `https://staging.spliton.example` | `playwright.config.ts` | Локальный `127.0.0.1:3000` |
| `PLAYWRIGHT_API_BASE_URL` | no | staging API | `e2e/helpers/e2e-fixtures.ts` | Fallback на `NEXT_PUBLIC_API_BASE_URL` |
| `PLAYWRIGHT_BUY_RELEASE_ID` | no* | UUID из seed | Buy E2E | Skip buy smoke без release |
| `PLAYWRIGHT_TEST_USER_EMAIL` | no* | `staging.qa.investor@spliton.test` | Live login E2E | Skip live auth flows |
| `PLAYWRIGHT_TEST_USER_PASSWORD` | no* | из password manager | Live login E2E | Skip live auth flows |
| `PLAYWRIGHT_ENABLE_LIVE_PURCHASE` | no | `1` | Controlled buy E2E | Покупка не автоматизируется |

\* Обязательны для полного staging Playwright на live API.

## Backend (secrets — deploy platform only)

| Env | Required | Example | Где используется | Риск если не задан |
|-----|----------|---------|------------------|-------------------|
| `DATABASE_URL` | **yes** | Supabase pooler `:6543?pgbouncer=true` | Prisma runtime | API не стартует |
| `DIRECT_URL` / `DIRECT_DATABASE_URL` | **yes** | `db.<ref>.supabase.co:5432` | Migrations | DDL fail |
| `JWT_SECRET` | **yes** | long random | Auth tokens | Auth broken |
| `JWT_REFRESH_SECRET` | **yes** | long random | Refresh tokens | Sessions broken |
| `FRONTEND_ORIGIN` | **yes** | `https://staging.spliton.example` | CORS, email links | CORS block, wrong redirects |
| `AUTH_COOKIE_DOMAIN` | no* | `.spliton.example` | Refresh cookie | Cross-subdomain login fail |
| `AUTH_COOKIE_SECURE` | **yes** on HTTPS | `true` | Refresh cookie | Cookie rejected |
| `AUTH_COOKIE_SAME_SITE` | **yes** | `lax` | Refresh cookie | OAuth/cookie issues |
| `APP_PUBLIC_URL` | **yes** | frontend staging URL | Email templates | Broken verify links |
| `MIN_WITHDRAWAL_USDT` | **yes** | `50` | Withdraw validation | Wrong limits |
| `WITHDRAWAL_FEE_USDT` | **yes** | `5` | Withdraw fees | Wrong fee display |
| `ALLOW_DEV_DEPOSIT_ADDRESS` | staging | `true` | Deposit address | No deposit address on staging |
| `DEPOSIT_INGESTION_ENABLED` | per plan | `false` / `true` | TRON watcher | Unexpected credits |
| `TRON_PROVIDER_MODE` | staging | `mock` or `tron` | Deposits | Chain vs dry-run |
| `SUPABASE_URL` | if storage | `https://<ref>.supabase.co` | File uploads | Covers/audio fail |
| `SUPABASE_SERVICE_ROLE_KEY` | if storage | secret | Backend storage only | Upload fail |
| `REPORT_STORAGE_*` | if reports | bucket/mode | Report exports | Download fail |
| `SEED_LEGAL_POLICIES_ON_BOOT` | once | `true` | Legal consents | Buy/withdraw blocked |

\* Нужен при frontend и API на разных поддоменах одного parent domain.

## Admin seed

После `migrate deploy` на staging:

1. Зарегистрировать staff email (или использовать `staging.qa.support@spliton.test` из QA seed).
2. `npm run prisma:seed` — роли + SUPER_ADMIN hint для `danila.chat27@gmail.com`.

## QA seed

```powershell
# DATABASE_URL = staging DB
npm run prisma:seed:staging-qa
```

См. [STAGING_SEED.md](./STAGING_SEED.md).

## Verify before deploy

```powershell
cd apps/frontend
pnpm run validate:env   # при NEXT_PUBLIC_APP_ENV=staging в env
pnpm run build          # должен упасть при mock sources

cd ../..
npm run prisma:migrate:deploy
npm run prisma:seed:staging-qa
```
