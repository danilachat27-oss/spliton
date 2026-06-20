import { ROUTES } from "@/constants/routes";
import type { DashboardPersona } from "@/features/admin/config/admin-rbac";

export type DashboardLayout = {
  priorityTiles: Array<"withdrawals" | "risk" | "support" | "listings">;
  showUsersSection: boolean;
  showFinanceSection: boolean;
  showContentSection: boolean;
  showTrends: boolean;
  showTasks: boolean;
  showAlerts: boolean;
  showQuickActions: boolean;
  showStaffActions: boolean;
  showNavShortcuts: boolean;
  showDepositsFeed: boolean;
  showWithdrawalsFeed: boolean;
  quickActionHrefs: string[];
  showAnalyticsButton: boolean;
};

export const DASHBOARD_BY_PERSONA: Record<DashboardPersona, DashboardLayout> = {
  super: {
    priorityTiles: ["withdrawals", "risk", "support", "listings"],
    showUsersSection: true,
    showFinanceSection: true,
    showContentSection: true,
    showTrends: true,
    showTasks: true,
    showAlerts: true,
    showQuickActions: true,
    showStaffActions: true,
    showNavShortcuts: true,
    showDepositsFeed: true,
    showWithdrawalsFeed: true,
    quickActionHrefs: [
      ROUTES.adminWithdrawals,
      ROUTES.adminDeposits,
      ROUTES.adminTracks,
      ROUTES.adminRevenue,
      ROUTES.adminCompliance,
      ROUTES.adminReports,
      ROUTES.adminRoles,
      ROUTES.adminAudit,
    ],
    showAnalyticsButton: true,
  },
  accountant: {
    priorityTiles: ["withdrawals", "listings", "risk", "support"],
    showUsersSection: false,
    showFinanceSection: true,
    showContentSection: false,
    showTrends: true,
    showTasks: true,
    showAlerts: false,
    showQuickActions: true,
    showStaffActions: false,
    showNavShortcuts: true,
    showDepositsFeed: true,
    showWithdrawalsFeed: true,
    quickActionHrefs: [
      ROUTES.adminWithdrawals,
      ROUTES.adminDeposits,
      ROUTES.adminRevenue,
      ROUTES.adminReports,
      ROUTES.adminPlatformRevenue,
    ],
    showAnalyticsButton: true,
  },
  compliance: {
    priorityTiles: ["risk", "withdrawals", "listings", "support"],
    showUsersSection: true,
    showFinanceSection: false,
    showContentSection: false,
    showTrends: true,
    showTasks: true,
    showAlerts: true,
    showQuickActions: true,
    showStaffActions: false,
    showNavShortcuts: true,
    showDepositsFeed: false,
    showWithdrawalsFeed: true,
    quickActionHrefs: [
      ROUTES.adminCompliance,
      ROUTES.adminSecondaryMarket,
      ROUTES.adminUsers,
      ROUTES.adminAudit,
    ],
    showAnalyticsButton: true,
  },
  support: {
    priorityTiles: ["support", "risk", "withdrawals", "listings"],
    showUsersSection: true,
    showFinanceSection: false,
    showContentSection: false,
    showTrends: false,
    showTasks: true,
    showAlerts: true,
    showQuickActions: true,
    showStaffActions: false,
    showNavShortcuts: true,
    showDepositsFeed: false,
    showWithdrawalsFeed: false,
    quickActionHrefs: [ROUTES.adminSupport, ROUTES.adminUsers, ROUTES.adminOperatorTasks],
    showAnalyticsButton: true,
  },
  analyst: {
    priorityTiles: ["listings", "risk", "withdrawals", "support"],
    showUsersSection: true,
    showFinanceSection: true,
    showContentSection: true,
    showTrends: true,
    showTasks: false,
    showAlerts: false,
    showQuickActions: true,
    showStaffActions: false,
    showNavShortcuts: true,
    showDepositsFeed: false,
    showWithdrawalsFeed: false,
    quickActionHrefs: [
      ROUTES.adminAnalytics,
      ROUTES.adminAnalyticsFinance,
      ROUTES.adminReports,
      ROUTES.adminPlatformRevenue,
    ],
    showAnalyticsButton: true,
  },
  content: {
    priorityTiles: ["listings", "support", "risk", "withdrawals"],
    showUsersSection: false,
    showFinanceSection: false,
    showContentSection: true,
    showTrends: true,
    showTasks: true,
    showAlerts: false,
    showQuickActions: true,
    showStaffActions: false,
    showNavShortcuts: true,
    showDepositsFeed: false,
    showWithdrawalsFeed: false,
    quickActionHrefs: [
      ROUTES.adminTracks,
      ROUTES.adminRounds,
      ROUTES.adminHoldings,
      ROUTES.adminAnalyticsTracks,
    ],
    showAnalyticsButton: true,
  },
};
