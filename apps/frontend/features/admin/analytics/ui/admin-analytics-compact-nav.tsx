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

import { cn } from "@/lib/utils";
import {
  getVisibleAnalyticsNav,
  type AnalyticsSectionId,
} from "@/features/admin/analytics/config/analytics-nav";
import { useAuth } from "@/components/providers/auth-provider";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";

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

/** Компактная навигация между разделами аналитики (не карточки). */
export function AdminAnalyticsCompactNav({ activeSection, className }: Props) {
  const { user } = useAuth();
  const { t } = useAdminI18n();
  const nav = getVisibleAnalyticsNav(user?.roles);

  return (
    <nav
      aria-label={t("admin.analytics.compactNav.ariaLabel")}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-1 scrollbar-thin",
        className,
      )}
    >
      {nav.map((item) => {
        const Icon = NAV_ICONS[item.id] ?? BarChart3;
        const active = item.id === activeSection;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-zinc-900/80 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
            )}
          >
            <Icon className={cn("size-3.5 shrink-0", active ? "text-zinc-300" : "text-zinc-400")} />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
