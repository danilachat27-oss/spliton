# TODO Production

## Infrastructure targets

| Env | Frontend | Backend | Database |
|-----|----------|---------|----------|
| Production | Vercel production | Hetzner prod | Supabase prod |
| Staging | Vercel preview | Hetzner staging | Supabase staging |

## ENV checklist (never commit values)

### Backend

- `DATABASE_URL` / `DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URL` / `ADMIN_FRONTEND_URL`
- `REDIS_URL` (sessions/rate limits)
- `WEBHOOK_SECRET`
- `TRON_PROVIDER_URL`
- `EMAIL_PROVIDER_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

### Frontend

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_ADMIN_API_BASE_URL` (optional)
- `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` (users/deposits/withdrawals/wallets/audit live)

## Admin portal (operator UX)

- [x] Grouped sidebar (7 sections)
- [x] Russian UI localization
- [x] Role-based nav visibility
- [x] Financial confirm dialogs + audit copy
- [x] Analytics workspace + executive dashboard (backend aggregation)
- [x] BUSINESS_ANALYST read-only role (enum migration + e2e)
- [x] Async CSV report jobs (12 types, in-process worker)
- [x] Platform revenue charts + export (live)
- [x] Roles page live + SUPER_ADMIN phrase confirm
- [x] Tracks drawer create/update (live)
- [ ] Rounds drawer full submit (tracks done; rounds partial)
- [ ] Playwright UI role matrix (plan: `ADMIN_PLAYWRIGHT_ROLE_MATRIX.md`)
- [ ] Dedicated report worker + object storage (S3/R2)
- [ ] Idempotent financial mutations
- [ ] Rate limits on admin mutations
- [ ] IP allowlist optional for staff (enterprise)

## Wallet / ledger

- [ ] Double-entry ledger in DB
- [ ] Reconciliation jobs
- [ ] No single `balance` field without ledger

## Compliance

- [ ] AML rules engine hook
- [ ] Withdrawal hold workflow with SLA

## CI

- [ ] `pnpm run build` on PR
- [x] Backend e2e: `admin-access`, `admin-analytics-access`, `withdrawal-ledger`
- [ ] Stabilize e2e against shared Supabase (register 500 flakes under load)

## Prisma (Windows)

- [x] `PRISMA_WINDOWS_EPERM.md` + `scripts/check-backend-for-prisma.mjs`
- [x] Analytics indexes migration `20260531210000_analytics_indexes`
