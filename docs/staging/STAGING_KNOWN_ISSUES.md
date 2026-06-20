# Staging known issues

> Зафиксировано перед staging rollout. Backend e2e financial subset: **50/58** (8 failures).  
> `wallet-read` + `portfolio`: **5/5** после `registerE2eUser()`.

Не коммитить реальные секреты. Production gate — см. [POST_STAGING_PRODUCTION_BLOCKERS.md](./POST_STAGING_PRODUCTION_BLOCKERS.md).

| Issue | Suite | Symptoms | Risk | Staging decision | Production decision | Owner/fix plan |
| ----- | ----- | -------- | ---- | ---------------- | ------------------- | -------------- |
| Compliance withdraw invalid UUID | `compliance-enforcement` (5 tests) | `POST /api/v1/wallet/withdrawals` → **500**; Prisma: `Error creating UUID, invalid character: found 'w' at 1` в `ledgerPosting.create` | Financial/compliance flow может упасть с 500 вместо контролируемой RU/API ошибки | **Allowed** — known issue; manual QA withdraw validation отдельно | **Must fix** before production | Trace `sourceEntityId` / ledger UUID source в withdraw path; validate DTO/service inputs; return safe RU/API error (4xx) вместо 500; regression test в `compliance-enforcement.e2e-spec.ts` |
| Ledger reconciliation flaky `systemAlert` | `ledger-reconciliation` (1 test) | `systemAlert.create` → `Response from the Engine was empty`; flaky на **shared** dev DB | CI instability; non-deterministic reconciliation alerts | **Allowed** — не блокирует staging deploy | **Dedicated `TEST_DATABASE_URL` required** before release gate | Isolated e2e Supabase project; `test:db:setup` + cleanup между тестами; стабилизировать `SystemAlertService` path или mock в e2e |
| Secondary market depth empty price history | `secondary-market-depth` (1 test) | `GET` price history → `points.length === 0` (ожидалось 2) | Market depth/chart может быть пустым при недостаточном seed | **Allowed** if UI handles empty state correctly | **Seed/data or empty-state test** required before production | Добавить trade/price seed в e2e setup или адаптировать assertion для честного empty history; проверить UI empty state на staging |

## Related

- [STAGING_ENV.md](./STAGING_ENV.md)
- [STAGING_SEED.md](./STAGING_SEED.md)
- [STAGING_MANUAL_QA.md](./STAGING_MANUAL_QA.md)
- [POST_STAGING_PRODUCTION_BLOCKERS.md](./POST_STAGING_PRODUCTION_BLOCKERS.md)
- [../operations/E2E_DATABASE.md](../operations/E2E_DATABASE.md)
