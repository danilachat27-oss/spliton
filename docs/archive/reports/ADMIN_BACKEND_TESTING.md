# Admin Backend Testing

## Automated

| File | Covers |
|------|--------|
| `test/admin-access.e2e-spec.ts` | 401 unauthenticated, 403 holder, staff access, ACCOUNTANT vs SUPER_ADMIN fees, CONTENT_MANAGER blocked, COMPLIANCE listings |
| `test/withdrawal-ledger.e2e-spec.ts` | User create lock, admin approve/complete/reject, ledger balances, invalid TRC20, insufficient balance, double-complete 409 |

Run (requires `DATABASE_URL`):

```powershell
cd apps/backend
npm run test:e2e -- test/admin-access.e2e-spec.ts test/withdrawal-ledger.e2e-spec.ts
```

## Recommended next tests

- Deposit: reconcile credits available
- Distribution: double-run returns 409
- Report job failure path
- Holdings pagination filters

## Manual

See `ADMIN_E2E_TEST_PLAN.md` for operator portal UI role matrix (Playwright not in repo).
