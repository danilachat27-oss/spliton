"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Eye, EyeOff, UserRound } from "@/lib/lucide";

import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { profileDashboardHref } from "@/constants/dashboard/profile-page";
import { ACCOUNT_CENTER_RELATED_ROUTES } from "@/constants/dashboard/account-center";
import { ROUTES } from "@/constants/routes";
import { ProfileHoldingsEmpty, ProfileHoldingsList } from "@/components/dashboard/profile/profile-holdings-list";
import { ProfileOverviewSidebar } from "@/components/dashboard/profile/profile-overview-sidebar";
import { ProfileSectionSkeleton } from "@/components/dashboard/profile/profile-section-skeleton";
import {
  profileCardClass,
  profilePrimaryButtonClass,
  profileSecondaryButtonClass,
} from "@/components/dashboard/profile/profile-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatUsdtRu } from "@/lib/wallet/format-money";
import { cn } from "@/lib/utils";
import {
  fetchUserMe,
  type AccountCenterSummary,
  type UserMeProfile,
} from "@/services/user-me.service";
import {
  fetchWalletSummary,
  listUserHoldings,
  type UserHoldingItem,
} from "@/services/wallet.service";
import { isAccountCenterDemoMode, isLiveAccountEnabled } from "@/lib/public-env";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 3)}***@${domain}`;
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_min(18.75rem,28vw)]" aria-busy="true">
      <div className="space-y-3 sm:space-y-4">
        <div className="h-20 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-56 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
      <div className="hidden space-y-3 lg:block">
        <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}

export function ProfileOverviewContent() {
  const { user, authorizedFetch, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const live = isLiveAccountEnabled() && isAuthenticated;
  const demo = isAccountCenterDemoMode();

  const [meProfile, setMeProfile] = useState<UserMeProfile | null>(null);
  const [accountCenter, setAccountCenter] = useState<AccountCenterSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState(live);
  const [profileError, setProfileError] = useState<unknown>(null);

  const [balanceHidden, setBalanceHidden] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<UserHoldingItem[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [walletLoadError, setWalletLoadError] = useState<unknown>(null);

  useEffect(() => {
    if (!live) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    void fetchUserMe(authorizedFetch)
      .then((me) => {
        setMeProfile(me);
        setAccountCenter(me.accountCenter ?? null);
      })
      .catch((e) => {
        setMeProfile(null);
        setAccountCenter(null);
        setProfileError(e);
      })
      .finally(() => setProfileLoading(false));
  }, [authorizedFetch, live, t]);

  useEffect(() => {
    if (!live) return;
    setWalletLoadError(null);
    setHoldingsLoading(true);
    void Promise.all([
      fetchWalletSummary(authorizedFetch),
      listUserHoldings(authorizedFetch),
    ])
      .then(([s, h]) => {
        setAvailableBalance(s.availableBalance);
        setHoldings(h.items);
      })
      .catch((e) => {
        setAvailableBalance(null);
        setHoldings([]);
        setWalletLoadError(e);
      })
      .finally(() => setHoldingsLoading(false));
  }, [authorizedFetch, live, t]);

  if (live && profileLoading) {
    return <OverviewSkeleton />;
  }

  const displayEmail = user?.email ? maskEmail(user.email) : "—";
  const displayName =
    meProfile?.profile?.displayName?.trim() ||
    (user?.email ? t("profile.overview.greeting").replace("{email}", displayEmail) : "—");
  const uidShort = user?.id ? `${user.id.slice(0, 8)}…` : "—";

  const balanceDisplay = balanceHidden
    ? "••••••"
    : live && availableBalance
      ? formatUsdtRu(availableBalance)
      : live && walletLoadError
        ? "—"
        : demo
          ? t("profile.overview.walletCard.demoBalance")
          : "—";

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4 [--profile-sticky-offset:7rem]">
      {demo ? <ProductDemoBanner messageKey="profile.overview.demoBanner" /> : null}

      {profileError ? (
        <ReadOnlySectionError
          sectionId="profile-overview"
          error={profileError}
          onRetry={() => {
            setProfileLoading(true);
            setProfileError(null);
            void fetchUserMe(authorizedFetch)
              .then((me) => {
                setMeProfile(me);
                setAccountCenter(me.accountCenter ?? null);
              })
              .catch((e) => {
                setMeProfile(null);
                setAccountCenter(null);
                setProfileError(e);
              })
              .finally(() => setProfileLoading(false));
          }}
        />
      ) : null}

      {live && !accountCenter && !profileError ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {t("profile.overview.accountSummaryUnavailable")}
        </p>
      ) : null}

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_min(18.75rem,28vw)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <section className={profileCardClass}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-neutral-100 sm:h-14 sm:w-14">
                <UserRound className="h-6 w-6 text-neutral-500 sm:h-7 sm:w-7" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
                  {displayName}
                </p>
                <p className="mt-0.5 font-mono text-xs text-neutral-500">UID: {uidShort}</p>
              </div>
              <Link
                href={profileDashboardHref("settings")}
                className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-neutral-900 transition hover:text-neutral-600"
              >
                {t("profile.overview.viewProfile")}
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          </section>

          <section className={profileCardClass}>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-neutral-600">{t("profile.overview.valuationLabel")}</p>
              <button
                type="button"
                onClick={() => setBalanceHidden((v) => !v)}
                className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                aria-label={balanceHidden ? t("profile.overview.showBalance") : t("profile.overview.hideBalance")}
              >
                {balanceHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="mt-2 text-[1.75rem] font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-[2rem]">
              {balanceDisplay}
            </p>
            {walletLoadError ? (
              <ReadOnlySectionError
                sectionId="profile-overview-wallet"
                error={walletLoadError}
                onRetry={() => {
                  setWalletLoadError(null);
                  setHoldingsLoading(true);
                  void Promise.all([
                    fetchWalletSummary(authorizedFetch),
                    listUserHoldings(authorizedFetch),
                  ])
                    .then(([s, h]) => {
                      setAvailableBalance(s.availableBalance);
                      setHoldings(h.items);
                    })
                    .catch((e) => {
                      setAvailableBalance(null);
                      setHoldings([]);
                      setWalletLoadError(e);
                    })
                    .finally(() => setHoldingsLoading(false));
                }}
                compact
              />
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`${ROUTES.dashboardPayouts}/deposit`}
                className={cn(profilePrimaryButtonClass, "text-xs")}
              >
                {t("profile.overview.quickActions.deposit")}
              </Link>
              <Link
                href={ROUTES.dashboardPayoutsHistory}
                className={cn(profileSecondaryButtonClass, "text-xs")}
              >
                {t("profile.overview.withdraw")}
              </Link>
              <Link href={ROUTES.dashboardCatalog} className={cn(profileSecondaryButtonClass, "text-xs")}>
                {t("profile.overview.quickActions.buy")}
              </Link>
            </div>

            <div className="mt-6 rounded-xl bg-neutral-50 px-4 py-10 text-center">
              <p className="text-sm text-neutral-500">{t("profile.overview.chartComingSoon")}</p>
              <Link
                href={ACCOUNT_CENTER_RELATED_ROUTES.walletOverview}
                className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-neutral-800 hover:text-neutral-950"
              >
                {t("profile.overview.assetsOverviewLink")}
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </section>

          {live ? (
            <section className={profileCardClass}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold tracking-tight text-neutral-900">
                  {t("profile.overview.holdingsLiveTitle")}
                </h2>
                <Link
                  href={ROUTES.dashboardPositions}
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950"
                >
                  {t("profile.overview.holdingsViewAll")}
                  <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              {holdingsLoading ? (
                <ProfileSectionSkeleton variant="list" rows={3} />
              ) : holdings.length === 0 ? (
                <ProfileHoldingsEmpty liveWallet />
              ) : (
                <ProfileHoldingsList liveWallet holdings={holdings} demoRows={[]} />
              )}
            </section>
          ) : null}
        </div>

        <ProfileOverviewSidebar accountCenter={accountCenter} live={live} />
      </div>
    </div>
  );
}
