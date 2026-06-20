export type ReportTemplateMeta = {
  type: string;
  category: string;
  title: string;
  sensitive: boolean;
};

export const REPORT_TEMPLATE_META: ReportTemplateMeta[] = [
  {
    type: 'withdrawals',
    category: 'finance',
    title: 'Выводы',
    sensitive: true,
  },
  {
    type: 'deposits',
    category: 'finance',
    title: 'Пополнения',
    sensitive: true,
  },
  {
    type: 'platform_revenue',
    category: 'finance',
    title: 'Доход платформы',
    sensitive: true,
  },
  {
    type: 'platform_revenue_transactions',
    category: 'finance',
    title: 'Транзакции дохода платформы',
    sensitive: true,
  },
  {
    type: 'finance_cashflow',
    category: 'finance',
    title: 'Денежный поток',
    sensitive: true,
  },
  {
    type: 'finance_fees',
    category: 'finance',
    title: 'Комиссии',
    sensitive: true,
  },
  {
    type: 'revenue_distributions',
    category: 'finance',
    title: 'Распределение дохода',
    sensitive: true,
  },
  {
    type: 'users_funnel',
    category: 'users',
    title: 'Воронка пользователей',
    sensitive: false,
  },
  {
    type: 'users',
    category: 'users',
    title: 'Пользователи',
    sensitive: true,
  },
  {
    type: 'wallet_transactions',
    category: 'finance',
    title: 'Операции кошелька',
    sensitive: true,
  },
  {
    type: 'market_volume',
    category: 'market',
    title: 'Объём вторичного рынка',
    sensitive: false,
  },
  {
    type: 'trades',
    category: 'market',
    title: 'Сделки',
    sensitive: false,
  },
  {
    type: 'tracks_round_progress',
    category: 'content',
    title: 'Прогресс раундов релизов',
    sensitive: false,
  },
  {
    type: 'risk_flags',
    category: 'compliance',
    title: 'Флаги риска',
    sensitive: true,
  },
  {
    type: 'support_tickets',
    category: 'operations',
    title: 'Тикеты поддержки',
    sensitive: false,
  },
  {
    type: 'audit_logs',
    category: 'compliance',
    title: 'Audit log',
    sensitive: true,
  },
  {
    type: 'analytics_summary',
    category: 'analytics',
    title: 'Сводка аналитики',
    sensitive: false,
  },
];

export function getReportMeta(type: string): ReportTemplateMeta {
  return (
    REPORT_TEMPLATE_META.find((m) => m.type === type) ?? {
      type,
      category: 'operations',
      title: type,
      sensitive: false,
    }
  );
}
