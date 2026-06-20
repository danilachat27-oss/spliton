# Admin Security Notes

## Principles

1. **Backend is source of truth** — `RolesGuard` on every `/api/admin/v1/*` route.
2. **Frontend is UX gate** — hide nav, block actions, Access Denied; never sole protection.
3. **No secrets in frontend** — only public URLs and `mock`/`live` switch.
4. **Separate admin API** — staff financial actions not on user routes.
5. **Audit everything material** — approve/reject withdrawal, role assign, freeze listing.

## Portal entry

- `/admin/login` — staff credentials (same auth stack, extra role check)
- Unauthenticated `/admin/*` → redirect login
- Non-staff JWT → Access Denied + server 403 on `/access`

## Role enforcement

| Layer | Mechanism |
|-------|-----------|
| Menu | `getVisibleAdminNav()` |
| Route | `AdminSectionGuard` |
| Action | `useAdminPermissions().can(area, action)` |
| API | `ADMIN_PANEL_ROLE_CODES` + `RolesGuard` |

## Dangerous actions

Require:

- `AdminConfirmDialog`
- Admin note (withdrawals, compliance)
- Server audit via `AdminAuditService` (users, deposits, withdrawals)

## Withdrawals & deposits (ledger-safe)

- Withdrawals: approve locks funds; complete debits locked; reject unlocks. All in Prisma `$transaction` via `AdminWithdrawalSettlementService`.
- Deposits: reconcile/completed credits available via `AdminDepositSettlementService`.
- See `WALLET_LEDGER_AND_WITHDRAWAL_SETTLEMENT.md`.

## Production / staging

- Different `DATABASE_URL`, `JWT_SECRET`, API URLs per env
- No hardcoded production hosts in repo
- Vercel (frontend) + Hetzner (backend) + Supabase (DB) — see `TODO_PRODUCTION.md`
