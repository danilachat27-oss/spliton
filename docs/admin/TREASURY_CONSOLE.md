# Treasury admin console (Spliton)

**UI:** `/admin/treasury`  
**API:** `/api/admin/v1/treasury/console`

## RBAC

| Role | Access |
|------|--------|
| SUPER_ADMIN | Full + limits edit |
| ADMIN / ACCOUNTANT | Finance ops, observed balance, reconciliation |
| COMPLIANCE | Read + deposit address rotate |
| BUSINESS_ANALYST | Read aggregate |
| SUPPORT | No treasury |

## Actions

- View hot/cold config, queues, daily outflow
- Run reconciliation (dry-run default) and resolve discrepancies
- Enter observed treasury account balance (audit + reason)
- Edit operational limits (SUPER_ADMIN only)
- View kill switches snapshot (env `KILL_SWITCH_*`)
- Check hot wallet thresholds (creates `SystemAlert` if needed)
- Deposit network settings + address pool (API; pool via POST)
- Rotate deposit address (audit + reason)

## UI panels ( `/admin/treasury` )

| Panel | Capability |
|-------|------------|
| Summary | Hot/cold, queues, ingestion status |
| Safety | Kill switches, hot threshold check |
| Reconciliation | Dry-run / persist, resolve open items |
| Accounts | Observed balance per treasury account |
| Limits | Platform operational limits |
| Network | USDT TRC20 deposit settings |
