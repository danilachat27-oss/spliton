# Admin Wallets Flow

Operator portal section **`/admin/wallets`** — контроль пользовательских балансов и ledger.

## API (`/api/admin/v1`)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/wallets/summary` | KPI: balances, pending, risk, anomalies |
| GET | `/wallets` | Пагинированный список с фильтрами |
| GET | `/wallets/:id` | Деталь; `?include=transactions,deposits,withdrawals,market,risk,audit` |
| GET | `/wallets/:id/transactions` | Ledger paginated |
| GET | `/users/:id/wallet` | Кошелёк пользователя |
| GET | `/users/:id/wallet/transactions` | Ledger пользователя |

### Query (list)

- `search` — email, user id, wallet id
- `asset`, `network` — USDT / TRC20
- `userStatus` — active, blocked, staff, risk
- `walletFilter` — locked, pending_withdrawal, pending_deposit, risk, recent_activity
- `minAvailable` / `maxAvailable`, `minLocked` / `maxLocked`
- `dateFrom` / `dateTo`, `sortBy` — available, locked, updatedAt

## Frontend

- `features/admin/sections/wallets-section.tsx` — KPI, filters, table, analytics link
- `features/admin/components/admin-wallet-drawer.tsx` — tabs: overview, ledger, deposits, withdrawals, market, risk, audit
- Mock: `features/admin/mocks/admin-wallets.mock.ts` (spliton.demo emails)

## RBAC

| Role | Access |
|------|--------|
| SUPER_ADMIN | full read |
| ACCOUNTANT | wallets + ledger + deposits/withdrawals |
| SUPPORT_MANAGER | limited read |
| COMPLIANCE | risk tab + audit (if permitted) |
| BUSINESS_ANALYST | read-only aggregates |
| CONTENT_MANAGER | typically none / limited |

No manual balance mutation in this phase.

## Related

- [WALLET_LEDGER.md](../finance/WALLET_LEDGER.md)
- [WITHDRAWALS_AND_DEPOSITS.md](../finance/WITHDRAWALS_AND_DEPOSITS.md)

## Tests

- `apps/backend/test/admin-wallets.e2e-spec.ts`

## TODO

- Server-side sort by earned / withdrawn totals
- Ledger filters in drawer UI (type, date range)
- min/max locked filters on frontend
