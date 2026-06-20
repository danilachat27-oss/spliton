# Final production gaps sweep (Spliton) — prompt 38/38

Дата: 2026-06-03 (обновлено после финального sweep)

## Executive summary

**Найдено:** отсутствующий import `UserAccountingModule`, `MarketAbuseService` не был подключён к trade path, operator SLA API не использовался во frontend, `alert()` в secondary/buy flows, trust center без ссылки на disputes, нет user UI для accounting statements, ~43 TS ошибки backend (referrals, treasury Request, announcements, legal audit import).

**Реализовано в этой сессии:**

- Build fixes: `UserAccountingModule`, `LegalAuditService`, admin-release-faq paths, treasury Request type + param order, onboarding/referrals/user-analytics/announcements/market-abuse/primary-order preview
- Anti-abuse wiring: `MarketAbuseService` → `ComplianceRiskScoringService.evaluateTrade` + `evaluateListingCancel`; новые risk rules
- Frontend: убраны все `alert()`, `/dashboard/statements`, trust center links, dashboard nav (disputes/statements/trust), operator SLA block в admin tasks
- Docs: RELEASE_APPROVAL, SLA, PWA, TAX_AND_STATEMENTS + обновлён sweep

**Остаётся (P0/P1):**

- Disk full в CI/sandbox — не удалось прогнать build/tests локально
- Pending Prisma migrations на staging DB
- Admin UI: release approval drawer, dispute detail admin, data room upload UI
- SLA cron `markBreachedTasks`, email notifications
- Playwright mobile smoke
- Юридический review tax disclaimers

## Таблица

| Область | До | После | Ключевые файлы | Миграции | Тесты | Docs | Статус | Риск |
|--------|-----|-------|----------------|----------|-------|------|--------|------|
| Artist portal | API есть, UI минимальный | Без изменений API; nav через admin-managed | `modules/artist/*`, `/dashboard/artist` | `ArtistUserLink` | artist specs (existing) | `ARTIST_PORTAL.md` | Foundation | Seed artist links |
| Data room | Backend + UI component | Без регрессий | `release-data-room/*` | `ReleaseDocument` | data room specs | `RELEASE_DATA_ROOM.md` | Ready foundation | Admin upload UI P1 |
| Disputes | User API + basic page | Без регрессий | `disputes/*`, `/dashboard/disputes` | `Dispute` | dispute specs | `DISPUTE_CENTER.md` | Foundation | Admin queue UI P1 |
| Accounting | API only | User page `/dashboard/statements` | `user-accounting/*`, statements page | — | accounting specs | `TAX_AND_STATEMENTS.md` | Foundation | PDF worker P1 |
| Release approval | Admin API | Unchanged API | `release-approval/*` | `ReleaseApprovalStep` | approval specs | `RELEASE_APPROVAL_WORKFLOW.md` | Backend gate | Admin UI P1 |
| SLA | Service + admin API | Frontend wired to API | `operator-sla/*`, operator-tasks section | `operator_sla_tasks` | SLA specs | `SLA_AND_OPERATOR_TASKS.md` | Wired | Cron P1 |
| Anti-abuse | Service isolated | Wired post-trade + cancel | `market-abuse.service.ts`, risk scoring | — | `market-abuse.service.spec.ts` | `ANTI_ABUSE_RULES.md` | Wired | Linked accounts P2 |
| Mobile/PWA | manifest exists | Nav + trust links | `manifest.json` | — | build smoke | `PWA_AND_MOBILE_POLISH.md` | Partial | Full SW NO |
| Trust center | support only link | support + disputes | `/trust` | — | — | `TRUST_CENTER.md` | Improved | — |
| Grep sweep | alert() present | alert() removed | `check-production-gaps.mjs` | — | script | this doc | Improved | Run in CI |
| Build | 43 TS errors | Fixes applied, unverified | many | — | — | checklists | **Unverified** | Disk full blocked verify |

## Команды проверки

```powershell
npm run prisma:generate
npm run prisma:migrate:deploy
npm run ci:backend
npm run ci:frontend
cd apps/backend && npm test -- src/modules/compliance/market-abuse.service.spec.ts
node scripts/check-production-gaps.mjs
```

## Final verdict (5 вопросов)

1. **Staging mature SaaS/exchange-level?** — **Partially.** Foundations закрыты; green build + migrations + e2e money flow ещё нужны.
2. **Production blockers:** pending migrations, backend/frontend green build, treasury real provider, legal sign-off.
3. **Real-money blockers:** всё из production + reconciliation rehearsal + KYC provider live + TRON production keys.
4. **Manual checks:** money flow 33 steps, RBAC matrix, dispute/SLA ops runbooks, tax disclaimer lawyer review.
5. **After launch:** SLA automation, admin dispute/approval UI polish, KA i18n review, anti-abuse tuning, mobile Playwright.
