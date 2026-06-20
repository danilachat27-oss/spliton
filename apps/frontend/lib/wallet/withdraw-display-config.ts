/**
 * Withdraw UI display defaults until backend exposes dedicated public config.
 *
 * Live fee + min amount: `/api/v1/portfolio/payouts/overview` (`fetchPayoutsOverview`).
 * Processing SLA is not returned by API — use `processingTimeHintKey` (i18n) as a non-binding estimate.
 */
export const WITHDRAW_DISPLAY_DEFAULTS = {
  network: "TRC20",
  /** i18n key — indicative processing window, not an SLA guarantee */
  processingTimeHintKey: "withdraw.meta.processingTimeValue",
  /** Fallback when payouts overview is unavailable (env mirrors backend default) */
  fallbackNetworkFeeUsdt: "5",
} as const;
