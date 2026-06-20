import type { AdminComplianceItem } from "@/features/admin/mocks/admin-compliance.mock";



export const COMPLIANCE_FIELD_TOOLTIPS = {

  openSignals: "Активные риск-флаги со статусом «открыто», требующие решения compliance.",

  critical: "Открытые сигналы с severity critical.",

  high: "Открытые сигналы с severity high.",

  onHold: "Операции и флаги на удержании до проверки.",

  blocked: "Заблокированные пользователи (suspended).",

  frozenOps: "Активные compliance freeze по выводам, сделкам и листингам.",

  avgReview: "Среднее время от создания флага до закрытия (resolved/dismissed) за последние 200 кейсов.",

  overdue: "Открытые флаги старше SLA (24 ч) без решения.",

  new24h: "Новые risk flags за последние 24 часа.",

  repeatOffenders: "Пользователи с более чем одним активным флагом.",

  riskScore: "Агрегированная оценка риска (0–100) по правилам Spliton.",

  flagCode: "Код правила, сработавшего при проверке операции или пользователя.",

  sla: "SLA проверки — 24 ч с момента создания флага.",

  severity: "low / medium / high / critical — влияет на приоритет очереди.",

} as const;



export const COMPLIANCE_CONFIRM = {

  reviewed: {

    title: "Пометить риск как проверенный?",

    description:

      "Флаг будет закрыт как обработанный. Укажите результат проверки — он обязателен и попадёт в журнал аудита.",

  },

  dismiss: {

    title: "Отклонить риск (false positive)?",

    description:

      "Флаг будет закрыт как ложное срабатывание. Укажите причину — она обязательна для audit trail.",

  },

  freeze: {

    title: "Заморозить операцию?",

    description:

      "Операция станет недоступна для дальнейшего исполнения до решения compliance. Укажите причину. Действие будет записано в журнал аудита.",

  },

  release: {

    title: "Снять заморозку?",

    description:

      "Операция вернётся в обычную очередь обработки, если нет других блокировок.",

  },

  block: {

    title: "Заблокировать пользователя?",

    description:

      "Пользователь не сможет выполнять финансовые операции. Укажите причину блокировки. Действие будет записано в журнал аудита.",

  },

  unblock: {

    title: "Разблокировать пользователя?",

    description:

      "Аккаунт вернётся в статус active. Укажите причину разблокировки для audit log.",

  },

  escalate: {

    title: "Эскалировать кейс?",

    description:

      "Кейс будет передан Super Admin / compliance lead. Добавьте комментарий для контекста.",

  },

} as const;



export const COMPLIANCE_SORT_OPTIONS = [

  { value: "newest", label: "Сначала новые" },

  { value: "oldest", label: "Сначала старые" },

  { value: "highest_risk", label: "Наивысший риск" },

  { value: "critical_first", label: "Критические первыми" },

  { value: "sla_first", label: "SLA / просрочка" },

  { value: "recently_updated", label: "Недавно обновлённые" },

] as const;



export function complianceEntityPath(row: AdminComplianceItem): string | null {

  if (row.kind === "user" && row.userId) return `/admin/users/${row.userId}`;

  if (row.kind === "withdrawal") return `/admin/withdrawals?search=${encodeURIComponent(row.reference)}`;

  if (row.kind === "trade") return `/admin/secondary-market`;

  if (row.kind === "listing") return `/admin/secondary-market`;

  if (row.kind === "wallet") return `/admin/wallets?search=${encodeURIComponent(row.reference)}`;

  if (row.kind === "deposit") return `/admin/deposits?search=${encodeURIComponent(row.reference)}`;

  return null;

}



export function complianceEntityLabel(kind: AdminComplianceItem["kind"]): string {

  const map: Record<AdminComplianceItem["kind"], string> = {

    user: "Пользователь",

    withdrawal: "Вывод",

    trade: "Сделка",

    listing: "Листинг",

    wallet: "Кошелёк",

    deposit: "Депозит",

  };

  return map[kind] ?? kind;

}



export const COMPLIANCE_STATUS_OPTIONS = [

  { value: "all", label: "Все статусы" },

  { value: "open", label: "Открыто" },

  { value: "in_review", label: "На проверке" },

  { value: "blocked", label: "Заблокировано" },

  { value: "resolved", label: "Решено" },

  { value: "dismissed", label: "Отклонено (false positive)" },

  { value: "on_hold", label: "На удержании (legacy)" },

  { value: "reviewed", label: "Проверено (legacy)" },

] as const;



export const COMPLIANCE_SEVERITY_FILTER = [

  { value: "all", label: "Любая важность" },

  { value: "critical", label: "Критический" },

  { value: "high", label: "Высокий" },

  { value: "medium", label: "Средний" },

  { value: "low", label: "Низкий" },

] as const;



export function formatSlaBadge(item: AdminComplianceItem): { label: string; overdue: boolean } {

  if (["reviewed", "resolved", "dismissed"].includes(item.status)) {
    return { label: "—", overdue: false };
  }

  if (item.slaOverdue) return { label: "Просрочено", overdue: true };

  if (item.slaRemainingHours != null) {

    return { label: `${item.slaRemainingHours} ч`, overdue: false };

  }

  return { label: "24 ч SLA", overdue: false };

}

