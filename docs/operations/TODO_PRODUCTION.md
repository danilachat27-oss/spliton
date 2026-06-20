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

- `NEXT_PUBLIC_APP_ENV=production` (or `staging` on preview)
- `NEXT_PUBLIC_API_BASE_URL` (**build fails without it** on staging/production)
- `NEXT_PUBLIC_ADMIN_API_BASE_URL` (optional)
- `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` (**build fails if mock**)
- `NEXT_PUBLIC_WALLET_DATA_SOURCE=live` (**build fails if mock**)
- `NEXT_PUBLIC_SUPPORT_DATA_SOURCE=live` (**build fails if mock**)
- Central env: `apps/frontend/lib/public-env.ts`
- See [FRONTEND_LIVE_AUDIT.md](../frontend/FRONTEND_LIVE_AUDIT.md), [FRONTEND_SMOKE_CHECKLIST.md](../frontend/FRONTEND_SMOKE_CHECKLIST.md)
- [x] User wallet/deposit/withdraw live (`wallet.service.ts`)
- [x] Catalog + primary buy live (UUID bridge)
- [x] Secondary market live tabs (market/orders/history)
- [x] Admin portal live when `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live`
- [x] `/admin/holdings` — KPI, filters, tabbed drawer ([HOLDINGS_ADMIN_FLOW.md](../admin/HOLDINGS_ADMIN_FLOW.md))
- [x] `/admin/wallets` — KPI, filters, tabbed drawer ([WALLETS_ADMIN_FLOW.md](../admin/WALLETS_ADMIN_FLOW.md))
- [x] `/admin/deposits` — KPI, filters, tabbed drawer ([DEPOSITS_ADMIN_FLOW.md](../admin/DEPOSITS_ADMIN_FLOW.md))
- [x] `/admin/withdrawals` — KPI, filters, tabbed drawer ([WITHDRAWALS_ADMIN_FLOW.md](../admin/WITHDRAWALS_ADMIN_FLOW.md))
- [ ] User-facing support tickets API
- [ ] Playwright smoke (checklist ready)

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
- [x] Tracks drawer create/update (live) — профессиональная форма: 7 секций, preview, checklist, publish/pause/archive
- [ ] **Media upload** — [x] Supabase Storage foundation + upload endpoints; configure `SUPABASE_URL` + service role in prod ([SUPABASE_STORAGE.md](./SUPABASE_STORAGE.md))
- [ ] **Public/Admin Artists API** — selector артиста в drawer
- [x] Rounds drawer professional create/edit (`/admin/rounds` — sections, checklist, preview, validation)
- [x] Track & Round Analytics dashboard (`/admin/analytics/tracks`) — live API + mock mode
- [ ] Track analytics advanced filters (release/round status, progress range) — backend query + UI
- [x] Secondary market analytics dashboard (`/admin/analytics/market`) — live API + mock mode
- [ ] Market analytics advanced filters (listing/trade status, price range) — backend query + UI
- [x] Revenue distribution analytics dashboard (`/admin/analytics/revenue`) — live API + mock mode
- [ ] Revenue analytics advanced filters (source, distribution status) — backend query + UI

- [ ] Playwright UI role matrix (plan: [PLAYWRIGHT_ROLE_MATRIX.md](../testing/PLAYWRIGHT_ROLE_MATRIX.md))
- [x] Report storage foundation (`ReportStorageService`, `report_jobs` columns) — [REPORT_WORKER_AND_STORAGE.md](REPORT_WORKER_AND_STORAGE.md)
- [ ] Report worker + Supabase `reports` bucket (`REPORT_STORAGE_MODE=supabase`) — see [SUPABASE_STORAGE.md](./SUPABASE_STORAGE.md)
- [x] DB CHECK constraints phase 1 (after prechecks) — `20260531330000`
- [x] DB CHECK constraints phase 2 (listings, trades, payouts, fees) — `20260602120000`
- [x] DB indexes + payout UNIQUE + positions FK RESTRICT — `20260602120100`
- [x] UNIQUE `earning_distributions.earning_period_id`
- [x] `npm run db:constraint-prechecks` script (exits 1 on violations)
- [ ] Idempotent financial mutations
- [ ] Rate limits on admin mutations
- [ ] IP allowlist optional for staff (enterprise)

## Wallet / ledger

- [x] Double-entry ledger in DB (`ledger_postings`, migration `20260603120000_ledger_double_entry_foundation`)
- [x] Reconciliation admin API + dry-run (`WalletReconciliationService`, e2e `ledger-reconciliation.e2e-spec.ts`)
- [x] Balance cache only via `WalletLedgerService` (no direct `wallet_balances` updates in app code)

## Compliance

- [ ] AML rules engine hook
- [ ] Withdrawal hold workflow with SLA

## CI

- [ ] `pnpm run build` on PR
- [x] Backend e2e: `admin-access`, `admin-analytics-access`, `withdrawal-ledger`
- [ ] Stabilize e2e against shared Supabase (register 500 flakes under load)

## Prisma (Windows)

- [x] [PRISMA_WINDOWS_EPERM.md](PRISMA_WINDOWS_EPERM.md) + `scripts/check-backend-for-prisma.mjs`
- [x] Analytics indexes migration `20260531210000_analytics_indexes`
- [x] General analytics dashboard UX (`/admin/analytics`) — executive overview, insights, drill-downs
- [x] User analytics dashboard UX (`/admin/analytics/users`) — funnel, segments, dormant, risk users
- [x] Risk analytics dashboard UX (`/admin/analytics/risk`) — Risk Intelligence: queue, rules, SLA, repeat offenders, freeze impact, resolution quality
- [x] Operations analytics dashboard UX (`/admin/analytics/operations`) — Operations Intelligence: queue, SLA, finance tickets, escalations, workload, pain points
