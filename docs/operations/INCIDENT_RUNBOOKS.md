# Spliton — Incident Runbooks

> **Launch status:** [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md) (2026-06-03: staging **NO-GO**)

Операторская документация для staging/production. Публичный бренд — **Spliton**.

## Быстрые ссылки

| Endpoint | Назначение |
|----------|------------|
| `GET /health/live` | Liveness (процесс жив) |
| `GET /health/ready` | Readiness (DB, env) — 503 блокирует трафик |
| `GET /health/deep` | Deep health (нужен `X-Health-Token` если задан `HEALTH_DEEP_TOKEN`) |
| `GET /api/admin/v1/operations/status` | Workers + finance signals (RBAC) |
| `GET /api/admin/v1/alerts` | Production alerts |

Env: `ERROR_TRACKING_PROVIDER`, `SENTRY_DSN`, `HEALTH_DEEP_TOKEN`, `LOG_LEVEL`.

---

## 1. Deposit ingestion down

**Symptoms:** `DEPOSIT_INGESTION_TICK_FAILED` alert; `depositIngestion.providerOk=false`; pending deposits растут.

**Severity:** CRITICAL

**Confirm:** `GET /api/admin/v1/operations/status` → `depositIngestion`; admin deposit ingestion health.

**First actions:**
1. Проверить `TRON_PROVIDER_MODE`, `TRON_PROVIDER_URL`, `TRON_API_KEY`.
2. Проверить логи worker (`deposit_ingestion.tick_failed`).
3. Acknowledge alert в admin.

**Do NOT:** вручную credit deposits без подтверждённого tx hash.

**Retry:** восстановить TRON provider → worker сам продолжит poll.

**Approve:** SUPER_ADMIN / COMPLIANCE для manual reconcile.

**Users:** public incident только «Задержки зачисления депозитов».

---

## 2. Duplicate tx hash alert

**Symptoms:** `duplicate tx hash` в deposit logs; compliance flag.

**Severity:** WARNING → CRITICAL если повторяется.

**Confirm:** audit + `deposit_ingestion_logs` по tx hash.

**First actions:** freeze manual review; не duplicate-credit.

**Do NOT:** delete audit rows.

---

## 3. Wallet reconciliation discrepancy

**Symptoms:** `WALLET_RECONCILIATION_DISCREPANCY` alert; `discrepancyCount > 0`.

**Severity:** CRITICAL

**Confirm:** latest run в admin ledger reconciliation; export CSV.

**First actions:** dry-run reconcile; sample wallets; escalate ACCOUNTANT.

**Do NOT:** direct balance UPDATE в БД.

**Approve:** SUPER_ADMIN + ACCOUNTANT для corrective ledger posting.

---

## 4. Withdrawal stuck PROCESSING

**Symptoms:** `stuckWithdrawals > 0` в operations status; withdrawal `updatedAt` > 1h.

**Severity:** CRITICAL

**Confirm:** admin withdrawals list filter PROCESSING/LOCKED.

**First actions:** проверить settlement worker logs; compliance hold.

**Do NOT:** mark COMPLETED без chain confirmation.

---

## 5. Report worker stuck

**Symptoms:** `REPORT_JOB_STUCK` / `stuckProcessing > 0`.

**Severity:** CRITICAL

**Confirm:** `GET /api/admin/v1/reports/worker/status`; stuck RUNNING jobs.

**First actions:** retry job в admin; проверить `REPORT_STORAGE_*`.

**Retry:** worker auto-recover QUEUED; manual retry для FAILED.

---

## 6. Revenue distribution mismatch

**Symptoms:** distribution preview ≠ run; finance alert.

**Confirm:** admin revenue distribution preview vs ledger postings.

**Do NOT:** re-run distribution без dry-run preview.

---

## 7. Secondary trade settlement failure

**Symptoms:** trade FAILED after debit; market alert.

**Confirm:** admin trade detail + wallet transactions.

**First actions:** compliance review; не duplicate settlement.

---

## 8. Primary oversell blocked

**Symptoms:** order rejected oversell; audit `primary.oversell_blocked`.

**Severity:** WARNING

**Confirm:** round remaining shares vs order qty.

**Action:** expected guard — verify round config, no manual override.

---

## 9. DB migration failed

**Symptoms:** readiness fail; deploy rollback; `_prisma_migrations` incomplete.

**Confirm:** `npx prisma migrate status` на staging.

**First actions:** restore snapshot; fix migration SQL; re-deploy with `migrate deploy`.

**Do NOT:** `migrate reset` на production.

---

## 10. Postmark / email down

**Symptoms:** readiness fail в production (`email_provider`); auth emails не уходят.

**Confirm:** `EMAIL_PROVIDER=postmark`, token valid.

**Users:** status page «Проблемы с email-уведомлениями».

---

## 11. TRON provider down

**Symptoms:** `providerOk=false`; deposit watcher ERROR.

**Confirm:** provider health endpoint; external TRON API status.

**Retry:** fix credentials/network; ingestion resumes on next tick.

---

## 12. High failed login / password reset spike

**Symptoms:** SECURITY alerts; rate limit logs.

**Confirm:** audit auth failures; IP patterns.

**First actions:** WAF/rate limits; не disable 2FA globally.

---

## 13. Admin role mutation incident

**Symptoms:** audit `role.assign` / SUPER_ADMIN action; SECURITY alert.

**Confirm:** admin audit logs + role matrix.

**First actions:** verify actor; revoke if unauthorized.

---

## 14. Public system status incident update

**Who:** SUPER_ADMIN, NEWS_MANAGER (public updates only).

**Flow:** Admin → System Status → create incident → publish sanitized update (no finance/PII).

**Lifecycle:** INVESTIGATING → IDENTIFIED → MONITORING → RESOLVED.

**Postmortem:** link alerts, timeline, root cause, prevention.

---

## 15. Treasury reconciliation mismatch

**Symptoms:** `treasury.hot_wallet.low` / open items in `treasury_reconciliation_items`.

**Confirm:** `GET /api/admin/v1/treasury/console`; dry-run reconcile.

**First actions:** enter observed hot wallet balance; investigate delta; do not manual-adjust user wallets.

**Approve:** SUPER_ADMIN + ACCOUNTANT to resolve discrepancy with reason.

---

## 16. Emergency pause / kill switch

**Symptoms:** users see FEATURE_DISABLED; `featureFlags` in safety console.

**Confirm:** env `KILL_SWITCH_*` / `FEATURE_MAINTENANCE_MODE`.

**First actions:** [EMERGENCY_PAUSE_RUNBOOK.md](./EMERGENCY_PAUSE_RUNBOOK.md); document in audit; comms via system status.

**Do NOT:** disable audit logging.

---

## Postmortem checklist

- [ ] Alerts acknowledged/resolved
- [ ] Audit trail complete
- [ ] No secrets/PII in logs shared externally
- [ ] Runbook updated if gap found
- [ ] Staging replay test
