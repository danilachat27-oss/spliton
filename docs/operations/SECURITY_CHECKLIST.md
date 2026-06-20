# Security checklist (Spliton)

Pre-production security verification for operator portal, user finance API, and public endpoints.

## RBAC

- [ ] `GET /api/admin/v1/access` returns `sections`, `capabilities`, `readOnly` for each staff role
- [ ] Regular user (`USER`/`INVESTOR`/`ARTIST`) receives **403** on `/api/admin/v1/*`
- [ ] `BUSINESS_ANALYST`: analytics/reports read + export only; **403** on revenue mutate, role assign, fees PATCH
- [ ] `SUPER_ADMIN` only: role assign/remove, platform fees, financial rules PATCH
- [ ] `COMPLIANCE` only (with SUPER): user block via compliance API; freeze operations
- [ ] `NEWS_MANAGER`: news/system-status only; **403** on finance orders (`/api/admin/v1/orders/:id`)
- [ ] Frontend nav uses `admin-role-matrix.ts`; action buttons use `admin-action-permissions.ts` (matrix-backed)
- [ ] Run: `npm run backend:test:e2e -- test/admin-rbac-hardening.e2e-spec.ts test/admin-access.e2e-spec.ts test/admin-role-mutations.e2e-spec.ts`

Source of truth: `apps/backend/src/modules/admin/common/admin-role-matrix.ts` (mirrored in frontend).

## Compliance enforcement

- [ ] Frozen/suspended user: **403** on withdrawal, listing create/cancel, secondary buy, primary purchase
- [ ] Frozen wallet: **403** on withdrawal and listing create
- [ ] Frozen listing: **403** on buy
- [ ] Withdrawal `ON_HOLD`/`REVIEW`: admin complete blocked until compliance clears
- [ ] User-facing errors do not expose internal risk notes (see `COMPLIANCE_USER_ERRORS`)
- [ ] Run: `npm run backend:test:e2e -- test/compliance-enforcement.e2e-spec.ts`

## Audit

- [ ] Financial mutations write `audit_logs` + `admin_actions` (withdrawals, deposits, revenue run, fees, roles)
- [ ] Report generate/download/sensitive_export audited
- [ ] Compliance freeze/block audited
- [ ] No JWT, reset tokens, API keys in audit payloads
- [ ] Review: `docs/database/AUDIT_COVERAGE_REVIEW.md`

## Reports & exports

- [ ] Report list/getById/retry filtered by role-allowed report types
- [ ] Download re-checks role + job type; expired/failed jobs not downloadable
- [ ] `BUSINESS_ANALYST` limited to analytics/finance report whitelist
- [ ] `CONTENT_MANAGER` / `SUPPORT_MANAGER` limited to their whitelists
- [ ] Run: `npm run backend:test:e2e -- test/admin-reports.e2e-spec.ts`

## Rate limits

Global: 120 req/min (`ThrottlerModule`). Per-route:

| Area | Limit |
|------|-------|
| login/register | 5/min |
| forgot/reset password | 3–10/min |
| email verify resend | 3/min |
| withdrawal create | 5/min |
| primary order | 20/min |
| listing create/cancel, trade | 20/min |
| support ticket create | 5/min |
| 2FA | 5–10/min |

E2E uses dedicated test DB; limits should not block normal e2e flows.

## Secrets & env

- [ ] No backend secrets in `NEXT_PUBLIC_*` (see `apps/frontend/lib/public-env.ts`)
- [ ] `JWT_*`, `POSTMARK_*`, `TRON_*`, `SUPABASE_SERVICE_ROLE_KEY` backend-only
- [ ] Production: `validatePublicEnvForBuild()` blocks mock data sources
- [ ] Review: `docs/operations/ENVIRONMENT.md`

## Automated gates

```powershell
npm run ci:backend          # lint + build + unit
npm run test:db:setup       # dedicated TEST_DATABASE_URL
npm run backend:test:e2e -- test/admin-rbac-hardening.e2e-spec.ts test/compliance-enforcement.e2e-spec.ts test/admin-reports.e2e-spec.ts test/withdrawal-ledger.e2e-spec.ts test/password-reset.e2e-spec.ts
```

## Related

- [ADMIN_ROLES_AND_ACCESS.md](../admin/ADMIN_ROLES_AND_ACCESS.md)
- [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [E2E_DATABASE.md](./E2E_DATABASE.md)
