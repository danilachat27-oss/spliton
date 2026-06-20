# Data retention

Enable scheduled cleanup: `RETENTION_CLEANUP_ENABLED=true`.

## RetentionCleanupService

| Data | Policy |
|------|--------|
| idempotency_records | TTL expiry (purge) |
| generated_documents | mark EXPIRED after `DOCUMENT_TTL_DAYS` |
| password_reset_tokens | PASSWORD_RESET_RETENTION_DAYS (default 7) |
| email_verification_tokens | EMAIL_VERIFY_RETENTION_DAYS (default 7) |

## Never auto-delete

- ledger postings, wallet transactions, trades, orders
- audit_logs, admin_actions
- deposits/withdrawals source rows

Report file blobs: use `REPORT_RETENTION_DAYS` + report worker cleanup (existing).
