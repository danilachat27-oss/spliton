# Revenue Distribution Flow

## Data model (existing)

- `EarningPeriod` — period per release (maps to “revenue event”)
- `EarningReport` — gross/net revenue + source
- `EarningDistribution` — snapshot for a run
- `Payout` — per-holder allocation
- `WalletTransaction` type `PAYOUT` — ledger credit

## API

| Endpoint | Action |
|----------|--------|
| `GET/POST /api/admin/v1/revenue-events` | List / create period + report |
| `GET /api/admin/v1/revenue-events/:id` | Detail |
| `POST /api/admin/v1/distributions/preview` | Holder split preview (no writes) |
| `POST /api/admin/v1/distributions/run` | Transactional payout + ledger |

## Split defaults (configurable later)

- Holders: 70%
- Platform: 15%
- Artist: 15% (tracked in preview; platform fee aggregation via `fees` table)

## Guards

- Cannot run distribution twice for same `earningPeriodId`
- Requires `SUPER_ADMIN` / `ADMIN` / `ACCOUNTANT`
- Each holder payout: `creditAvailable` + `PAYOUT` wallet tx + `Payout` row in one DB transaction

## Frontend

- `/admin/revenue` — mock/live via `adminRevenue.service.ts`
- `/admin/analytics/revenue` — Revenue Distribution Intelligence (analytics API). See [ANALYTICS_DASHBOARDS.md](../analytics/ANALYTICS_DASHBOARDS.md).
- Preview/run hooks ready; UI drawer can be extended next iteration
