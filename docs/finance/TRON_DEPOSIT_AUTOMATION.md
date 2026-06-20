# TRON/USDT deposit automation

## Overview

Spliton now supports automatic USDT/TRC20 deposit ingestion through `DepositIngestionModule`.
Manual admin reconcile remains available as a fallback path.

## Provider architecture

- `DepositBlockchainProvider` interface
- `TronDepositProvider` for live polling
- `MockDepositProvider` for e2e/tests
- Health endpoint: `GET /api/admin/v1/deposit-ingestion/health`

## Watcher state

Stored in `deposit_watcher_states`:

- `network`
- `asset_code`
- `last_scanned_block`
- `last_run_at`
- `status`
- `last_error`

## Deposit lifecycle

- `DETECTED`
- `PENDING_CONFIRMATIONS`
- `CONFIRMED`
- `CREDITED`
- `IGNORED`
- `FAILED`

## Safety rules

- Duplicate tx hash is idempotent and credited only once.
- Wrong address/token/network is ignored and logged in `deposit_ingestion_logs`.
- Pending confirmations never credit balance.
- Wallet credit always goes through `WalletLedgerService` (`DEPOSIT_SETTLE` postings).
- Auto actions are written to `audit_logs` with `source=auto`.

## Env

- `DEPOSIT_INGESTION_ENABLED`
- `TRON_PROVIDER_MODE` (`mock|tron`)
- `TRON_PROVIDER_URL`
- `TRON_API_KEY`
- `TRON_CONFIRMATIONS`
- `TRON_POLL_INTERVAL`
- `TRON_USDT_CONTRACT`
