# Admin Routes Overview

Operator portal — отдельное пространство от пользовательского кабинета.

## Entry

| Route | Access |
|-------|--------|
| `/admin/login` | Public (staff sign-in) |
| `/admin/*` | Staff roles only |

## Routes

| Path | Section |
|------|---------|
| `/admin` | Dashboard |
| `/admin/users` | Users |
| `/admin/tracks` | Tracks / Releases |
| `/admin/rounds` | Rounds / Deals |
| `/admin/wallets` | Wallets |
| `/admin/deposits` | Deposits |
| `/admin/withdrawals` | Withdrawals |
| `/admin/holdings` | Holdings / Units |
| `/admin/revenue` | Revenue / Payouts |
| `/admin/secondary-market` | Secondary Market |
| `/admin/platform-revenue` | Platform Revenue |
| `/admin/reports` | Reports |
| `/admin/support` | Support |
| `/admin/compliance` | Compliance |
| `/admin/roles` | Roles & Access |
| `/admin/settings` | Settings |
| `/admin/audit-log` | Audit Log |

## Legacy redirects

| Old | New |
|-----|-----|
| `/admin?tab=*` | Section routes (`AdminLegacyRedirect`) |
| `/admin/audit` | `/admin/audit-log` |

## Guards

- `AdminLayoutClient` — session + staff role + `GET /admin/access`
- `AdminSectionGuard` — per-section RBAC nav
- Public `AuthGuard` skips `/admin/*` (portal uses `/admin/login`)
