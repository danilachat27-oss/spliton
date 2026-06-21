import type { AppLocale } from "./types";
import { DICTIONARIES } from "./dictionaries";
import { emptyValueLabel } from "../analytics/display-value";

const WITHDRAWAL_STATUS: Record<string, string> = {
  pending: "status.withdrawal.pending",
  requested: "status.withdrawal.pending",
  approved: "status.withdrawal.approved",
  on_hold: "status.withdrawal.on_hold",
  completed: "status.withdrawal.completed",
  rejected: "status.withdrawal.rejected",
  failed: "status.withdrawal.failed",
  cancelled: "status.withdrawal.cancelled",
};

const DEPOSIT_STATUS: Record<string, string> = {
  pending: "status.deposit.pending",
  confirming: "status.deposit.confirming",
  credited: "status.deposit.credited",
  failed: "status.deposit.failed",
  manual_review: "status.deposit.manual_review",
};

const LISTING_STATUS: Record<string, string> = {
  active: "status.listing.active",
  filled: "status.listing.filled",
  cancelled: "status.listing.cancelled",
  expired: "status.listing.expired",
};

const RELEASE_STATUS: Record<string, string> = {
  open: "statuses.release.open",
  payouts: "statuses.release.payouts",
  closed: "statuses.release.closed",
  sold_out: "statuses.release.sold_out",
  active: "statuses.release.active",
  draft: "statuses.release.draft",
  published: "statuses.release.published",
  coming_soon: "statuses.release.coming_soon",
};

const ROUND_STATUS: Record<string, string> = {
  live: "statuses.round.live",
  paused: "statuses.round.paused",
  completed: "statuses.round.completed",
  draft: "statuses.round.draft",
  none: "statuses.round.none",
};

const LIQUIDITY_STATUS: Record<string, string> = {
  high: "statuses.liquidity.high",
  medium: "statuses.liquidity.medium",
  med: "statuses.liquidity.medium",
  low: "statuses.liquidity.low",
};

const ORDER_STATUS: Record<string, string> = {
  active: "statuses.order.active",
  partial: "statuses.order.partial",
  filled: "statuses.order.filled",
  cancelled: "statuses.order.cancelled",
  expired: "statuses.order.expired",
  failed: "statuses.order.failed",
  rejected: "statuses.order.rejected",
  limit: "statuses.order.limit",
  market: "statuses.order.market",
};

const TRADE_STATUS: Record<string, string> = {
  settled: "statuses.trade.settled",
  processing: "statuses.trade.processing",
  failed: "statuses.trade.failed",
};

const SIDE_STATUS: Record<string, string> = {
  buy: "secondaryMarket.side.buy",
  sell: "secondaryMarket.side.sell",
};

const DISPUTE_STATUS: Record<string, string> = {
  open: "disputes.status.open",
  in_review: "disputes.status.in_review",
  waiting_for_user: "disputes.status.waiting_for_user",
  waiting_for_admin: "disputes.status.waiting_for_admin",
  escalated: "disputes.status.escalated",
  resolved: "disputes.status.resolved",
  rejected: "disputes.status.rejected",
  closed: "disputes.status.closed",
};

/** Translate enum/status slug for UI — never show raw enum. */
export function statusLabel(
  domain:
    | "withdrawal"
    | "deposit"
    | "listing"
    | "release"
    | "round"
    | "liquidity"
    | "order"
    | "trade"
    | "side"
    | "dispute"
    | "generic",
  value: string | null | undefined,
  locale: AppLocale,
  fallback?: string,
): string {
  if (!value) return fallback ?? emptyValueLabel(locale);
  const normalized = value.toLowerCase();
  const key =
    domain === "withdrawal"
      ? WITHDRAWAL_STATUS[normalized]
      : domain === "deposit"
        ? DEPOSIT_STATUS[normalized]
        : domain === "listing"
          ? LISTING_STATUS[normalized]
          : domain === "release"
            ? RELEASE_STATUS[normalized]
            : domain === "round"
              ? ROUND_STATUS[normalized]
              : domain === "liquidity"
              ? LIQUIDITY_STATUS[normalized]
              : domain === "order"
                ? ORDER_STATUS[normalized]
                : domain === "trade"
                  ? TRADE_STATUS[normalized]
                  : domain === "side"
                    ? SIDE_STATUS[normalized]
                    : domain === "dispute"
                      ? DISPUTE_STATUS[normalized]
                      : `status.${normalized}`;
  const dict = DICTIONARIES[locale];
  if (key && dict[key]) return dict[key];
  if (fallback) return fallback;
  return dict["status.unknown"] ?? value.replace(/_/g, " ");
}
