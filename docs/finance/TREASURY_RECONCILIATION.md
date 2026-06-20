# Treasury reconciliation (Spliton)

## Run

`POST /api/admin/v1/treasury/reconciliation/run?dryRun=true` — compare:

- Computed user liabilities (wallet balances)
- Platform fee ledger postings
- Pending withdrawals / deposits
- vs `treasury_accounts.balance_observed` (manual entry)

## Discrepancies

Stored in `treasury_reconciliation_items` with severity. Resolve:

`POST /api/admin/v1/treasury/reconciliation/discrepancies/:id/resolve`

## Observed balance

`PATCH /api/admin/v1/treasury/accounts/:id/observed-balance` — audited manual entry when provider API unavailable.
