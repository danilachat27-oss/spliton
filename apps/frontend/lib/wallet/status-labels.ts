type TranslateFn = (key: string, fallback?: string) => string;

const DEPOSIT_STATUS: Record<string, string> = {
  pending: "Ожидает",
  confirming: "Подтверждение",
  manual_review: "На проверке",
  completed: "Зачислено",
  failed: "Ошибка",
};

const DEPOSIT_STATUS_KEYS: Record<string, string> = {
  pending: "wallet.status.deposit.pending",
  confirming: "wallet.status.deposit.confirming",
  manual_review: "wallet.status.deposit.manual_review",
  completed: "wallet.status.deposit.completed",
  failed: "wallet.status.deposit.failed",
};

const TX_TYPE: Record<string, string> = {
  deposit: "Пополнение",
  withdrawal: "Вывод",
  trade_settlement: "Сделка",
  trade_lock: "Блокировка",
  payout: "Выплата",
  fee: "Комиссия",
  refund: "Возврат",
  admin_adjustment: "Корректировка",
};

const TX_TYPE_KEYS: Record<string, string> = {
  deposit: "wallet.status.txType.deposit",
  withdrawal: "wallet.status.txType.withdrawal",
  trade_settlement: "wallet.status.txType.trade_settlement",
  trade_lock: "wallet.status.txType.trade_lock",
  payout: "wallet.status.txType.payout",
  fee: "wallet.status.txType.fee",
  refund: "wallet.status.txType.refund",
  admin_adjustment: "wallet.status.txType.admin_adjustment",
};

const TX_STATUS: Record<string, string> = {
  pending: "В обработке",
  completed: "Завершено",
  failed: "Ошибка",
  cancelled: "Отменено",
  reversed: "Отменено",
};

const TX_STATUS_KEYS: Record<string, string> = {
  pending: "wallet.status.tx.pending",
  completed: "wallet.status.tx.completed",
  failed: "wallet.status.tx.failed",
  cancelled: "wallet.status.tx.cancelled",
  reversed: "wallet.status.tx.reversed",
};

const LISTING_STATUS: Record<string, string> = {
  active: "Активно",
  paused: "Приостановлено",
  sold_out: "Продано",
  cancelled: "Отменено",
  expired: "Истекло",
};

const LISTING_STATUS_KEYS: Record<string, string> = {
  active: "wallet.status.listing.active",
  paused: "wallet.status.listing.paused",
  sold_out: "wallet.status.listing.sold_out",
  cancelled: "wallet.status.listing.cancelled",
  expired: "wallet.status.listing.expired",
};

const TRADE_STATUS: Record<string, string> = {
  pending: "В обработке",
  settled: "Исполнено",
  failed: "Ошибка",
  reversed: "Отменено",
};

const TRADE_STATUS_KEYS: Record<string, string> = {
  pending: "wallet.status.trade.pending",
  settled: "wallet.status.trade.settled",
  failed: "wallet.status.trade.failed",
  reversed: "wallet.status.trade.reversed",
};

const WITHDRAWAL_STATUS: Record<string, string> = {
  pending: "Заявка принята",
  requested: "Заявка принята",
  locked: "Средства заблокированы",
  on_hold: "На проверке compliance",
  approved: "Одобрено",
  processing: "В обработке",
  completed: "Выполнен",
  failed: "Ошибка",
  cancelled: "Отменён",
  rejected: "Отклонён",
};

const WITHDRAWAL_STATUS_KEYS: Record<string, string> = {
  pending: "wallet.status.withdrawal.pending",
  requested: "wallet.status.withdrawal.requested",
  locked: "wallet.status.withdrawal.locked",
  on_hold: "wallet.status.withdrawal.on_hold",
  approved: "wallet.status.withdrawal.approved",
  processing: "wallet.status.withdrawal.processing",
  completed: "wallet.status.withdrawal.completed",
  failed: "wallet.status.withdrawal.failed",
  cancelled: "wallet.status.withdrawal.cancelled",
  rejected: "wallet.status.withdrawal.rejected",
};

function labelFromMap(
  status: string,
  labels: Record<string, string>,
  keys: Record<string, string>,
  t?: TranslateFn,
): string {
  const key = keys[status];
  if (t && key) return t(key);
  return labels[status] ?? status;
}

export function depositStatusLabel(status: string, t?: TranslateFn): string {
  return labelFromMap(status, DEPOSIT_STATUS, DEPOSIT_STATUS_KEYS, t);
}

export function withdrawalStatusLabel(status: string, t?: TranslateFn): string {
  return labelFromMap(status, WITHDRAWAL_STATUS, WITHDRAWAL_STATUS_KEYS, t);
}

export function walletTxTypeLabel(type: string, t?: TranslateFn): string {
  return labelFromMap(type, TX_TYPE, TX_TYPE_KEYS, t);
}

export function walletTxStatusLabel(status: string, t?: TranslateFn): string {
  return labelFromMap(status, TX_STATUS, TX_STATUS_KEYS, t);
}

export function listingStatusLabel(status: string, t?: TranslateFn): string {
  return labelFromMap(status, LISTING_STATUS, LISTING_STATUS_KEYS, t);
}

export function tradeStatusLabel(status: string, t?: TranslateFn): string {
  return labelFromMap(status, TRADE_STATUS, TRADE_STATUS_KEYS, t);
}
