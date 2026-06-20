# Referral anti-fraud

## Blocked automatically

- **Self-referral** — `REFERRAL_SELF_ATTEMPT` risk flag + HTTP `REFERRAL_SELF`.
- **Duplicate attribution** — one `referral_attributions` row per referred user.
- **Suspended partner** — no new rewards for referrer.
- **Active fraud flags** on referrer (`REFERRAL_MULTI_ACCOUNT_SUSPECTED`, `PARTNER_FRAUD_SUSPECTED`).
- **High-risk referred user** — reward `HELD_FOR_REVIEW`.

## Policy

- First-touch attribution at registration (or `apply-code` once).
- Cookie `spliton_ref` + `?ref=` on register (30-day window in DB `expiresAt`).
- Rewards deduped by unique index on `(referrer, referred, eventType, sourceEntityId)`.
- First deposit / first primary purchase only (no repeat rewards for same event type).

## Review

Compliance uses admin referrals + user risk flags. Large rewards (> 100 USDT) held automatically.

Admin notification: `referral.reward.held`, `partner.application.new`.
