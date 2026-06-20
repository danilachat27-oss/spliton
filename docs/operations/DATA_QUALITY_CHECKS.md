# Data quality checks

`DataQualityService.runChecks()` — on-demand via admin safety API.

## Checks

| Code | Severity | Description |
|------|----------|-------------|
| WALLET_NEGATIVE_BALANCE | critical | available/locked/pending &lt; 0 |
| WITHDRAWAL_STUCK | warning | PROCESSING/LOCKED &gt; 1h |
| DOCUMENT_EXPIRED_NOT_MARKED | warning | past expiry still COMPLETED |
| REPORT_FAILED_NO_MESSAGE | warning | FAILED jobs without error |
| LISTING_UNITS_EXCEED_POSITION | critical | active listing &gt; seller units |
| LEDGER_RECON_DISCREPANCY | critical | latest recon run has deltas |

Schedule: call from cron or before production deploy; integrate with alerting when `passed=false`.
