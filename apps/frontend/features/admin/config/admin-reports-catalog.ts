import type { AdminReportType } from "@/services/admin/adminReports.service";

import { canGenerateReportType } from "@/features/admin/config/admin-rbac";



export type ReportDomainId =

  | "finance"

  | "users"

  | "market"

  | "content"

  | "compliance"

  | "operations"

  | "analytics";



export type ReportFormat = "csv" | "xlsx" | "json";



export type ReportCatalogEntry = {

  value: AdminReportType;

  label: string;

  description: string;

  longDescription: string;

  domain: ReportDomainId;

  fields: string[];

  formats: ReportFormat[];

  roles: string[];

  sensitive: boolean;

  estimatedVolume: string;

};



export const REPORT_CATALOG: ReportCatalogEntry[] = [

  {

    value: "withdrawals",

    label: "Выводы",

    description: "Очередь и история выводов USDT за период.",

    longDescription:

      "Очередь и история выводов USDT за выбранный период: суммы, комиссии, статусы, TRC20-адреса, blockchain tx, обработчик и время выполнения.",

    domain: "finance",

    fields: [

      "withdrawal id",

      "user",

      "gross amount",

      "fee",

      "net amount",

      "status",

      "address",

      "blockchain tx",

      "requested at",

      "completed at",

    ],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "ACCOUNTANT", "COMPLIANCE", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "deposits",

    label: "Пополнения",

    description: "Входящие депозиты USDT TRC20.",

    longDescription:

      "Входящие депозиты USDT TRC20, статусы подтверждений, tx hash, адреса, суммы и результаты сверки.",

    domain: "finance",

    fields: ["deposit id", "user", "amount", "status", "tx hash", "received at"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "platform_revenue",

    label: "Доход платформы",

    description: "Агрегированный доход Spliton по источникам.",

    longDescription:

      "Агрегированный доход Spliton по источникам: первичные покупки, выводы, вторичный рынок, ручные начисления.",

    domain: "finance",

    fields: ["fee code", "amount", "currency", "subject", "created at"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "platform_revenue_transactions",

    label: "Транзакции дохода платформы",

    description: "Детализация комиссий платформы.",

    longDescription:

      "Детализация всех комиссий платформы с привязкой к order, withdrawal, trade, пользователю и релизу.",

    domain: "finance",

    fields: ["fee id", "fee code", "amount", "subject type", "subject id", "created at"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "finance_cashflow",

    label: "Денежный поток",

    description: "Приток и отток USDT за период.",

    longDescription:

      "Приток и отток USDT: deposits, withdrawals, payouts, fees и net flow за период.",

    domain: "finance",

    fields: ["period", "deposits", "withdrawals", "net flow"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "по дням",

  },

  {

    value: "finance_fees",

    label: "Комиссии",

    description: "Сводка удержанных комиссий.",

    longDescription: "Сводка удержанных комиссий по типам, периодам и связанным операциям.",

    domain: "finance",

    fields: ["fee code", "amount usdt", "count"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "агрегат",

  },

  {

    value: "revenue_distributions",

    label: "Распределение дохода",

    description: "Revenue events и начисления держателям.",

    longDescription:

      "Revenue events, distributions, начисления держателям, статусы и связанные wallet ledger операции.",

    domain: "finance",

    fields: ["payout id", "status", "amount net", "created at"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "ACCOUNTANT", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "users_funnel",

    label: "Воронка пользователей",

    description: "Регистрация и первая активность.",

    longDescription:

      "Регистрация, активация, первый депозит, первая покупка юнитов, первое начисление, первый вывод и активность на вторичном рынке.",

    domain: "users",

    fields: ["user", "registered", "verified", "first deposit", "first purchase"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "BUSINESS_ANALYST"],

    sensitive: false,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "market_volume",

    label: "Объём вторичного рынка",

    description: "Листинги, сделки, оборот.",

    longDescription:

      "Листинги, сделки, оборот, средняя цена, комиссии и активность по релизам.",

    domain: "market",

    fields: ["trade id", "release", "gross amount", "executed at"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "BUSINESS_ANALYST"],

    sensitive: false,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "tracks_round_progress",

    label: "Прогресс раундов релизов",

    description: "Статусы раундов и наполнение.",

    longDescription:

      "Статусы раундов, проданные юниты, доступные юниты, progress, raise target и hard cap.",

    domain: "content",

    fields: ["round id", "track title", "status", "raised", "target"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "CONTENT_MANAGER", "BUSINESS_ANALYST"],

    sensitive: false,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "risk_flags",

    label: "Флаги риска",

    description: "Compliance-сигналы и расследования.",

    longDescription:

      "Risk flags, подозрительные операции, заморозки, блокировки, статусы расследований и действия compliance.",

    domain: "compliance",

    fields: ["flag id", "user", "severity", "flag code", "status", "created at"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "COMPLIANCE", "BUSINESS_ANALYST"],

    sensitive: true,

    estimatedVolume: "до 5 000 строк",

  },

  {

    value: "support_tickets",

    label: "Тикеты поддержки",

    description: "Обращения пользователей за период.",

    longDescription:

      "Обращения пользователей, категории, приоритеты, SLA, ответственные и статусы обработки.",

    domain: "operations",

    fields: ["ticket id", "user", "subject", "category", "status", "priority", "created at"],

    formats: ["csv"],

    roles: ["SUPER_ADMIN", "SUPPORT_MANAGER", "BUSINESS_ANALYST"],

    sensitive: false,

    estimatedVolume: "до 5 000 строк",

  },

];



export const REPORT_DOMAIN_LABELS: Record<ReportDomainId, string> = {

  finance: "Финансы",

  users: "Пользователи",

  market: "Рынок",

  content: "Контент",

  compliance: "Риски и контроль",

  operations: "Операции",

  analytics: "Аналитика",

};



export function getReportsForRole(roles: string[] | undefined): ReportCatalogEntry[] {

  return REPORT_CATALOG.filter((r) => canGenerateReportType(roles, r.value));

}



export function getReportCatalogEntry(type: string): ReportCatalogEntry | undefined {

  return REPORT_CATALOG.find((r) => r.value === type);

}



export function groupReportsByDomain(

  entries: ReportCatalogEntry[],

): Record<ReportDomainId, ReportCatalogEntry[]> {

  const out = {} as Record<ReportDomainId, ReportCatalogEntry[]>;

  for (const id of Object.keys(REPORT_DOMAIN_LABELS) as ReportDomainId[]) {

    out[id] = [];

  }

  for (const e of entries) {

    out[e.domain].push(e);

  }

  return out;

}

