import type { LucideIcon } from "@/lib/lucide";

import {

  Activity,

  BarChart3,

  AlertTriangle,

  ArrowDownToLine,

  ArrowUpFromLine,

  BadgePercent,

  Bell,

  BookOpen,

  ChartColumn,

  CircleDollarSign,

  ClipboardList,

  FileChartColumn,

  Handshake,

  Headphones,

  LayoutDashboard,

  ListChecks,

  Music2,

  Newspaper,

  PieChart,

  RefreshCw,

  Scale,

  ScrollText,

  Settings,

  ShieldCheck,

  Shield,
  Store,

  List,

  FolderOpen,

  Users,

  Wallet,

} from "@/lib/lucide";



import { ROUTES } from "@/constants/routes";

import type { StaffRoleCode } from "@/features/admin/types/admin-roles";
import {
  effectiveMatrixLevel,
  type AdminMatrixSection,
} from "@/features/admin/config/admin-role-matrix";



export type AdminSectionId =

  | "dashboard"

  | "operatorTasks"

  | "riskSignals"

  | "users"

  | "tracks"

  | "artists"

  | "genres"

  | "labels"

  | "rounds"

  | "wallets"

  | "deposits"

  | "withdrawals"

  | "holdings"

  | "revenue"

  | "secondaryMarket"

  | "marketTrades"

  | "marketSuspicious"

  | "platformRevenue"

  | "reports"

  | "support"

  | "disputes"

  | "compliance"

  | "kyc"

  | "referrals"

  | "legal"

  | "treasury"

  | "settings"

  | "audit"

  | "roles"

  | "news"

  | "helpCenter"

  | "systemStatus"

  | "notifications"

  | "updates"

  | "docs"

  | "analyticsOverview"

  | "analyticsFinance"

  | "analyticsUsers"

  | "analyticsTracks"

  | "analyticsMarket"

  | "analyticsRevenue"

  | "analyticsRisk"

  | "analyticsOperations";



export type AdminNavItem = {

  id: AdminSectionId;

  href: string;

  icon: LucideIcon;

  /** Пусто = только SUPER_ADMIN / ADMIN */

  roles?: StaffRoleCode[];

  /** Для проверки доступа, если пункт — alias (напр. сделки рынка) */

  accessAs?: AdminSectionId;

  external?: boolean;

};



export type AdminNavGroupId =

  | "main"

  | "usersAccess"

  | "content"

  | "finance"

  | "market"

  | "operations"

  | "analytics"

  | "system";



export type AdminNavGroup = {

  id: AdminNavGroupId;

  items: AdminNavItem[];

};





export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [

  {

    id: "main",

    items: [

      {
        id: "dashboard",
        href: ROUTES.admin,
        icon: LayoutDashboard,
        roles: [
          "SUPER_ADMIN",
          "ADMIN",
          "ACCOUNTANT",
          "CONTENT_MANAGER",
          "SUPPORT_MANAGER",
          "COMPLIANCE",
          "SUPPORT",
          "BUSINESS_ANALYST",
        ],
      },

      {

        id: "operatorTasks",

        href: ROUTES.adminOperatorTasks,

        icon: ListChecks,

        roles: [

          "SUPER_ADMIN",

          "ADMIN",

          "ACCOUNTANT",

          "SUPPORT_MANAGER",

          "SUPPORT",

          "COMPLIANCE",

        ],

      },

      {

        id: "riskSignals",

        href: ROUTES.adminCompliance,

        icon: AlertTriangle,

        accessAs: "compliance",

        roles: ["SUPER_ADMIN", "ADMIN", "COMPLIANCE", "ACCOUNTANT"],

      },

    ],

  },

  {

    id: "usersAccess",

    items: [

      {

        id: "users",

        href: ROUTES.adminUsers,

        icon: Users,

        roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT_MANAGER", "SUPPORT", "COMPLIANCE"],

      },

      {

        id: "roles",

        href: ROUTES.adminRoles,

        icon: Scale,

        roles: ["SUPER_ADMIN", "ADMIN"],

      },

      {

        id: "audit",

        href: ROUTES.adminAudit,

        icon: ScrollText,

        roles: [

          "SUPER_ADMIN",

          "ADMIN",

          "ACCOUNTANT",

          "SUPPORT_MANAGER",

          "SUPPORT",

          "COMPLIANCE",

        ],

      },

    ],

  },

  {

    id: "content",

    items: [

      {

        id: "tracks",

        href: ROUTES.adminTracks,

        icon: Music2,

        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],

      },

      {

        id: "artists",

        href: ROUTES.adminArtists,

        icon: Users,

        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],

      },

      {

        id: "genres",

        href: ROUTES.adminGenres,

        icon: List,

        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],

      },

      {

        id: "labels",

        href: ROUTES.adminLabels,

        icon: FolderOpen,

        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],

      },

      {

        id: "rounds",

        href: ROUTES.adminRounds,

        icon: Handshake,

        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],

      },

      {

        id: "holdings",

        href: ROUTES.adminHoldings,

        icon: PieChart,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "CONTENT_MANAGER", "COMPLIANCE", "SUPPORT_MANAGER"],

      },

      {

        id: "news",

        href: ROUTES.adminNews,

        icon: Newspaper,

        roles: ["SUPER_ADMIN", "ADMIN", "NEWS_MANAGER", "CONTENT_MANAGER"],

      },

      {

        id: "helpCenter",

        href: ROUTES.adminHelpCenter,

        icon: BookOpen,

        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "SUPPORT_MANAGER", "SUPPORT", "BUSINESS_ANALYST"],

      },

    ],

  },

  {

    id: "finance",

    items: [

      {

        id: "wallets",

        href: ROUTES.adminWallets,

        icon: Wallet,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "SUPPORT_MANAGER", "SUPPORT", "COMPLIANCE"],

      },

      {

        id: "deposits",

        href: ROUTES.adminDeposits,

        icon: ArrowDownToLine,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "SUPPORT_MANAGER", "COMPLIANCE"],

      },

      {

        id: "withdrawals",

        href: ROUTES.adminWithdrawals,

        icon: ArrowUpFromLine,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "COMPLIANCE", "SUPPORT_MANAGER"],

      },

      {

        id: "revenue",

        href: ROUTES.adminRevenue,

        icon: CircleDollarSign,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],

      },

      {

        id: "platformRevenue",

        href: ROUTES.adminPlatformRevenue,

        icon: BadgePercent,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],

      },

    ],

  },

  {

    id: "market",

    items: [

      {

        id: "secondaryMarket",

        href: ROUTES.adminSecondaryMarket,

        icon: Store,

        roles: ["SUPER_ADMIN", "ADMIN", "COMPLIANCE", "ACCOUNTANT", "SUPPORT_MANAGER"],

      },

    ],

  },

  {

    id: "operations",

    items: [

      {

        id: "support",

        href: ROUTES.adminSupport,

        icon: Headphones,

        roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT_MANAGER", "SUPPORT"],

      },

      {

        id: "disputes",

        href: ROUTES.adminDisputes,

        icon: Scale,

        roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT_MANAGER", "SUPPORT", "COMPLIANCE"],

      },

      {

        id: "kyc",

        href: ROUTES.adminKyc,

        icon: ShieldCheck,

        roles: ["SUPER_ADMIN", "ADMIN", "COMPLIANCE"],

      },

      {

        id: "compliance",

        href: ROUTES.adminCompliance,

        icon: Shield,

        roles: ["SUPER_ADMIN", "ADMIN", "COMPLIANCE"],

      },

      {

        id: "referrals",

        href: ROUTES.adminReferrals,

        icon: Handshake,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "COMPLIANCE", "BUSINESS_ANALYST", "SUPPORT_MANAGER"],

      },

      {

        id: "legal",

        href: ROUTES.adminLegal,

        icon: ScrollText,

        roles: ["SUPER_ADMIN", "ADMIN", "COMPLIANCE", "BUSINESS_ANALYST", "CONTENT_MANAGER"],

      },

      {

        id: "treasury",

        href: ROUTES.adminTreasury,

        icon: CircleDollarSign,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "COMPLIANCE", "BUSINESS_ANALYST"],

      },

      {

        id: "reports",

        href: ROUTES.adminReports,

        icon: FileChartColumn,

        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "CONTENT_MANAGER"],

      },

    ],

  },

  {

    id: "analytics",

    items: [

      {

        id: "analyticsOverview",

        href: ROUTES.adminAnalytics,

        icon: BarChart3,

        roles: [

          "SUPER_ADMIN",

          "ADMIN",

          "BUSINESS_ANALYST",

          "ACCOUNTANT",

          "CONTENT_MANAGER",

          "COMPLIANCE",

          "SUPPORT_MANAGER",

          "SUPPORT",

        ],

      },

      {

        id: "analyticsFinance",

        href: ROUTES.adminAnalyticsFinance,

        icon: CircleDollarSign,

        roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "ACCOUNTANT"],

      },

      {

        id: "analyticsUsers",

        href: ROUTES.adminAnalyticsUsers,

        icon: Users,

        roles: [

          "SUPER_ADMIN",

          "ADMIN",

          "BUSINESS_ANALYST",

          "ACCOUNTANT",

          "CONTENT_MANAGER",

          "COMPLIANCE",

          "SUPPORT_MANAGER",

        ],

      },

      {

        id: "analyticsTracks",

        href: ROUTES.adminAnalyticsTracks,

        icon: Music2,

        roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "CONTENT_MANAGER"],

      },

      {

        id: "analyticsMarket",

        href: ROUTES.adminAnalyticsMarket,

        icon: Store,

        roles: [

          "SUPER_ADMIN",

          "ADMIN",

          "BUSINESS_ANALYST",

          "ACCOUNTANT",

          "COMPLIANCE",

          "SUPPORT_MANAGER",

        ],

      },

      {

        id: "analyticsRevenue",

        href: ROUTES.adminAnalyticsRevenue,

        icon: CircleDollarSign,

        roles: ["SUPER_ADMIN", "ADMIN", "BUSINESS_ANALYST", "ACCOUNTANT"],

      },

      {

        id: "analyticsRisk",

        href: ROUTES.adminAnalyticsRisk,

        icon: Shield,

        roles: [

          "SUPER_ADMIN",

          "ADMIN",

          "BUSINESS_ANALYST",

          "COMPLIANCE",

          "ACCOUNTANT",

          "SUPPORT_MANAGER",

        ],

      },

      {

        id: "analyticsOperations",

        href: ROUTES.adminAnalyticsOperations,

        icon: Headphones,

        roles: [

          "SUPER_ADMIN",

          "ADMIN",

          "BUSINESS_ANALYST",

          "SUPPORT_MANAGER",

          "SUPPORT",

          "COMPLIANCE",

        ],

      },

    ],

  },

  {

    id: "system",

    items: [

      {

        id: "settings",

        href: ROUTES.adminSettings,

        icon: Settings,

        roles: ["SUPER_ADMIN", "ADMIN"],

      },

      {

        id: "systemStatus",

        href: ROUTES.adminSystemStatus,

        icon: Activity,

        roles: ["SUPER_ADMIN", "ADMIN"],

      },

      {

        id: "notifications",

        href: ROUTES.adminNotifications,

        icon: Bell,

      },

      {

        id: "updates",

        href: ROUTES.adminUpdates,

        icon: RefreshCw,

      },

    ],

  },

];



/** Flat list for breadcrumbs / legacy */

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);



const SUPER_ADMIN_ALIASES = new Set<StaffRoleCode>(["SUPER_ADMIN", "ADMIN"]);



function sectionForAccess(item: AdminNavItem): AdminSectionId {

  return item.accessAs ?? item.id;

}



const SECTION_TO_MATRIX: Partial<Record<AdminSectionId, AdminMatrixSection>> = {
  dashboard: "dashboard",
  operatorTasks: "operatorTasks",
  riskSignals: "compliance",
  users: "users",
  roles: "roles",
  audit: "audit",
  tracks: "tracks",
  artists: "tracks",
  genres: "tracks",
  labels: "tracks",
  rounds: "rounds",
  holdings: "holdings",
  news: "news",
  helpCenter: "helpCenter",
  wallets: "wallets",
  deposits: "deposits",
  withdrawals: "withdrawals",
  revenue: "revenue",
  platformRevenue: "platformRevenue",
  secondaryMarket: "secondaryMarket",
  marketTrades: "secondaryMarket",
  marketSuspicious: "secondaryMarket",
  support: "support",
  disputes: "disputes",
  compliance: "compliance",
  kyc: "compliance",
  referrals: "referrals",
  legal: "legal",
  treasury: "treasury",
  reports: "reports",
  settings: "settings",
  systemStatus: "systemStatus",
  notifications: "notifications",
  updates: "updates",
  analyticsOverview: "analytics",
  analyticsFinance: "analytics",
  analyticsUsers: "analytics",
  analyticsTracks: "analytics",
  analyticsMarket: "analytics",
  analyticsRevenue: "analytics",
  analyticsRisk: "analytics",
  analyticsOperations: "analytics",
};

export function canAccessAdminSection(
  sectionId: AdminSectionId,
  userRoles: string[] | undefined,
): boolean {
  if (!userRoles?.length) return false;
  const matrixSection = SECTION_TO_MATRIX[sectionId];
  if (!matrixSection) return false;
  return effectiveMatrixLevel(userRoles, matrixSection) !== "none";
}



export function getVisibleAdminNavGroups(userRoles: string[] | undefined): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.href.startsWith("#")) return false;
      return canAccessAdminSection(sectionForAccess(item), userRoles);
    }),
  })).filter((g) => g.items.length > 0);
}



export function getVisibleAdminNav(userRoles: string[] | undefined): AdminNavItem[] {

  return getVisibleAdminNavGroups(userRoles).flatMap((g) => g.items);

}



export function adminSectionFromPathname(pathname: string): AdminSectionId {

  if (pathname === ROUTES.systemStatus) return "systemStatus";

  if (pathname.startsWith(ROUTES.adminAnalyticsFinance)) return "analyticsFinance";

  if (pathname.startsWith(ROUTES.adminAnalyticsUsers)) return "analyticsUsers";

  if (pathname.startsWith(ROUTES.adminAnalyticsTracks)) return "analyticsTracks";

  if (pathname.startsWith(ROUTES.adminAnalyticsMarket)) return "analyticsMarket";

  if (pathname.startsWith(ROUTES.adminAnalyticsRevenue)) return "analyticsRevenue";

  if (pathname.startsWith(ROUTES.adminAnalyticsRisk)) return "analyticsRisk";

  if (pathname.startsWith(ROUTES.adminAnalyticsOperations)) return "analyticsOperations";

  if (pathname === ROUTES.adminAnalytics || pathname.startsWith(`${ROUTES.adminAnalytics}/`)) {

    return "analyticsOverview";

  }

  const match = ADMIN_NAV_ITEMS.find((item) => {

    if (item.href.startsWith("#")) return false;

    const base = item.href.split("?")[0]!;

    return pathname === base || pathname.startsWith(`${base}/`);

  });

  return match ? sectionForAccess(match) : "dashboard";

}


