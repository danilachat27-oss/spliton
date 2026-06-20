# Audit Coverage Review

**Implementation:** `AdminAuditService.logOperatorAction` → `audit_logs` + `admin_actions`  
**User actions:** `wallet-audit.service` / `logUserAction` for user-initiated withdrawal

| Event | Covered | Service / action string |
|-------|---------|-------------------------|
| user.role assign | ✓ | `admin-users.service` — assign role |
| user.role remove | ✓ | `admin-users.service` — remove role |
| user block/unblock | ✓ | `admin-users.service` |
| withdrawal requested | ✓ | `user-withdrawals.service` (USER actor) |
| withdrawal approve/reject/hold/complete | ✓ | `admin-withdrawals` + settlement |
| deposit status/reconcile | ✓ | `admin-deposits.service` |
| platform fee update | ✓ | `admin-platform-revenue.service` — `platform_fees.update` |
| track create/update/publish | ✓ | `admin-tracks.service` |
| round create/update/status | ✓ | `admin-rounds.service` |
| support ticket create/update/assign/note | ✓ | `admin-support.service` |
| compliance risk / freeze | ✓ | `admin-compliance.service` |
| listing freeze/cancel | ✓ | `admin-secondary-market.service` |
| trade mark suspicious | ✓ | `admin-secondary-market.service` |
| revenue event / distribution run | ✓ | `admin-revenue.service` |
| report generate | ✓ | `admin-reports.service` |

## Gaps / improvements

| Gap | Priority | Action |
|-----|----------|--------|
| Failed mutations not always `result: failure` | Low | Pass `result: 'failure'` in catch paths |
| IP/userAgent not always passed from controllers | Low | Thread request metadata into audit calls |
| `AdminAction` duplicates `AuditLog` | Info | Acceptable — different query patterns |
| Platform revenue manual adjustments | ? | Verify if manual fee rows need separate action |

## Query support

Indexes: `audit_logs_entity_*`, `audit_logs_action_created_at` (migration `20260531320000`).
