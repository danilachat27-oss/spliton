# Admin Secondary Market Flow

Spliton Operator Portal — `/admin/secondary-market` (Secondary Market Control Center).

## API (v1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/v1/secondary-market/summary` | KPI: listings, volume, fees, suspicious |
| GET | `/api/admin/v1/secondary-market/liquidity` | Volume by day, listings by release |
| GET | `/api/admin/v1/secondary-market/fees` | Secondary market fee totals and rows |
| GET | `/api/admin/v1/listings` | Paginated listings |
| GET | `/api/admin/v1/listings/:id?include=` | Detail: trades, ledger, risk, audit |
| POST | `/api/admin/v1/listings/:id/freeze` | Freeze (note required) |
| POST | `/api/admin/v1/listings/:id/release` | Unfreeze |
| POST | `/api/admin/v1/listings/:id/cancel` | Cancel (note required) |
| GET | `/api/admin/v1/trades` | Paginated trades |
| GET | `/api/admin/v1/trades/:id?include=` | Detail: settlement, ledger, risk, audit |
| POST | `/api/admin/v1/trades/:id/mark-suspicious` | Mark suspicious (note required) |

## RBAC

- **SUPER_ADMIN / COMPLIANCE**: full (freeze, release, cancel, mark suspicious)
- **ACCOUNTANT / BUSINESS_ANALYST / SUPPORT_MANAGER**: read
- **CONTENT_MANAGER**: read (release context)

## Financial safety (user market)

Listing create locks units; cancel returns units; PAUSED listings cannot be bought; settlement uses `WalletLedgerService` and `PlatformFeeLedgerService` with Prisma transactions (see `user-market.service.ts`).

## Frontend

- Live mode: `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` — no mock `@spliton.demo` rows unless backend returns them
- Mock mode: `admin-secondary-market.mock.ts` only

## Tests

```powershell
npm run test:e2e -- test/admin-secondary-market.e2e-spec.ts
npm run test:e2e -- test/secondary-market.e2e-spec.ts
```
