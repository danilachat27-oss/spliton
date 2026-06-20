# Data export & deactivation (foundation)

## Planned flow

1. User requests export (`POST /api/v1/privacy/export-request`) — *not yet exposed*
2. Admin reviews in compliance workspace
3. Generated ZIP/JSON stored in private bucket, owner download + audit
4. Account deactivation: `User.status=DEACTIVATED`, sessions revoked; **financial history retained**

## Principles

- No hard-delete of ledger-linked records
- Export excludes other users' PII
- 30-day export link expiry

Implement fully when legal review completes; until then use admin user freeze + manual export via reports.
