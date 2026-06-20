"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpRight } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { ROUTES } from "@/constants/routes";
import { useDashboardLandingStats } from "@/hooks/use-dashboard-landing-stats";
import { cn } from "@/lib/utils";

/** Shared landing stat blocks (referral + liquidity summary). */
export const landingStatTile =
  "flex h-full min-h-[104px] flex-col rounded-2xl bg-white px-4 py-4 sm:min-h-[120px] sm:px-6 sm:py-6";

export const landingSectionTitle =
  "text-xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]";

export const landingSectionStack = "space-y-4 sm:space-y-6";

export const landingStatGrid =
  "grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6";

function StatTrendBadge({
  trend,
  change,
  t,
}: {
  trend: "up" | "down";
  change: string;
  t: (key: string) => string;
}) {
  const up = trend === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        up ? "text-emerald-700" : "text-rose-700",
      )}
      aria-label={up ? t("dashboard.stats.trend.up") : t("dashboard.stats.trend.down")}
    >
      {up ? (
        <ArrowUp className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      ) : (
        <ArrowDown className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
      )}
      {change}
    </span>
  );
}

function StatsSkeleton() {
  return (
    <div className={landingStatGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn(landingStatTile, "min-h-[120px] animate-pulse sm:min-h-[156px]")}>
          <div className="h-2.5 w-24 rounded bg-neutral-100" />
          <div className="mt-4 h-7 w-32 rounded bg-neutral-100" />
          <div className="mt-auto h-8 w-full rounded bg-neutral-50" />
        </div>
      ))}
    </div>
  );
}

export function DashboardStats({ className }: { className?: string }) {
  const { t } = useI18n();
  const { stats, loading, live, fetchError, reload } = useDashboardLandingStats(
    ROUTES.dashboardPayoutsHistory,
    t("dashboard.stats.withdrawLink"),
  );

  return (
    <section id="holdings" className={cn("relative z-10 scroll-mt-24", landingSectionStack, className)}>
      <header>
        <h2 className={landingSectionTitle}>{t("dashboard.stats.title")}</h2>
      </header>

      {!live ? (
        <p className="text-xs text-neutral-500" role="status">
          {t("dashboard.stats.demoNotice")}
        </p>
      ) : null}

      {fetchError ? (
        <ReadOnlySectionError
          sectionId="dashboard-landing-stats"
          error={fetchError}
          onRetry={reload}
          retryLabel={t("dashboard.stats.retry")}
        />
      ) : null}

      {loading ? (
        <StatsSkeleton />
      ) : fetchError ? null : stats.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("dashboard.stats.empty")}</p>
      ) : (
        <div className={landingStatGrid} aria-label={t("dashboard.stats.ariaLabel")}>
          {stats.map((s) => (
            <article key={s.label} className={cn(landingStatTile, "min-h-[120px] sm:min-h-[156px]")}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 sm:tracking-[0.14em]">
                {s.label}
              </p>
              <div className="mt-2 flex flex-col gap-1 sm:mt-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-2 sm:gap-y-1">
                <p className="font-mono text-base font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-xl">
                  {s.value}
                </p>
                <StatTrendBadge trend={s.trend} change={s.change} t={t} />
              </div>
              <p className="mt-auto pt-3 text-xs leading-relaxed text-neutral-500">{s.hint}</p>
              {s.href && s.hrefLabel ? (
                <Link
                  href={s.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 underline-offset-4 hover:underline"
                >
                  {s.hrefLabel}
                  <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
