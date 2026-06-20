# Referral rewards & ledger

Referral payouts credit the referrer wallet through `WalletLedgerService`, not direct balance updates.

## Flow

1. `ReferralEventsService` hooks (email verified, first deposit, primary purchase, secondary fee).
2. `ReferralRewardsService.processEvent` creates `referral_rewards` row.
3. Amounts ≤ 25 USDT auto-approve and `payReward` runs immediately.
4. Larger amounts → `QUALIFIED` or `HELD_FOR_REVIEW` (compliance).
5. Admin `POST /api/admin/v1/referrals/rewards/:id/approve` → ledger credit + `PAID`.

## Ledger

- Operation: `LedgerOperationType.REFERRAL_REWARD`
- Wallet tx: `ADMIN_ADJUSTMENT` IN, reference `referral_reward`
- Idempotency: `referral-reward-pay:{id}`

## Partner override

Approved partners with `commissionPercent` override `%` rules on secondary trade fees.

## Audit

- `referral.reward.approve` / `referral.reward.reject`
- Partner review: `partner.approve` / `partner.reject` / `partner.suspend`

See also [REFERRAL_PROGRAM.md](../product/REFERRAL_PROGRAM.md).
