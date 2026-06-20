import { ROUTES } from "@/constants/routes";
import { formatUsdtAmount } from "@/features/admin/lib/admin-format";
import { parseAnalyticsMoney } from "@/features/admin/analytics/hooks/use-analytics-period";
import type { AnalyticsInsightItem } from "@/features/admin/analytics/components/admin-analytics-insights-panel";
import { ADMIN_ANALYTICS_MESSAGES } from "@/lib/i18n/admin-analytics-messages";
import type { AppLocale } from "@/lib/i18n/types";

export type ChartEmptyVariant = "finance" | "users" | "market" | "risk" | "support" | "revenue" | "default";

function msg(locale: AppLocale, key: string, fallback?: string): string {
  return ADMIN_ANALYTICS_MESSAGES[locale][key] ?? ADMIN_ANALYTICS_MESSAGES.ru[key] ?? fallback ?? key;
}

export function chartEmptyState(
  variant: ChartEmptyVariant,
  locale: AppLocale = "ru",
): { title: string; description: string } {
  return {
    title: msg(locale, `admin.analytics.chartEmpty.${variant}.title`),
    description: msg(locale, `admin.analytics.chartEmpty.${variant}.description`),
  };
}

const CHART_VARIANTS: ChartEmptyVariant[] = [
  "finance",
  "users",
  "market",
  "risk",
  "support",
  "revenue",
  "default",
];

/** @deprecated Use chartEmptyState(variant, locale) from client components */
export const CHART_EMPTY_STATES: Record<
  ChartEmptyVariant,
  { title: string; description: string }
> = Object.fromEntries(
  CHART_VARIANTS.map((v) => [v, chartEmptyState(v, "ru")]),
) as Record<ChartEmptyVariant, { title: string; description: string }>;

export function kpiTooltipsForLocale(locale: AppLocale = "ru") {
  return {
    deposits: msg(locale, "admin.analytics.kpi.deposits"),
    withdrawals: msg(locale, "admin.analytics.kpi.withdrawals"),
    netFlow: msg(locale, "admin.analytics.kpi.netFlow"),
    platformRevenue: msg(locale, "admin.analytics.kpi.platformRevenue"),
    pendingWithdrawals: msg(locale, "admin.analytics.kpi.pendingWithdrawals"),
    newUsers: msg(locale, "admin.analytics.kpi.newUsers"),
    activeUsers: msg(locale, "admin.analytics.kpi.activeUsers"),
    firstDeposit: msg(locale, "admin.analytics.kpi.firstDeposit"),
    firstPurchase: msg(locale, "admin.analytics.kpi.firstPurchase"),
    marketVolume: msg(locale, "admin.analytics.kpi.marketVolume"),
    tradesCount: msg(locale, "admin.analytics.kpi.tradesCount"),
    activeListings: msg(locale, "admin.analytics.kpi.activeListings"),
    avgPrice: msg(locale, "admin.analytics.kpi.avgPrice"),
    openFlags: msg(locale, "admin.analytics.kpi.openFlags"),
    criticalRisk: msg(locale, "admin.analytics.kpi.criticalRisk"),
    openTickets: msg(locale, "admin.analytics.kpi.openTickets"),
    overdueSla: msg(locale, "admin.analytics.kpi.overdueSla"),
    lockedBalance: msg(locale, "admin.analytics.kpi.lockedBalance"),
  } as const;
}

/** @deprecated Use kpiTooltipsForLocale(locale) */
export const KPI_TOOLTIPS = kpiTooltipsForLocale("ru");

export function buildExecutiveSummary(
  input: {
    hasActivity: boolean;
    finance?: { depositsUsdt?: string; withdrawalsUsdt?: string; netFlowUsdt?: string } | null;
    market?: { completedTrades?: number; volumeUsdt?: string } | null;
    risk?: { openFlags?: number; criticalCount?: number } | null;
    support?: { openTickets?: number } | null;
  },
  locale: AppLocale = "ru",
): { tone: "neutral" | "positive" | "warning"; title: string; body: string } {
  if (!input.hasActivity) {
    return {
      tone: "neutral",
      title: msg(locale, "admin.analytics.summary.platformState"),
      body: msg(locale, "admin.analytics.summary.noActivity"),
    };
  }

  const parts: string[] = [];
  const dep = parseFloat((input.finance?.depositsUsdt ?? "0").replace(/\s/g, "").replace(",", "."));
  const wd = parseFloat((input.finance?.withdrawalsUsdt ?? "0").replace(/\s/g, "").replace(",", "."));
  if (dep > wd && dep > 0) {
    parts.push(
      msg(locale, "admin.analytics.summary.depositsExceed").replace(
        "{amount}",
        formatUsdtAmount(String(dep - wd)),
      ),
    );
  } else if (wd > dep && wd > 0) {
    parts.push(msg(locale, "admin.analytics.summary.withdrawalsExceed"));
  }
  if ((input.risk?.openFlags ?? 0) > 0) {
    const criticalSuffix = input.risk?.criticalCount
      ? msg(locale, "admin.analytics.summary.criticalSuffix").replace(
          "{count}",
          String(input.risk.criticalCount),
        )
      : "";
    parts.push(
      msg(locale, "admin.analytics.summary.openRiskFlags")
        .replace("{count}", String(input.risk!.openFlags))
        .replace("{critical}", criticalSuffix),
    );
  }
  if ((input.market?.completedTrades ?? 0) > 0) {
    parts.push(
      msg(locale, "admin.analytics.summary.marketTrades")
        .replace("{count}", String(input.market!.completedTrades))
        .replace("{volume}", formatUsdtAmount(input.market?.volumeUsdt ?? "0")),
    );
  }
  if ((input.support?.openTickets ?? 0) > 0) {
    parts.push(
      msg(locale, "admin.analytics.summary.supportOpen").replace(
        "{count}",
        String(input.support!.openTickets),
      ),
    );
  }

  const critical = (input.risk?.criticalCount ?? 0) > 0 || (input.support?.openTickets ?? 0) > 10;
  return {
    tone: critical ? "warning" : "positive",
    title: critical
      ? msg(locale, "admin.analytics.summary.needsAttention")
      : msg(locale, "admin.analytics.summary.platformState"),
    body: parts.length ? parts.join(" ") : msg(locale, "admin.analytics.summary.noCritical"),
  };
}

export function feeCodeLabel(code: string, locale: AppLocale = "ru"): string {
  const map: Record<string, string> = {
    PRIMARY_PURCHASE: msg(locale, "admin.analytics.fee.primaryPurchase"),
    WITHDRAWAL: msg(locale, "admin.analytics.fee.withdrawal"),
    SECONDARY_TRADE: msg(locale, "admin.analytics.fee.secondaryTrade"),
  };
  return map[code] ?? code.replace(/_/g, " ").toLowerCase();
}

export function buildAnalyticsAttentionItems(
  input: {
    finance?: {
      pendingWithdrawalsUsdt?: string;
      manualReviewDeposits?: number;
    } | null;
    risk?: {
      openFlags?: number;
      criticalCount?: number;
      highSeverity?: number;
      highCount?: number;
      frozenOperations?: number;
    } | null;
    support?: { openTickets?: number; escalatedTickets?: number; overdueSla?: number } | null;
    reportsFailed?: number;
    tasks?: Array<{ id: string; label: string; count?: number; href: string; priority?: string }>;
  },
  locale: AppLocale = "ru",
): AnalyticsInsightItem[] {
  const items: AnalyticsInsightItem[] = [];
  const pendingWd = parseAnalyticsMoney(input.finance?.pendingWithdrawalsUsdt ?? "0");
  if (pendingWd > 0) {
    items.push({
      id: "pending-wd",
      label: msg(locale, "admin.analytics.attention.pendingWithdrawals"),
      count: undefined,
      href: `${ROUTES.adminWithdrawals}?status=requested`,
      priority: "high",
    });
  }
  if ((input.finance?.manualReviewDeposits ?? 0) > 0) {
    items.push({
      id: "manual-deposits",
      label: msg(locale, "admin.analytics.attention.manualDeposits"),
      count: input.finance!.manualReviewDeposits,
      href: `${ROUTES.adminDeposits}?status=manual_review`,
      priority: "high",
    });
  }
  const critical = input.risk?.criticalCount ?? 0;
  const highSev = input.risk?.highSeverity ?? input.risk?.highCount ?? 0;
  if (critical > 0) {
    items.push({
      id: "critical-risk",
      label: msg(locale, "admin.analytics.attention.criticalRisk"),
      count: critical,
      href: `${ROUTES.adminCompliance}?severity=critical`,
      priority: "high",
    });
  } else if (highSev > 0) {
    items.push({
      id: "high-risk",
      label: msg(locale, "admin.analytics.attention.highRisk"),
      count: highSev,
      href: ROUTES.adminCompliance,
      priority: "high",
    });
  } else if ((input.risk?.openFlags ?? 0) > 0) {
    items.push({
      id: "open-risk",
      label: msg(locale, "admin.analytics.attention.openRisk"),
      count: input.risk!.openFlags,
      href: ROUTES.adminCompliance,
      priority: "medium",
    });
  }
  if ((input.risk?.frozenOperations ?? 0) > 0) {
    items.push({
      id: "frozen-ops",
      label: msg(locale, "admin.analytics.attention.frozenOps"),
      count: input.risk!.frozenOperations,
      href: ROUTES.adminCompliance,
      priority: "high",
    });
  }
  if ((input.support?.openTickets ?? 0) > 0) {
    items.push({
      id: "support-open",
      label: msg(locale, "admin.analytics.attention.supportOpen"),
      count: input.support!.openTickets,
      href: ROUTES.adminSupport,
      priority: "medium",
    });
  }
  if ((input.support?.overdueSla ?? 0) > 0) {
    items.push({
      id: "support-sla",
      label: msg(locale, "admin.analytics.attention.overdueSla"),
      count: input.support!.overdueSla,
      href: ROUTES.adminSupport,
      priority: "high",
    });
  }
  if ((input.reportsFailed ?? 0) > 0) {
    items.push({
      id: "reports-failed",
      label: msg(locale, "admin.analytics.attention.reportsFailed"),
      count: input.reportsFailed,
      href: ROUTES.adminReports,
      priority: "high",
    });
  }
  for (const t of input.tasks ?? []) {
    if ((t.count ?? 0) > 0 && !items.some((i) => i.href === t.href)) {
      items.push({
        id: t.id,
        label: t.label,
        count: t.count,
        href: t.href,
        priority: t.priority === "high" ? "high" : "medium",
      });
    }
  }
  return items;
}
