/** Русские подписи и tone-маппинги статусов для админки Spliton */

import type { AdminStatusTone } from "@/features/admin/ui/admin-status-badge";

export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  waiting_user: "Ожидает пользователя",
  escalated: "Эскалирован",
  closed: "Закрыт",
  resolved: "Решён",
};

export const SUPPORT_PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

export const WALLET_STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  frozen: "Заморожен",
  blocked: "Заблокирован",
  pending_withdrawal: "Ожидает вывод",
  pending_deposit: "Ожидает пополнение",
};

export const DEPOSIT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirming: "Подтверждается",
  completed: "Завершено",
  failed: "Ошибка",
  rejected: "Отклонено",
  manual_review: "Ручная проверка",
};

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  requested: "Запрошен",
  approved: "В обработке",
  on_hold: "На удержании",
  completed: "Завершено",
  rejected: "Отклонено",
  failed: "Ошибка",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  paused: "Приостановлен",
  sold_out: "Продан",
  cancelled: "Отменён",
  expired: "Истёк",
};

export const RISK_SEVERITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

export const COMPLIANCE_STATUS_LABELS: Record<string, string> = {
  open: "Открыт",
  in_review: "На проверке",
  resolved: "Решён",
  dismissed: "Отклонён",
  reviewed: "Проверен",
  blocked: "Заблокирован",
  on_hold: "На удержании",
};

export function labelFromMap(map: Record<string, string>, key: string): string {
  const k = key.toLowerCase().replace(/-/g, "_");
  return map[k] ?? key.replace(/_/g, " ");
}

export function depositStatusTone(status: string): AdminStatusTone {
  switch (status) {
    case "completed":
      return "success";
    case "confirming":
    case "pending":
      return "pending";
    case "manual_review":
      return "warning";
    case "failed":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export function withdrawalStatusTone(status: string): AdminStatusTone {
  switch (status) {
    case "completed":
      return "success";
    case "pending":
    case "requested":
      return "pending";
    case "approved":
      return "info";
    case "on_hold":
      return "warning";
    case "failed":
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export function complianceStatusTone(status: string): AdminStatusTone {
  switch (status) {
    case "resolved":
    case "reviewed":
      return "success";
    case "dismissed":
      return "neutral";
    case "in_review":
    case "on_hold":
      return "warning";
    case "blocked":
      return "danger";
    case "open":
    default:
      return "pending";
  }
}

export function genericStatusTone(status: string): AdminStatusTone {
  const s = status.toLowerCase();
  if (["completed", "active", "success", "resolved", "published", "operational"].includes(s)) {
    return "success";
  }
  if (["failed", "rejected", "blocked", "banned", "error", "major_outage"].includes(s)) {
    return "danger";
  }
  if (["pending", "open", "requested", "processing", "in_progress", "degraded"].includes(s)) {
    return "pending";
  }
  if (["warning", "manual_review", "on_hold", "escalated", "maintenance"].includes(s)) {
    return "warning";
  }
  return "neutral";
}
