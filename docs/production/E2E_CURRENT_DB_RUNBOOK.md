# E2E on Current DB — Runbook

Spliton e2e runs against the **main Supabase DATABASE_URL** when explicitly allowed.

## Run full suite

```powershell
cd apps/backend
$env:ALLOW_E2E_ON_DATABASE_URL="1"
npm run test:e2e
```

## Safety rules

- **No** `reset`, `drop`, `truncate`, mass delete
- Test users: email suffix `@example.com` only
- Teardown: `jest-e2e.global-teardown.ts` → `cleanupE2eUsers()`
- Help center FK fix: deletes `help_articles` where `author_user_id` in test users before user delete

## Teardown order (test users only)

1. Financial deps (orders, trades, wallets, ledger)
2. Support, disputes, news
3. **help_articles** (author FK)
4. users where email ends with `@example.com`

## Skip cleanup (debug)

```powershell
$env:E2E_SKIP_GLOBAL_CLEANUP="1"
```

## Subset smoke

```powershell
npx jest --config ./test/jest-e2e.json --runInBand --testPathPatterns="admin-access|admin-rbac-hardening|ledger-reconciliation"
```

## Expected duration

~4–15 min per suite on shared Supabase; full 58 suites ~30–90 min.

## If teardown warns

```
help_articles_author_user_id_fkey
```

Ensure `delete-e2e-users-cascade.ts` includes `helpArticle.deleteMany` before `user.deleteMany`.
