export type AdminDashboardKpis = {
  totalUsers: number;
  activeUsers: number;
  newUsers?: number;
  totalTracks: number;
  activeRounds: number;
  totalDepositsUsdt: string;
  totalWithdrawalsUsdt?: string;
  pendingWithdrawalsUsdt: string;
  totalPayoutsUsdt: string;
  platformRevenueUsdt: string;
  availableBalanceUsdt?: string;
  lockedBalanceUsdt?: string;
  activeListings: number;
  completedTrades: number;
  openRiskFlags?: number;
  openSupportTickets?: number;
  deltas?: {
    depositsPct?: number | null;
    withdrawalsPct?: number | null;
    newUsersPct?: number | null;
  };
};

export const MOCK_ADMIN_DASHBOARD_KPIS: AdminDashboardKpis = {
  totalUsers: 2847,
  activeUsers: 1923,
  totalTracks: 48,
  activeRounds: 6,
  totalDepositsUsdt: "1 240 500",
  pendingWithdrawalsUsdt: "84 200",
  totalPayoutsUsdt: "312 800",
  platformRevenueUsdt: "48 920",
  activeListings: 37,
  completedTrades: 412,
};

export type AdminDashboardAlert = {
  id: string;
  level: "warning" | "danger" | "info";
  message: string;
  href?: string;
  createdAt: string;
};

export const MOCK_ADMIN_ALERTS: AdminDashboardAlert[] = [
  {
    id: "al-1",
    level: "warning",
    message: "12 выводов ожидают проверки более 24 ч",
    href: "/admin/withdrawals?status=requested",
    createdAt: "2026-05-30T09:00:00Z",
  },
  {
    id: "al-2",
    level: "danger",
    message: "3 подозрительные сделки на вторичном рынке",
    href: "/admin/secondary-market",
    createdAt: "2026-05-30T08:15:00Z",
  },
  {
    id: "al-3",
    level: "info",
    message: "2 операции заморожены compliance",
    href: "/admin/compliance",
    createdAt: "2026-05-30T07:40:00Z",
  },
];

export type AdminRecentAction = {
  id: string;
  adminEmail: string;
  action: string;
  createdAt: string;
};

export const MOCK_ADMIN_RECENT_ACTIONS: AdminRecentAction[] = [
  {
    id: "ra-1",
    adminEmail: "ops@Spliton.io",
    action: "Одобрен вывод wd-8821",
    createdAt: "2026-05-30T10:12:00Z",
  },
  {
    id: "ra-2",
    adminEmail: "content@Spliton.io",
    action: "Опубликован трек trk-midnight-run",
    createdAt: "2026-05-30T09:45:00Z",
  },
  {
    id: "ra-3",
    adminEmail: "compliance@Spliton.io",
    action: "Снят риск-флаг по сделке вторичного рынка",
    createdAt: "2026-05-30T09:10:00Z",
  },
];
