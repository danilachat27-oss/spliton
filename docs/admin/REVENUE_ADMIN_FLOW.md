# Admin Revenue Distribution Flow

Spliton Operator Portal — `/admin/revenue` (Доходы и начисления).

## Business model

- **Покупка юнитов** — order, списание баланса, holding, комиссия платформы.
- **Начисления** — отдельный процесс после фактического дохода релиза (стриминг, дистрибьютор, лицензия, ручной event, импорт).

## Operator flow

1. `POST /api/admin/v1/revenue-events` — создать revenue event (черновик `OPEN`).
2. `POST /api/admin/v1/distributions/preview` — расчёт split 70/15/15 и таблица держателей.
3. `POST /api/admin/v1/distributions/preview/save` — сохранить preview (`CALCULATED`).
4. `POST /api/admin/v1/distributions/run` — wallet ledger payout credits (`DISTRIBUTED`).

## API

| Method | Path | Roles |
|--------|------|-------|
| GET | `/api/admin/v1/revenue-events/summary` | Staff panel |
| GET | `/api/admin/v1/revenue-events` | Staff panel |
| POST | `/api/admin/v1/revenue-events` | SUPER_ADMIN, ADMIN, ACCOUNTANT |
| GET | `/api/admin/v1/revenue-events/:id?include=preview,payouts,ledger,audit` | Staff panel |
| POST | `/api/admin/v1/distributions/preview` | Staff panel (view) |
| POST | `/api/admin/v1/distributions/preview/save` | SUPER_ADMIN, ADMIN, ACCOUNTANT |
| POST | `/api/admin/v1/distributions/run` | SUPER_ADMIN, ADMIN, ACCOUNTANT |

## Financial safety

- `grossRevenue > 0`
- Release exists
- Duplicate period guard (`DUPLICATE_PERIOD`)
- No double run (`ALREADY_DISTRIBUTED`)
- Holders / sold units required (`NO_ELIGIBLE_HOLDERS`)
- Wallet credits only via `WalletLedgerService`
- Audit: `revenue_event.create`, `distribution.run`

## Frontend

- KPI cards from summary endpoint
- Filters: search, status, source, period, amount, quick filters
- Tabbed detail drawer: overview, preview, payouts, ledger, errors, audit
- Create flow: release → income → preview → confirm run
- Live mode: empty state «Доходы релизов ещё не добавлены» (no mock rows)

## RBAC

| Role | Access |
|------|--------|
| SUPER_ADMIN / ACCOUNTANT | Full mutate |
| BUSINESS_ANALYST | Read-only (global hook) |
| CONTENT_MANAGER / COMPLIANCE / SUPPORT_MANAGER | Read-only matrix |

Mock data uses `@spliton.demo` emails only.
