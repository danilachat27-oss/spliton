import { formatTrackStatus } from "@/features/admin/lib/admin-i18n";

export const HOLDING_LOCK_REASON_LABELS: Record<string, string> = {
  active_listing: "Активный listing",
  pending_trade: "Ожидающая сделка",
  compliance_freeze: "Compliance freeze",
  settlement: "Расчёт сделки",
  unknown: "Не указана",
};

export const HOLDING_EVENT_LABELS: Record<string, string> = {
  primary_purchase: "Первичная покупка",
  secondary_purchase: "Покупка на вторичном рынке",
  secondary_sale: "Продажа на вторичном рынке",
  listing_lock: "Блокировка под listing",
  listing_unlock: "Разблокировка после отмены",
  payout_snapshot: "Снимок для начисления",
  manual_adjustment: "Ручная корректировка",
};

export const HOLDING_FIELD_TOOLTIPS = {
  available: "Юниты, доступные для продажи или перевода. Не заблокированы listing или settlement.",
  locked: "Юниты, временно недоступные — обычно под активный listing или расчёт сделки.",
  averagePrice: "Средняя цена входа по всем покупкам держателя по этому релизу.",
  currentValue: "Текущая оценка = всего юнитов × средняя цена входа (упрощённая модель).",
  earned: "Сумма выплаченных начислений (PAID payouts) по релизу.",
  ownership: "Доля держателя от total units релиза.",
} as const;

export function formatLockReason(reason: string | null | undefined): string {
  if (!reason) return "—";
  return HOLDING_LOCK_REASON_LABELS[reason] ?? reason;
}

export function formatHoldingEvent(type: string): string {
  return HOLDING_EVENT_LABELS[type] ?? type;
}

export function formatUnitsWithLabel(value: string | number): string {
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return String(value);
  const word = n === 1 ? "юнит" : n >= 2 && n <= 4 ? "юнита" : "юнитов";
  return `${n.toLocaleString("ru-RU")} ${word}`;
}

export function releaseStatusLabel(status: string): string {
  return formatTrackStatus(status);
}

export function userStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Активен",
    pending: "Ожидает",
    blocked: "Заблокирован",
    pending_email_verification: "Email не подтверждён",
  };
  return map[status] ?? status;
}
