# Real-money operations (Spliton)

> **GO / NO-GO:** [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md)  
> **Current verdict (2026-06-03):** Real money **NO-GO**.

> Перед первым реальным USDT: пройти [LAUNCH_REHEARSAL_GO_NO_GO.md](./LAUNCH_REHEARSAL_GO_NO_GO.md).

## Pre-flight

- [ ] `TRON_PROVIDER_MODE=tron` only after provider tested on staging/testnet
- [ ] `ALLOW_DEV_DEPOSIT_ADDRESS=false` in production
- [ ] `npm run prisma:generate` in CI/build (API must boot with legal/treasury enums)
- [ ] Migrations deployed: platform engineering, legal compliance, treasury operations
- [ ] Treasury accounts seeded with real **public** addresses (no private keys in app)
- [ ] Operational limits reviewed (`GET /api/admin/v1/treasury/limits`)
- [ ] Withdrawal approval tiers tested (medium/large on staging)
- [ ] Dry-run treasury reconciliation: `POST /api/admin/v1/treasury/reconciliation/run?dryRun=true`
- [ ] Kill switches documented and default off ([EMERGENCY_PAUSE_RUNBOOK.md](./EMERGENCY_PAUSE_RUNBOOK.md))
- [ ] Legal policies **published** (not seed drafts) — lawyer sign-off
- [ ] KYC policy aligned with external provider (if enabled)

## First real transaction procedure

1. **Internal canary user only** — not public marketing until T+24h stable.
2. Deposit ≤ configured `maxAutoCreditDepositUsdt`; larger → manual review.
3. Monitor `deposit_ingestion_logs` + wallet ledger for 30 minutes.
4. Primary purchase small round — verify consents + receipt PDF.
5. Withdrawal ≤ `maxAutoCompleteWithdrawalUsdt` tier rules still apply for approvals.
6. Required approvals: ACCOUNTANT (+ COMPLIANCE if medium/risk; + SUPER_ADMIN if large).
7. Complete **only** with chain tx hash **or** SUPER_ADMIN manual override + audited reason.
8. Run wallet + treasury reconciliation dry-run; zero unexplained CRITICAL discrepancies.
9. Sign-off in audit: actor IDs, tx hashes, reconciliation run ID.

## No-go (hard stop)

- Private keys in repo, frontend, or logs
- Complete withdrawal without tx hash (except audited SUPER_ADMIN override)
- Skip compliance approvals on large withdrawals
- Credit deposit without confirmed tx hash
- `SEED_LEGAL_POLICIES_ON_BOOT` or draft legal text in production
- API boot without current `@prisma/client` (ConsentSource / treasury enums)

## GO criteria summary

| Environment | Requires |
|-------------|----------|
| Staging | generate + migrate + e2e finance subset green + manual money flow table |
| Production | staging GO + prod env + Postmark + storage + monitoring |
| Real money | production GO + lawyer + treasury + TRON ops + first tx procedure |

See also: [TREASURY_OPERATIONS.md](../finance/TREASURY_OPERATIONS.md), [EMERGENCY_PAUSE_RUNBOOK.md](./EMERGENCY_PAUSE_RUNBOOK.md).
