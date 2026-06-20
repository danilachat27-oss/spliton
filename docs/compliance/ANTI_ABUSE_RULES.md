# Anti-abuse rules (Spliton)

## Services

| Service | Triggers |
|---------|----------|
| `ComplianceRiskScoringService` | deposits, withdrawals, trade spikes, **MarketAbuse flags** |
| `MarketAbuseService` | self-trade, rapid pair, deposit→trade→withdraw, cancel/relist churn |

## Wiring (post prompt 38)

- After secondary **buy**: `UserMarketService` → `riskScoring.evaluateTrade({ releaseId })` → `MarketAbuseService.evaluateAfterTrade`
- After listing **cancel**: `evaluateListingCancel`

## Risk flag codes

- `wash_trade_suspect`
- `rapid_pair_trading`
- `deposit_trade_withdraw_pattern`
- `rapid_cancel_relist`
- `secondary_spike` (existing)

## Policy

Flags → `risk_flags` + compliance admin queue. **No automatic severe punishment** unless policy configured. Compliance resolves manually.

## Tests

`apps/backend/src/modules/compliance/market-abuse.service.spec.ts`

## P2

Linked-account graph detection, device/IP correlation (requires data foundation).
