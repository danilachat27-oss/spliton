/** Labels and tooltips for admin withdrawals section. */

export const WITHDRAWAL_FIELD_TOOLTIPS = {
  approve: "Блокирует сумму на кошельке и переводит вывод в обработку.",
  hold: "Средства остаются заблокированы; вывод требует дополнительной проверки.",
  reject: "Разблокирует сумму на доступном балансе; создаёт обратную проводку в журнале кошелька.",
  complete: "Списывает заблокированную сумму и завершает вывод; укажите хеш транзакции отправки в сеть.",
  txHash: "Идентификатор исходящего перевода TRC20 в блокчейне.",
  ledgerDebit: "Проводка withdrawal_completed при завершении вывода.",
} as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  requested: "Ожидает",
  approved: "В обработке",
  on_hold: "На удержании",
  completed: "Завершено",
  rejected: "Отклонено",
  failed: "Ошибка",
};

export function withdrawalStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function withdrawalStatusTone(
  status: string,
): "neutral" | "success" | "warning" | "pending" | "danger" | "info" {
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

export { tronTxExplorerUrl } from "@/features/admin/lib/admin-deposit-i18n";