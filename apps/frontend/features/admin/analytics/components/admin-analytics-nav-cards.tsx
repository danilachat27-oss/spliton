"use client";

import Link from "next/link";
import {
  BarChart3,
  Coins,
  Headphones,
  LineChart,
  ShieldAlert,
  TrendingUp,
  Users,
  type LucideIcon,
} from "@/lib/lucide";

import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { cn } from "@/lib/utils";
import {
  getVisibleAnalyticsNav,
  type AnalyticsSectionId,
} from "@/features/admin/analytics/config/analytics-nav";
import { useAuth } from "@/components/providers/auth-provider";

const NAV_HINT_KEYS: Partial<Record<AnalyticsSectionId, string>> = {
  analyticsOverview: "admin.analytics.nav.overview.hint",
  analyticsFinance: "admin.analytics.nav.finance.hint",
  analyticsUsers: "admin.analytics.nav.users.hint",
  analyticsTracks: "admin.analytics.nav.tracks.hint",
  analyticsMarket: "admin.analytics.nav.market.hint",
  analyticsRevenue: "admin.analytics.nav.revenue.hint",
  analyticsRisk: "admin.analytics.nav.risk.hint",
  analyticsOperations: "admin.analytics.nav.operations.hint",
};

const NAV_ICONS: Partial<Record<AnalyticsSectionId, LucideIcon>> = {
  analyticsOverview: BarChart3,
  analyticsFinance: Coins,
  analyticsUsers: Users,
  analyticsTracks: TrendingUp,
  analyticsMarket: LineChart,
  analyticsRevenue: Coins,
  analyticsRisk: ShieldAlert,
  analyticsOperations: Headphones,
};

type Props = {
  activeSection: AnalyticsSectionId;
  className?: string;
};

export function AdminAnalyticsNavCards({ activeSection, className }: Props) {
  const { user } = useAuth();
  const a = useAdminI18n();
  const nav = getVisibleAnalyticsNav(user?.roles);

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 scrollbar-thin",
        className,
      )}
    >
      {nav.map((item) => {
        const Icon = NAV_ICONS[item.id] ?? BarChart3;
        const hintKey = NAV_HINT_KEYS[item.id];
        const active = item.id === activeSection;
        const sectionLabel = a.adminSectionLabel(item.id);
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex min-w-[168px] shrink-0 flex-col gap-1 rounded-2xl border px-4 py-3 transition-all",
              active
                ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
                : "border-zinc-800/90 bg-zinc-900/80 text-zinc-200 hover:border-zinc-300 hover:shadow-sm",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-zinc-500")} />
              {sectionLabel}
            </span>
            {hintKey ? (
              <span className={cn("text-[11px] leading-snug", active ? "text-zinc-300" : "text-zinc-500")}>
                {a.t(hintKey)}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
