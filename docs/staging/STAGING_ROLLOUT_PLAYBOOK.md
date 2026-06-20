# Staging rollout playbook

> Точная последовательность для staging deploy после financial fixes.  
> **Не коммитить секреты.** Примеры доменов — placeholders.

Связанные документы:

- [STAGING_ENV.md](./STAGING_ENV.md) — env checklist
- [STAGING_SEED.md](./STAGING_SEED.md) — QA seed
- [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md) — sign-off
- [OWNERSHIP_LEDGER_BACKFILL_PLAN.md](../finance/OWNERSHIP_LEDGER_BACKFILL_PLAN.md)
- [STAGING_EXECUTION_REPORT_TEMPLATE.md](./STAGING_EXECUTION_REPORT_TEMPLATE.md)

---

## 1. Preconditions

Перед любым deploy проверить:

| Check | Expected |
|-------|----------|
| Staging frontend domain | `https://staging.spliton.example` (или ваш URL) |
| Staging backend domain | `https://api.staging.spliton.example` |
| `DATABASE_URL` | Staging Supabase pooler (`pgbouncer=true`) |
| `DIRECT_URL` / `DIRECT_DATABASE_URL` | Direct host `:5432` (migrations) |
| `NEXT_PUBLIC_*_DATA_SOURCE` | **все `live`** на frontend |
| `NEXT_PUBLIC_APP_ENV` | `staging` |
| `NEXT_PUBLIC_API_BASE_URL` | Staging API URL |
| `FRONTEND_ORIGIN` | Staging frontend URL (CORS) |
| `AUTH_COOKIE_SECURE` | `true` |
| `AUTH_COOKIE_SAME_SITE` | `lax` (или `none` + secure для cross-site) |
| `AUTH_COOKIE_DOMAIN` | Parent domain если API/FE на поддоменах (напр. `.spliton.example`) |
| Frontend `spliton_session` hint | `SameSite=Lax`, `Secure` на HTTPS |
| Backend refresh cookie | См. `docs/backend/auth.md` |
| Secrets | Только в deploy platform / password manager, **не в git/docs** |

```powershell
# Frontend build guard (локально или CI со staging env)
cd apps/frontend
pnpm run validate:env
```

---

## 2. Backend deploy

На машине/CI с **staging** `DATABASE_URL` + `DIRECT_URL`:

```bash
# repo root
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
cd apps/backend && npm run build
cd ../..
npm run prisma:seed:staging-qa
```

### Post-deploy API smoke (curl / browser / Postman)

| Endpoint | Expect |
|----------|--------|
| Health | `200` (если есть `/health` или root) |
| `GET /api/v1/catalog/releases` (public) | `200`, items или `[]` |
| `GET /api/v1/wallet/balance` (auth) | `200` / `401` без token |
| Portfolio / holdings | `200` с QA investor JWT |
| `GET /api/v1/market/listings` | `200` |
| Platform fees (public/admin per route) | `200` |
| Support tickets create (auth) | `201` / controlled `4xx` |

QA user после seed: `staging.qa.investor@spliton.test` — см. [STAGING_SEED.md](./STAGING_SEED.md).

---

## 3. Ownership ledger backfill rehearsal

```bash
# 1. Dry-run (обязательно первым)
npm run finance:ownership-ledger:backfill -- --dry-run

# 2. Staging: исключить e2e мусор, если dry-run показывает @example.com
npm run finance:ownership-ledger:backfill -- --dry-run --exclude-email-pattern=@example.com

# 3. Apply — только после human review dry-run
npm run finance:ownership-ledger:backfill -- --apply --exclude-email-pattern=@example.com

# 4. Повторный dry-run — ожидание 0 missing (или documented no-op)
npm run finance:ownership-ledger:backfill -- --dry-run --exclude-email-pattern=@example.com
```

### Правила

| Rule | Action |
|------|--------|
| Apply только после dry-run | Human sign-off в execution report |
| Dry-run = только `@example.com` | **Не apply** на shared dev; на staging использовать `--exclude-email-pattern=@example.com` |
| Staging apply | Разрешён после подтверждения QA/staff |
| Второй dry-run | `Positions with missing ledger units: 0` |
| Batch marker | Apply печатает `batchId` — сохранить для rollback |
| Rollback | `DELETE ... WHERE event_type = 'LEGACY_POSITION_BACKFILL' AND backfill_batch_id = '<id>'` |

`prisma:seed:staging-qa` с 2026-06-05 пишет `PRIMARY_BUY` для QA holdings — снижает need backfill на staging.

---

## 4. Frontend deploy

```bash
cd apps/frontend
pnpm run typecheck:all
pnpm run test:unit
pnpm run test:unit:i18n
pnpm run build
```

### Verify

- [ ] `NEXT_PUBLIC_APP_ENV=staging` → build **падает** при любом `*_DATA_SOURCE=mock`
- [ ] Live flags активны в runtime env платформы
- [ ] Нет fake purchase / completed withdraw без backend
- [ ] При ошибке API — RU error / empty state, не silent mock (wallet/catalog/secondary)

---

## 5. Playwright smoke

```bash
cd apps/frontend
pnpm run test:e2e:route-guard
pnpm run test:e2e:financial
```

### С staging creds (опционально)

```env
PLAYWRIGHT_BASE_URL=https://staging.spliton.example
PLAYWRIGHT_API_BASE_URL=https://api.staging.spliton.example
PLAYWRIGHT_TEST_USER_EMAIL=staging.qa.investor@spliton.test
PLAYWRIGHT_TEST_USER_PASSWORD=<from password manager>
PLAYWRIGHT_BUY_RELEASE_ID=<from seed output>
PLAYWRIGHT_ENABLE_LIVE_PURCHASE=1   # только controlled staging buy
```

Включает: buy flow, wallet withdraw validation, secondary KPI без `184 200`.

---

## 6. Manual QA sign-off

Чеклист: [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)

**Обязательные разделы после financial fixes:**

- §10 Financial correctness after secondary trade
- §11 Admin cancel secondary listing
- §12 Price history after secondary trade

Заполнить [STAGING_EXECUTION_REPORT_TEMPLATE.md](./STAGING_EXECUTION_REPORT_TEMPLATE.md).

---

## 7. Rollback plan

### Migrate deploy failed

1. Не запускать frontend / не переключать traffic.
2. Прочитать ошибку Prisma (часто `DIRECT_URL` / lock).
3. Исправить env / повторить `migrate deploy`.
4. Если partial migration — consult DBA; **не** `migrate reset` на staging без backup.

### Backfill apply — неверные данные

1. Найти `batchId` из вывода apply.
2. Rollback **только** batch:

```sql
DELETE FROM ownership_ledger
WHERE event_type = 'LEGACY_POSITION_BACKFILL'
  AND backfill_batch_id = '<batch-id-from-apply-output>';
```

3. **Не удалять** `PRIMARY_BUY`, `SECONDARY_*`, `LOCK_FOR_SELL`.
4. Повторить dry-run → исправить seed/positions → apply с новым batch.

### Distribution preview → 0 holders

1. Проверить `ownership_ledger` для release (cutoff events).
2. Запустить backfill или добавить `PRIMARY_BUY` для реальных holders.
3. Re-preview; `NO_ELIGIBLE_HOLDERS` = controlled `400` (не run).
4. Re-approve period (snapshot пересоздаётся на approve).

### Frontend показывает mock в live

1. Проверить `NEXT_PUBLIC_*_DATA_SOURCE=live` на deploy platform.
2. Hard refresh / incognito.
3. Network tab: API URL = staging backend, не localhost.
4. Rebuild с `NEXT_PUBLIC_APP_ENV=staging`.

### Withdraw → 500

1. Проверить backend logs / `requestId`.
2. UUID fix: `ledgerPosting.sourceEntityId` должен быть withdrawal UUID.
3. Compliance → ожидается `403`/`409`, не `500`.
4. Rollback deploy только если regression подтверждён.

---

## Staging go/no-go

| Gate | Owner |
|------|-------|
| Migrations applied | Backend |
| Backfill rehearsed | Finance/Backend |
| Automated checks green | CI |
| Manual QA §10–12 | QA |
| Execution report filed | Release manager |

**Staging accepted** → можно готовить production playbook.
