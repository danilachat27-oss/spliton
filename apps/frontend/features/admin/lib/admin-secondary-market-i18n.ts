import type { AdminListingStatus, AdminTradeStatus } from "@/features/admin/mocks/admin-secondary-market.mock";

export const SECONDARY_MARKET_FIELD_TOOLTIPS = {
  activeListings: "Количество листингов со статусом «активно» на текущий момент.",
  unitsListed: "Сумма доступных к покупке юнитов во всех активных листингах.",
  lockedUnits: "Юниты, заблокированные под активные и замороженные листинги.",
  tradeVolume: "Сумма gross amount завершённых сделок за выбранный период.",
  completedTrades: "Сделки со статусом settlement settled за период.",
  avgPrice: "Средняя цена за юнит по завершённым сделкам за период.",
  platformFees: "Комиссия платформы (secondary market fee) по сделкам за период.",
  suspicious: "Сделки, помеченные compliance как подозрительные.",
  frozen: "Листинги, замороженные оператором (status paused).",
  cancelled: "Листинги, отменённые за выбранный период.",
  secondaryFee: "Комиссия вторичного рынка удерживается при settlement сделки.",
  lockedUnitsRow: "Юниты продавца заблокированы на время активного листинга.",
  settlement: "Статус расчёта: debit покупателя, credit продавца, fee платформы.",
} as const;

export function listingStatusLabel(status: AdminListingStatus | string): string {
  const map: Record<string, string> = {
    active: "Активно",
    frozen: "Заморожено",
    paused: "Заморожено",
    cancelled: "Отменено",
    completed: "Продано",
    sold_out: "Продано",
    expired: "Истекло",
  };
  return map[status] ?? status;
}

export function tradeStatusLabel(status: AdminTradeStatus | string): string {
  const map: Record<string, string> = {
    pending: "В обработке",
    completed: "Завершено",
    settled: "Завершено",
    failed: "Ошибка",
    suspicious: "Подозрительная",
    cancelled: "Отменено",
  };
  return map[status] ?? status;
}

export function listingStatusTone(status: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "active") return "success";
  if (status === "frozen" || status === "paused") return "warning";
  if (status === "cancelled" || status === "failed") return "danger";
  if (status === "completed" || status === "sold_out") return "info";
  return "neutral";
}

export function tradeStatusTone(status: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "completed" || status === "settled") return "success";
  if (status === "suspicious") return "warning";
  if (status === "failed") return "danger";
  if (status === "pending") return "info";
  return "neutral";
}

export const SECONDARY_MARKET_KPI_TARGETS: Record<string, string> = {
  activeListings: "listings",
  unitsListed: "listings",
  lockedUnits: "listings",
  tradeVolume: "trades",
  completedTrades: "trades",
  avgPrice: "liquidity",
  platformFees: "fees",
  suspicious: "suspicious",
  frozen: "cancelled",
  cancelled: "cancelled",
};
