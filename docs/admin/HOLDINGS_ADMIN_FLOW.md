# Holdings / Units Admin Flow

Operator portal section **`/admin/holdings`** — контроль позиций пользователей (`user_positions`) по релизам.

## Цель

Back-office инструмент для staff-ролей: кто держит UNT, заблокированные юниты, начисления, вторичный рынок, wallet ledger (ограниченно по RBAC).

## API (`/api/admin/v1`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/holdings/summary` | KPI: держатели, юниты, стоимость, начисления, listings, risk |
| GET | `/holdings` | Пагинированный список с фильтрами |
| GET | `/holdings/:id` | Деталь позиции; `?include=history,distributions,market,wallet,risk` |
| GET | `/users/:userId/holdings` | Владения пользователя |
| GET | `/tracks/:trackId/holdings` | Держатели релиза |

### Query (list)

- `search` — email, user id, display name, release title/id
- `holdingFilter` — `locked` | `listing` | `earned` | `risk`
- `releaseStatus` — статус релиза
- `minUnits` / `maxUnits`, `minValue` / `maxValue`
- `dateFrom` / `dateTo` — последняя активность (`updatedAt`)
- `sortBy` — `total_units`, `locked_units`, `last_activity` (earned/value — TODO server-side)

### Lock reason (inferred)

- `active_listing` — активный listing seller
- `pending_trade` — сделка в settlement
- `compliance_freeze` — активный risk flag
- `settlement` — зарезервировано
- `unknown` — fallback

## Frontend

- `features/admin/sections/holdings-section.tsx` — KPI, фильтры, таблица, analytics links
- `features/admin/components/admin-holding-drawer.tsx` — вкладки: обзор, история, начисления, рынок, wallet, risk
- Live: `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` — только данные API; empty state без fake email

## RBAC

| Role | List/summary | Detail tabs | Wallet tab |
|------|--------------|-------------|------------|
| SUPER_ADMIN | ✓ | all | ✓ |
| ACCOUNTANT | ✓ | finance + wallet | ✓ |
| BUSINESS_ANALYST | ✓ | aggregates, no sensitive wallet | ✗ |
| COMPLIANCE | ✓ | risk/freeze | ✗ |
| SUPPORT_MANAGER | ✓ | support context | limited |
| CONTENT_MANAGER | ✓ | by release, read-only | ✗ |

Backend: `assertAdminArea(roles, 'holdings')`; wallet transactions в detail — только SUPER_ADMIN, ADMIN, ACCOUNTANT.

## Related

- [PRIMARY_PURCHASE_FLOW.md](../finance/PRIMARY_PURCHASE_FLOW.md) — первичная покупка → позиция
- [SECONDARY_MARKET.md](../finance/SECONDARY_MARKET.md) — listings/trades → lock
- [ADMIN_LIVE_API_PROGRESS.md](./ADMIN_LIVE_API_PROGRESS.md)

## Tests

- `apps/backend/test/admin-holdings.e2e-spec.ts`

## TODO

- Server-side sort by `earned_total` / `current_value`
- Dedicated analytics aggregates on page (top releases by holders) via API
- Date range filter UI (`dateFrom`/`dateTo`) на frontend
