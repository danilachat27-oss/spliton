"use client";

import Link from "next/link";
import { ChevronRight, Shield } from "@/lib/lucide";

import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import { ROUTES } from "@/constants/routes";
import { useI18n } from "@/components/providers/i18n-provider";
import { kycStatusLabel, securityLevelLabel } from "@/lib/profile/overview-labels";
import type { AccountCenterSummary } from "@/services/user-me.service";
import { cn } from "@/lib/utils";

import { ProfileScoreRing } from "./profile-shared";
import { profileCardClass, profileMutedCardClass } from "./profile-ui";

type Props = {
  accountCenter: AccountCenterSummary | null;
  live: boolean;
};

export function ProfileOverviewSidebar({ accountCenter, live }: Props) {
  const { locale, t } = useI18n();
  const security = accountCenter?.security;
  const verification = accountCenter?.verification;

  const securityScore = security?.score ?? 0;
  const securityMax = security?.maxScore ?? 100;
  const unread = accountCenter?.activity.unreadNotificationsCount ?? 0;

  return (
    <aside className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:sticky lg:top-[calc(var(--profile-sticky-offset,7rem)+0.5rem)]">
      <section className={profileCardClass}>
        <div className="flex items-start gap-4">
          <ProfileScoreRing
            score={live && security ? securityScore : 0}
            maxScore={securityMax}
            label={t("profile.security.score.ringOf")}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">
              {t("profile.overview.securityCard.title")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              {live && security
                ? securityLevelLabel(security.level, locale)
                : t("profile.overview.securityCard.demo")}
            </p>
            <Link
              href={profileDashboardHref("security")}
              className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-neutral-900 hover:text-neutral-600"
            >
              {t("profile.overview.securityImprove")}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {live && verification ? (
        <section className={profileMutedCardClass}>
          <p className="text-sm font-semibold text-neutral-900">
            {t("profile.overview.placeholder.titleVerification")}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {kycStatusLabel(verification.status, locale)}
          </p>
          <Link
            href={profileDashboardHref("verification")}
            className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-neutral-900 hover:text-neutral-600"
          >
            {t("profile.overview.verificationCard.cta")}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      ) : null}

      <section className={profileCardClass}>
        <p className="text-sm font-semibold text-neutral-900">{t("profile.overview.sidebar.newsTitle")}</p>
        <ul className="mt-3 space-y-3">
          <li>
            <p className="text-[11px] text-neutral-400">{t("profile.overview.sidebar.newsItem1Date")}</p>
            <p className="mt-0.5 text-xs leading-snug text-neutral-700">
              {t("profile.overview.sidebar.newsItem1Title")}
            </p>
          </li>
          <li>
            <p className="text-[11px] text-neutral-400">{t("profile.overview.sidebar.newsItem2Date")}</p>
            <p className="mt-0.5 text-xs leading-snug text-neutral-700">
              {t("profile.overview.sidebar.newsItem2Title")}
            </p>
          </li>
        </ul>
      </section>

      <section className={cn(profileMutedCardClass, "py-3.5")}>
        <Link
          href={ROUTES.dashboardSupport}
          className="flex items-center justify-between gap-3 text-sm text-neutral-800 transition hover:text-neutral-950"
        >
          <span className="inline-flex items-center gap-2">
            <Shield className="size-4 text-neutral-400" aria-hidden />
            {t("profile.overview.quickActions.support")}
          </span>
          <ChevronRight className="size-4 shrink-0 text-neutral-400" aria-hidden />
        </Link>
        {unread > 0 ? (
          <Link
            href={ROUTES.dashboardNotifications}
            className="mt-2 flex items-center justify-between gap-3 border-t border-neutral-200/80 pt-3 text-sm text-neutral-800 transition hover:text-neutral-950"
          >
            <span>{t("profile.overview.supportCard.notifications")}</span>
            <span className="rounded-full bg-[#B7F500]/20 px-2 py-0.5 text-xs font-semibold tabular-nums text-neutral-900">
              {unread}
            </span>
          </Link>
        ) : null}
      </section>
    </aside>
  );
}
