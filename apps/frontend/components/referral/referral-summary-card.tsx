"use client";

import Link from "next/link";
import { ArrowUpRight } from "@/lib/lucide";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  landingSectionStack,
  landingSectionTitle,
  landingStatGrid,
  landingStatTile,
} from "@/components/dashboard/dashboard-stats";
import { referralProgramStats } from "@/components/referral/referral-mock-data";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { getWalletDataSource } from "@/lib/public-env";
import { cn } from "@/lib/utils";
import { fetchReferralMe, type ReferralMe } from "@/services/referrals.service";

function StatSkeleton() {
  return (
    <div className={landingStatGrid}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn(landingStatTile, "animate-pulse space-y-3")}>
          <div className="h-2.5 w-20 rounded bg-neutral-100" />
          <div className="h-7 w-16 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

function ReferralMetricsGrid({ metrics }: { metrics: { label: string; value: string }[] }) {
  return (
    <div className={landingStatGrid}>
      {metrics.map((item) => (
        <article key={item.label} className={landingStatTile}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 sm:tracking-[0.14em]">
            {item.label}
          </p>
          <p className="mt-2 font-mono text-base font-semibold tabular-nums tracking-tight text-neutral-900 sm:mt-3 sm:text-xl">
            {item.value}
          </p>
        </article>
      ))}
    </div>
  );
}

function metricsFromMe(me: ReferralMe, t: (key: string) => string) {
  return [
    { label: t("dashboard.referralSummary.metric.invited"), value: String(me.invitedUsersCount) },
    { label: t("dashboard.referralSummary.metric.active"), value: String(me.activeInvitedUsersCount) },
    { label: t("dashboard.referralSummary.metric.pending"), value: `${me.pendingRewards} USDT` },
    { label: t("dashboard.referralSummary.metric.paid"), value: `${me.paidRewards} USDT` },
  ];
}

export function ReferralSummaryCard({ className }: { className?: string }) {
  const { t } = useI18n();
  const live = getWalletDataSource() === "live";
  const { user, authorizedFetch } = useAuth();
  const [me, setMe] = useState<ReferralMe | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const landingReferralDemoMetrics = useMemo(
    () => [
      { label: t("dashboard.referralSummary.metric.invited"), value: String(referralProgramStats.invitedUsers) },
      { label: t("dashboard.referralSummary.metric.active"), value: String(referralProgramStats.activeReferrals) },
      {
        label: t("dashboard.referralSummary.metric.pending"),
        value: `${referralProgramStats.pendingRewardsUsdt.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} USDT`,
      },
      {
        label: t("dashboard.referralSummary.metric.paid"),
        value: `${referralProgramStats.earnedRewardsTotalUsdt.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} USDT`,
      },
    ],
    [t],
  );

  useEffect(() => {
    if (!live || !user) {
      setMe(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    void fetchReferralMe(authorizedFetch)
      .then(setMe)
      .catch((e) => {
        setMe(null);
        setLoadError(e instanceof Error ? e.message : t("dashboard.referralSummary.error.loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [authorizedFetch, live, t, user]);

  let body: ReactNode;

  if (!live) {
    body = <ReferralMetricsGrid metrics={landingReferralDemoMetrics} />;
  } else if (!user) {
    body = (
      <p className="rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 ring-1 ring-neutral-100">
        <Link href={ROUTES.login} className="font-semibold text-neutral-900 underline-offset-4 hover:underline">
          {t("dashboard.referralSummary.signIn")}
        </Link>
        {t("dashboard.referralSummary.signInPrompt")}
      </p>
    );
  } else if (loading) {
    body = <StatSkeleton />;
  } else if (loadError) {
    body = (
      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        {loadError}
      </p>
    );
  } else if (me) {
    body = <ReferralMetricsGrid metrics={metricsFromMe(me, t)} />;
  } else {
    body = (
      <p className="rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 ring-1 ring-neutral-100">
        {t("dashboard.referralSummary.unavailableBefore")}{" "}
        <Link href={ROUTES.referralProgram} className="font-semibold text-neutral-900 underline-offset-4 hover:underline">
          {t("dashboard.referralSummary.programLink")}
        </Link>
        {t("dashboard.referralSummary.unavailableAfter")}
      </p>
    );
  }

  return (
    <section className={cn(landingSectionStack, className)} aria-label={t("dashboard.referralSummary.ariaLabel")}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className={landingSectionTitle}>{t("dashboard.referralSummary.title")}</h2>
        <Link
          href={ROUTES.referralProgram}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-neutral-900 underline-offset-4 hover:underline"
        >
          {t("dashboard.referralSummary.open")}
          <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
        </Link>
      </header>
      {body}
    </section>
  );
}
