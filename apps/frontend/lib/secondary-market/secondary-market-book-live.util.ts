import type { RichUserMarketOrderDto } from "@/services/secondary-market.service";

export type TerminalMyOrderStatus =
  | "active"
  | "partial"
  | "filled"
  | "cancelled"
  | "expired"
  | "failed";

export type TerminalMyOrder = {
  id: string;
  marketId: string;
  side: "buy" | "sell";
  mode: "limit" | "market";
  price: number;
  units: number;
  filled: number;
  status: TerminalMyOrderStatus;
  statusLabel: string;
  createdAt: string;
  listingId: string | null;
  canCancel: boolean;
};

const STATUS_MAP: Record<string, TerminalMyOrderStatus> = {
  active: "active",
  partial: "partial",
  filled: "filled",
  cancelled: "cancelled",
  expired: "expired",
  rejected: "failed",
  failed: "failed",
};

export function mapRichUserOrderToTerminalMyOrder(
  order: RichUserMarketOrderDto,
  marketId: string,
): TerminalMyOrder {
  return {
    id: order.id,
    marketId,
    side: order.side,
    mode: order.mode,
    price: Number(order.pricePerUnit ?? 0),
    units: Number(order.unitsTotal),
    filled: Number(order.unitsFilled),
    status: STATUS_MAP[order.status] ?? "failed",
    statusLabel: order.statusLabel,
    createdAt: order.createdAt,
    listingId: order.listingId || null,
    canCancel: order.canCancel,
  };
}

/** Извлекает UUID листинга для POST .../listings/:id/cancel */
export function listingIdForCancel(order: TerminalMyOrder): string | null {
  if (order.listingId) return order.listingId;
  if (order.id.startsWith("lst-order-")) {
    return order.id.slice("lst-order-".length);
  }
  return null;
}
