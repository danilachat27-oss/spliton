# Production rollout playbook

> Строже staging. **Не выполнять distribution run / mass backfill / withdrawal complete без явного approval.**

Предусловие: [STAGING_EXECUTION_REPORT_TEMPLATE.md](../staging/STAGING_EXECUTION_REPORT_TEMPLATE.md) заполнен, staging **accepted**.

---

## 1. Production preconditions

| # | Requirement | Evidence |
|---|-------------|----------|
| 1 | Staging manual QA signed off | Execution report §8 |
| 2 | Backend financial e2e accepted | Isolated `TEST_DATABASE_URL` green или documented waiver |
| 3 | Migrations applied on staging | Staging report §3 |
| 4 | Backfill rehearsed on staging | Staging report §4 |
| 5 | No open P0/P1 financial bugs | Issue tracker |
| 6 | Production env verified | [STAGING_ENV.md](../staging/STAGING_ENV.md) parity checklist |
| 7 | **DB backup completed** | Snapshot ID + timestamp |
| 8 | Rollback owner assigned | On-call / DBA |

---

## 2. Backup before migration

### Обязательно

- Full DB snapshot (Supabase backup / `pg_dump`) **до** `migrate deploy`.
- Зафиксировать snapshot ID и время в execution/go-no-go doc.

### Critical tables (verify backup includes)

| Table | Why |
|-------|-----|
| `ownership_ledger` | Payout cutoff input + backfill rollback |
| `earning_period_holder_snapshots` | Frozen holders |
| `earning_distributions` | Distribution runs |
| `payouts` | User money |
| `wallet_transactions` | Ledger source |
| `ledger_postings` | Double-entry |
| `user_positions` | Holdings |
| `market_listings` | Secondary locks |
| `trades` | Secondary settlement |

---

## 3. Production migration

```bash
# DATABASE_URL + DIRECT_URL = PRODUCTION (verify URL twice)
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
```

Expected migrations (financial fixes):

- `20260605140000_earning_period_holder_snapshots`
- `20260605150000_ownership_ledger_legacy_backfill_enum`
- `20260605160000_ownership_ledger_backfill_batch_id`

**Не** запускать `prisma migrate reset` на production.

---

## 4. Production backfill

### Обязательный порядок

```bash
npm run finance:ownership-ledger:backfill -- --dry-run
```

Human review:

- Сколько real users/releases (не `@example.com`)?
- Совпадает ли с ожиданием finance team?
- Есть ли approved periods без snapshots?

Только после **written approval**:

```bash
npm run finance:ownership-ledger:backfill -- --apply
# optional: --batch-id=<pre-agreed-uuid>

npm run finance:ownership-ledger:backfill -- --dry-run
```

Второй dry-run: **0 missing** (или documented exceptions).

**Сохранить `batchId`** из apply output.

---

## 5. Production smoke (read-only / validation only)

| Area | Check | Must not |
|------|-------|----------|
| Auth | Login/logout, cookie secure | — |
| Catalog | Live releases load | — |
| Buy | Login gate, preview only unless approved test purchase | Auto-buy |
| Wallet read | Balance, activity | — |
| Withdraw | TRC20/min validation, compliance `4xx` | Submit real large withdrawal without approval |
| Secondary | Listings, depth | Auto-trade |
| Payout history | User sees backend payouts | — |
| Market overview | Live KPI, price history or empty | Demo `184 200` |
| Support | Email-only / ticket form | Fake operator chat |

---

## 6. Do-not-run automatically

Без explicit production approval + second person review:

| Action | Risk |
|--------|------|
| `POST /distributions/run` | Real money payouts |
| Admin withdrawal **complete** | Blockchain debit |
| Destructive SQL rollback | Data loss |
| `DELETE FROM ownership_ledger` (wide) | Payout corruption |
| `prisma migrate reset` | Total wipe |
| Mass `--apply` backfill without dry-run review | Wrong holders |

---

## 7. Go/no-go checklist

| Item | Pass/Fail | Evidence | Approver |
|------|-----------|----------|----------|
| Staging signed off | | Link to staging report | |
| DB backup | | Snapshot ID | DBA |
| `migrate deploy` prod | | CLI output | Backend |
| Backfill dry-run prod | | Row counts | Finance |
| Backfill apply (if needed) | | batchId | Finance |
| Backfill dry-run after | | 0 missing | Finance |
| Frontend build prod | | CI artifact | Frontend |
| Smoke tests | | Checklist | QA |
| Cookies/CORS prod | | Manual auth test | Backend |
| P0/P1 open issues | | Issue list | Eng lead |
| **Production go** | | | Product + Eng |

---

## Rollback (production)

1. **App rollback:** redeploy previous backend/frontend artifact (migrations are forward-only).
2. **Backfill rollback:** by `backfill_batch_id` only (see staging playbook §7).
3. **Distribution:** if run by mistake — freeze further runs; incident process; **не** auto-reverse payouts without finance/legal.

---

## Related

- [STAGING_ROLLOUT_PLAYBOOK.md](../staging/STAGING_ROLLOUT_PLAYBOOK.md)
- [OWNERSHIP_LEDGER_BACKFILL_PLAN.md](../finance/OWNERSHIP_LEDGER_BACKFILL_PLAN.md)
- [BACKEND_E2E_TEST_DB.md](../testing/BACKEND_E2E_TEST_DB.md)
