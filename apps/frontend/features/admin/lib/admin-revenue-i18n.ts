/** Labels and tooltips for admin revenue / distribution section. */

export const REVENUE_FIELD_TOOLTIPS = {
  grossRevenue: "Полный доход релиза за период до распределения долей.",
  holdersShare: "70% gross — пул для держателей юнитов пропорционально владению.",
  artistShare: "15% gross — доля артиста (preview; отдельное начисление при реализации).",
  platformShare: "15% gross — комиссия платформы Spliton.",
  distribution:
    "Запуск распределения выполняется оператором. Средства зачисляются через wallet ledger.",
  duplicateProtection: "Повторное начисление за один период блокируется уникальным ограничением.",
  walletLedger: "Каждое начисление создаёт wallet transaction payout_credit.",
  preview:
    "Начисления рассчитываются автоматически на основе юнитов держателей. Запуск — оператором.",
} as const;

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  calculated: "Рассчитано",
  preview: "Предпросмотр",
  review: "На проверке",
  approved: "Одобрено",
  paid: "Выплачено",
  pending: "Ожидает запуска",
  processing: "В обработке",
  completed: "Завершено",
  failed: "Ошибка",
  cancelled: "Отменено",
  manual_review: "Ручная проверка",
};

const SOURCE_LABELS: Record<string, string> = {
  streaming: "Стриминг",
  distributor: "Дистрибьютор",
  license: "Лицензия",
  manual: "Ручное начисление",
  import: "Импорт отчёта",
  other: "Другое",
};

export function revenueStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function revenueSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function revenueStatusTone(
  status: string,
): "neutral" | "success" | "warning" | "pending" | "danger" | "info" {
  switch (status) {
    case "completed":
    case "paid":
      return "success";
    case "failed":
    case "cancelled":
      return "danger";
    case "manual_review":
    case "review":
      return "warning";
    case "preview":
    case "processing":
    case "calculated":
      return "info";
    case "approved":
      return "pending";
    case "pending":
    case "draft":
      return "pending";
    default:
      return "neutral";
  }
}

export function formatRevenuePeriod(from: string, to: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  return `${fmt(from)} — ${fmt(to)}`;
}

export const REVENUE_SOURCE_OPTIONS = [
  { value: "all", label: "Все источники" },
  { value: "streaming", label: revenueSourceLabel("streaming") },
  { value: "distributor", label: revenueSourceLabel("distributor") },
  { value: "license", label: revenueSourceLabel("license") },
  { value: "manual", label: revenueSourceLabel("manual") },
  { value: "import", label: revenueSourceLabel("import") },
  { value: "other", label: revenueSourceLabel("other") },
] as const;
