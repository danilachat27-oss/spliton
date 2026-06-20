import { ADMIN_API_PATHS, getAdminDataSource } from "@/features/admin/api/admin-api.config";
import type { AdminApiClient } from "@/features/admin/api/admin-api-client";
import type { AdminOperatorTask } from "@/features/admin/lib/operator-tasks.types";
import {
  MOCK_ADMIN_ALERTS,
  MOCK_ADMIN_DASHBOARD_KPIS,
  MOCK_ADMIN_RECENT_ACTIONS,
  type AdminDashboardAlert,
  type AdminDashboardKpis,
  type AdminRecentAction,
} from "@/features/admin/mocks/admin-dashboard.mock";
import {
  MOCK_ADMIN_DEPOSITS,
  MOCK_ADMIN_WITHDRAWALS,
  type AdminDepositListItem,
  type AdminWithdrawalListItem,
} from "@/features/admin/mocks/admin-finance.mock";
import type { AnalyticsDashboardTrends, AnalyticsQuery } from "@/features/admin/analytics/types";
import { MOCK_ANALYTICS_TRENDS } from "@/features/admin/mocks/admin-analytics-overview.mock";
import { buildAnalyticsQueryString } from "./admin-analytics-query.util";
import { adminMockDelay } from "./admin-api.util";
import { requireAdminLiveClient } from "./admin-service.util";

export async function getAdminDashboardKpis(
  client?: AdminApiClient,
  query?: AnalyticsQuery,
): Promise<AdminDashboardKpis> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AdminDashboardKpis>(
      `${ADMIN_API_PATHS.dashboardSummary}${buildAnalyticsQueryString(query)}`,
    );
  }
  await adminMockDelay();
  return { ...MOCK_ADMIN_DASHBOARD_KPIS };
}

export async function getAdminDashboardTasks(
  client?: AdminApiClient,
): Promise<AdminOperatorTask[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{ items: AdminOperatorTask[] }>(ADMIN_API_PATHS.dashboardTasks);
    return res.items;
  }
  await adminMockDelay(120);
  return [
    {
      id: "deposits-review",
      label: "Пополнения на проверке",
      description: "Заявки в статусах «Ожидает» и «Ручная проверка»",
      category: "finance",
      count: 3,
      href: "/admin/deposits?status=manual_review",
      priority: "high",
    },
    {
      id: "withdrawals-pending",
      label: "Выводы в очереди",
      description: "Запрошены, в обработке или на удержании",
      category: "finance",
      count: 5,
      href: "/admin/withdrawals?status=requested",
      priority: "high",
    },
    {
      id: "withdrawals-on-hold",
      label: "Выводы на удержании",
      description: "Требуют решения compliance или бухгалтерии",
      category: "finance",
      count: 2,
      href: "/admin/withdrawals?status=on_hold",
      priority: "high",
    },
    {
      id: "compliance-open",
      label: "Открытые риск-флаги",
      description: "Активные сигналы, ожидающие разбора",
      category: "compliance",
      count: 4,
      href: "/admin/compliance?status=open",
      priority: "high",
    },
    {
      id: "support-open",
      label: "Тикеты поддержки",
      description: "Открытые и в работе обращения пользователей",
      category: "support",
      count: 7,
      href: "/admin/support?status=open",
    },
    {
      id: "support-escalated",
      label: "Эскалированные тикеты",
      description: "Переданы старшему оператору или compliance",
      category: "support",
      count: 1,
      href: "/admin/support?status=escalated",
      priority: "high",
    },
    {
      id: "tracks-draft",
      label: "Черновики треков",
      description: "Релизы, не опубликованные в каталог",
      category: "content",
      count: 2,
      href: "/admin/tracks?status=draft",
    },
    {
      id: "rounds-draft",
      label: "Черновики раундов",
      description: "Сделки первичного размещения без запуска",
      category: "content",
      count: 1,
      href: "/admin/rounds?status=draft",
    },
    {
      id: "market-trade-flags",
      label: "Сделки под наблюдением",
      description: "Риск-флаги, привязанные к сделкам вторичного рынка",
      category: "market",
      count: 3,
      href: "/admin/secondary-market",
      priority: "high",
    },
    {
      id: "reports-queued",
      label: "Отчёты в очереди",
      description: "Фоновые выгрузки, ожидающие воркера",
      category: "operations",
      count: 2,
      href: "/admin/reports",
    },
    {
      id: "reports-failed",
      label: "Сбойные отчёты за 24 ч",
      description: "Повторить генерацию или проверить воркер",
      category: "operations",
      count: 1,
      href: "/admin/reports",
      priority: "high",
    },
    {
      id: "audit-review",
      label: "Журнал за сегодня",
      description: "Последние действия операторов — для выборочной проверки",
      category: "operations",
      count: 0,
      href: "/admin/audit-log",
    },
  ];
}

export async function getAdminDashboardAlerts(
  client?: AdminApiClient,
): Promise<AdminDashboardAlert[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{ items: AdminDashboardAlert[] }>(
      ADMIN_API_PATHS.dashboardRiskAlerts,
    );
    return res.items;
  }
  await adminMockDelay(120);
  return [...MOCK_ADMIN_ALERTS];
}

export async function getAdminRecentActions(
  client?: AdminApiClient,
): Promise<AdminRecentAction[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{ items: AdminRecentAction[] }>(ADMIN_API_PATHS.dashboardRecentActions);
    return res.items;
  }
  await adminMockDelay(120);
  return [...MOCK_ADMIN_RECENT_ACTIONS];
}

export async function getAdminRecentDeposits(
  client?: AdminApiClient,
): Promise<AdminDepositListItem[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{ items: AdminDepositListItem[] }>(ADMIN_API_PATHS.dashboardRecentDeposits);
    return res.items;
  }
  await adminMockDelay(120);
  return MOCK_ADMIN_DEPOSITS.slice(0, 5);
}

export async function getAdminRecentWithdrawals(
  client?: AdminApiClient,
): Promise<AdminWithdrawalListItem[]> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    const res = await client.get<{ items: AdminWithdrawalListItem[] }>(
      ADMIN_API_PATHS.dashboardRecentWithdrawals,
    );
    return res.items;
  }
  await adminMockDelay(120);
  return MOCK_ADMIN_WITHDRAWALS.slice(0, 5);
}

export async function getAdminDashboardTrends(
  query?: AnalyticsQuery,
  client?: AdminApiClient,
): Promise<AnalyticsDashboardTrends | null> {
  if (getAdminDataSource() === "live") {
    requireAdminLiveClient(client);
    return client.get<AnalyticsDashboardTrends>(
      `${ADMIN_API_PATHS.dashboardTrends}${buildAnalyticsQueryString(query)}`,
    );
  }
  await adminMockDelay(200);
  return { ...MOCK_ANALYTICS_TRENDS };
}
