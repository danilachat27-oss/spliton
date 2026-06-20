import type { ActivityKind, ActivityRecord, ActivityStatus } from "@/components/dashboard/assets/activity-mock-data";

import type { PayoutHistoryRow } from "@/components/dashboard/assets/payouts-mock-data";

import { formatDateTime, formatRelativeTime } from "@/lib/i18n/formatters";

import type { AppLocale } from "@/lib/i18n/types";

import {
  walletActivityTypeLabel,
} from "@/lib/i18n/wallet-activity-labels";

import type { WalletActivityItem } from "@/services/wallet.service";

const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function mapActivityKind(type: string): ActivityKind {
  switch (type) {
    case "deposit":
      return "deposit";
    case "withdrawal":
      return "withdrawal";
    case "primary_purchase":
    case "secondary_buy":
      return "purchase";
    case "secondary_sell":
      return "sale";
    case "trade_lock":
    case "refund":
    case "admin_adjustment":
      return "transfer";
    case "fee":
    case "payout":
      return "transfer";
    default:
      return "transfer";
  }
}

function mapActivityStatus(row: WalletActivityItem): ActivityStatus {
  if (row.status === "completed") return "Completed";
  if (row.status === "pending") return "Pending";
  if (row.status === "failed" || row.status === "cancelled" || row.status === "reversed") {
    return "Cancelled";
  }
  return "Processing";
}

function formatAmountDisplay(row: WalletActivityItem): string {
  return `${row.amount} ${row.asset}`;
}

function shortReferenceId(referenceId: string): string {
  if (referenceId.length <= 12) return referenceId.toUpperCase();
  return `${referenceId.slice(0, 4)}…${referenceId.slice(-4)}`.toUpperCase();
}

export function adaptWalletActivityToRecord(
  row: WalletActivityItem,
  locale: AppLocale,
): ActivityRecord {
  const release = row.relatedEntity?.releaseTitle ?? "—";
  const units =
    row.units && row.units !== "0"
      ? row.direction === "in"
        ? `+${row.units}`
        : row.units
      : "—";

  return {
    id: row.id,
    date: formatDateTime(row.createdAt, locale, DATETIME_OPTS),
    type: walletActivityTypeLabel(row.type, locale),
    kind: mapActivityKind(row.type),
    release,
    units,
    amount: formatAmountDisplay(row),
    status: mapActivityStatus(row),
    txId: shortReferenceId(row.referenceId),
    details: row.description,
    relative: formatRelativeTime(row.createdAt, locale),
  };
}

function mapPayoutHistoryType(type: string): PayoutHistoryRow["type"] {
  switch (type) {
    case "payout":
      return "payout";
    case "withdrawal":
      return "withdrawal";
    case "deposit":
      return "accrual";
    default:
      return "adjustment";
  }
}

function mapPayoutHistoryStatus(row: WalletActivityItem): PayoutHistoryRow["status"] {
  if (row.type === "withdrawal") {
    if (row.status === "completed") return "completed";
    if (row.status === "pending") return "processing";
    return "processing";
  }
  if (row.type === "payout") {
    if (row.status === "completed") return "paid";
    return "accrued";
  }
  if (row.status === "completed") return "completed";
  if (row.status === "pending") return "processing";
  return "available";
}

export function adaptWalletActivityToPayoutHistory(
  row: WalletActivityItem,
  locale: AppLocale,
): PayoutHistoryRow {
  const release = row.relatedEntity?.releaseTitle ?? "—";
  const amount = `${row.amount} ${row.asset}`;
  return {
    id: row.id,
    ledgerRef: shortReferenceId(row.referenceId),
    date: formatDateTime(row.createdAt, locale, DATETIME_OPTS),
    release,
    type: mapPayoutHistoryType(row.type),
    unitsShare: row.units ?? "—",
    amount,
    status: mapPayoutHistoryStatus(row),
  };
}
