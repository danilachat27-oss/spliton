import { ADMIN_METRIC_NA_LABEL } from "@/features/admin/lib/admin-format";

export const REPORTS_FIELD_TOOLTIPS = {
  total: "Все задачи генерации отчётов за выбранный период (или всего).",
  completed: "Успешно сформированные отчёты с доступным файлом.",
  queued: "Задачи в очереди, ожидают worker или inline processing.",
  processing: "Отчёты в процессе генерации.",
  failed24h: "Задачи со статусом failed за последние 24 часа.",
  avgGeneration: "Среднее время от создания задачи до completed (последние 100).",
  totalSize: "Суммарный размер файлов завершённых отчётов.",
  worker: "Фоновый worker обрабатывает очередь report jobs.",
  storageMode:
    "db · Postgres (dev/staging); local/object/supabase · файловое хранилище для production.",
  sensitive: "Содержит финансовые или персональные данные. Доступ ограничен RBAC.",
  retention: "Файлы хранятся согласно политике retention платформы (TODO: configurable).",
} as const;

export const REPORT_STATUS_LABELS: Record<string, string> = {
  queued: "В очереди",
  pending: "В очереди",
  running: "Выполняется",
  processing: "В обработке",
  completed: "Завершено",
  failed: "Ошибка",
  expired: "Истёк",
  retrying: "Повтор",
};

export const REPORT_PERIOD_PRESETS = [
  { id: "today", label: "Сегодня" },
  { id: "yesterday", label: "Вчера" },
  { id: "7d", label: "7 дней" },
  { id: "30d", label: "30 дней" },
  { id: "this_month", label: "Текущий месяц" },
  { id: "last_month", label: "Прошлый месяц" },
  { id: "custom", label: "Произвольный" },
] as const;

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return ADMIN_METRIC_NA_LABEL;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null) return ADMIN_METRIC_NA_LABEL;
  if (ms < 1000) return `${ms} мс`;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec} сек`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min} мин ${rem} сек`;
}

export function reportStatusTone(
  status: string,
): "success" | "danger" | "pending" | "neutral" | "warning" {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "expired") return "neutral";
  if (status === "running" || status === "processing") return "warning";
  if (status === "queued" || status === "pending") return "pending";
  return "neutral";
}

export const SCHEDULED_REPORTS_PLACEHOLDER =
  "Плановые отчёты будут доступны после подключения scheduler. Будущие сценарии: ежедневный финансовый отчёт, еженедельный platform revenue, ежемесячные начисления, compliance summary, support SLA report.";

export const WORKER_DISABLED_MESSAGE =
  "Воркер выключен. Отчёты обрабатываются inline или остаются в очереди в зависимости от режима backend.";

export const DB_STORAGE_WARNING =
  "Хранение файлов в Postgres подходит только для dev/staging. Для production используйте Supabase Storage / S3 / R2.";

export const XLSX_DISABLED_MESSAGE =
  "XLSX будет доступен после подключения Excel export.";
