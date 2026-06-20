# Admin Frontend Status

**Updated:** 2026-05-30 (operator portal UX + Russian localization)

## Portal

- Entry: `/admin/login`
- Workspace: `/admin/*`
- Auth: session + `hasAdminAccess` + `GET /admin/access`
- UI language: **Russian** (i18n layer in `features/admin/lib/admin-i18n.ts`)

## Navigation

7 grouped sections in sidebar — see `ADMIN_INFORMATION_ARCHITECTURE.md`

Role-filtered nav via `getVisibleAdminNavGroups()`.

## Pages

| Route | UI | Data |
|-------|-----|------|
| `/admin/login` | ✅ RU | Live auth |
| `/admin` | ✅ Operational center RU | Mock dashboard |
| `/admin/users` | ✅ RU | Live |
| `/admin/tracks` | ✅ RU drawer sections | Mock |
| `/admin/rounds` | ✅ RU | Mock |
| `/admin/wallets` | ✅ RU ledger tabs | Live |
| `/admin/deposits` | ✅ RU confirm | Live |
| `/admin/withdrawals` | ✅ RU confirm | Live |
| `/admin/holdings` | ✅ RU | Live |
| `/admin/revenue` | ✅ RU preview/run | Live |
| `/admin/secondary-market` | ✅ RU tabs | Live |
| `/admin/platform-revenue` | ✅ RU (chart mock) | Partial live |
| `/admin/reports` | ✅ RU CSV | Live jobs |
| `/admin/support` | ✅ RU tabs | Mock |
| `/admin/compliance` | ✅ RU risk center | Mock |
| `/admin/roles` | ✅ RBAC matrix RU | Config + mock users |
| `/admin/settings` | ✅ Tabbed RU | Fees live |
| `/admin/audit-log` | ✅ RU filters | Live |

## Key files (this phase)

- `features/admin/lib/admin-i18n.ts` — labels, statuses, actions
- `features/admin/lib/admin-format.ts` — USDT, dates
- `features/admin/config/admin-sections.ts` — grouped nav + role visibility
- `features/admin/components/admin-sidebar.tsx` — brand + groups
- `features/admin/components/admin-header.tsx` — topbar RU
- `features/admin/sections/*` — all section pages updated

## Build & tests

- `pnpm run build` — ✅
- `test/admin-access.e2e-spec.ts` — ✅ 6 passed

## Next

1. Global admin search API
2. Support / Compliance live backend
3. Track CRUD API + publish flow
4. Dashboard live KPIs
5. Playwright UI tests per role
