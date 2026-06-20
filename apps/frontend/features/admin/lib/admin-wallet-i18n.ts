/** Labels and tooltips for admin wallets section. */

export const WALLET_FIELD_TOOLTIPS = {
  available:
    "Средства, доступные пользователю для покупок, выводов и операций на вторичном рынке.",
  locked:
    "Средства заблокированы под pending withdrawals, активные сделки или другие операции.",
  pending: "Сумма в обработке — ожидает подтверждения депозита или вывода.",
  earned: "Суммарные начисления (payout credits) по всем релизам пользователя.",
  withdrawn: "Суммарно выведено на внешние адреса (completed withdrawals).",
  deposits: "Суммарно зачислено через депозиты USDT TRC20.",
} as const;

const OPERATION_LABELS: Record<string, string> = {
  deposit_pending: "Депозит (ожидание)",
  deposit_completed: "Депозит зачислен",
  withdrawal_created: "Заявка на вывод",
  withdrawal_locked: "Вывод заблокирован",
  withdrawal_completed: "Вывод выполнен",
  withdrawal_rejected: "Вывод отклонён",
  primary_purchase: "Первичная покупка",
  primary_purchase_fee: "Комиссия первички",
  payout_credit: "Начисление",
  secondary_purchase: "Покупка на вторичке",
  secondary_sale: "Продажа на вторичке",
  secondary_fee: "Комиссия вторички",
  withdrawal_fee: "Комиссия вывода",
  manual_adjustment: "Ручная корректировка",
  platform_fee: "Комиссия платформы",
};

export function formatWalletOperation(type: string): string {
  return OPERATION_LABELS[type] ?? type.replace(/_/g, " ");
}

export function formatWalletUserStatus(status: string): string {
  const map: Record<string, string> = {
    active: "Активен",
    pending: "Ожидает",
    suspended: "Приостановлен",
    banned: "Заблокирован",
  };
  return map[status] ?? status;
}

export function formatWalletStatus(status: string): string {
  const map: Record<string, string> = {
    active: "Активен",
    blocked: "Заблокирован",
    archived: "Архив",
  };
  return map[status] ?? status;
}

export function formatMarketKind(kind: string): string {
  const map: Record<string, string> = {
    primary: "Первичная покупка",
    secondary_buy: "Покупка (вторичка)",
    secondary_sell: "Продажа (вторичка)",
  };
  return map[kind] ?? kind;
}
