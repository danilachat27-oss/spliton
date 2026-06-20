# Withdrawal approvals (Spliton)

## Tiers (configurable in `treasury_operational_limits`)

| Amount | Required roles |
|--------|----------------|
| &lt; medium | ACCOUNTANT |
| ≥ medium | ACCOUNTANT + COMPLIANCE |
| ≥ large | + SUPER_ADMIN |
| Risk flag | + COMPLIANCE |

## API

- Approve: `POST /api/admin/v1/withdrawals/:id/approve` — records role approval; status → APPROVED only when all roles satisfied.
- Detail: `GET /api/admin/v1/withdrawals/:id?include=approvals`
- Complete: requires approvals + provider tx hash **or** `manualOverride` + `manualCompleteReason` (SUPER_ADMIN).

## Audit

Each approval and complete logged in `audit_logs`. Duplicate same-role approval blocked.
