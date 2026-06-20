"use client";



import * as React from "react";



import { landingSectionTitle } from "@/components/dashboard/dashboard-stats";

import { useAuth } from "@/components/providers/auth-provider";

import { useI18n } from "@/components/providers/i18n-provider";

import { cn } from "@/lib/utils";

import { fetchOnboarding, type OnboardingState } from "@/services/onboarding.service";

import { getWalletDataSource } from "@/services/wallet.service";



/** Демо на лендинге кабинета, когда API недоступен или чеклист закрыт. */

const LANDING_ONBOARDING_DEMO_PROGRESS = 40;



export function OnboardingChecklistCard({ className }: { className?: string }) {

  const { t } = useI18n();

  const { authorizedFetch, isAuthenticated } = useAuth();

  const live = getWalletDataSource() === "live";

  const [data, setData] = React.useState<OnboardingState | null>(null);

  const [loading, setLoading] = React.useState(false);



  React.useEffect(() => {

    if (!live || !isAuthenticated) return;

    setLoading(true);

    void fetchOnboarding(authorizedFetch)

      .then(setData)

      .catch(() => setData(null))

      .finally(() => setLoading(false));

  }, [authorizedFetch, isAuthenticated, live]);



  const activeData = data && !data.completed && !data.dismissed ? data : null;

  const progressPct =

    activeData?.progressPct ??

    (live && isAuthenticated ? 0 : LANDING_ONBOARDING_DEMO_PROGRESS);



  if (loading && live && isAuthenticated && !data) {

    return (

      <section className={cn("space-y-4 pb-2", className)} aria-busy="true">

        <div className="flex animate-pulse items-center justify-between gap-4">

          <div className="h-7 w-52 max-w-full rounded bg-neutral-200/80" />

          <div className="h-5 w-10 rounded bg-neutral-200/80" />

        </div>

        <div className="h-1.5 rounded-full bg-neutral-200/80" />

      </section>

    );

  }



  return (

    <section className={cn("space-y-4 pb-2", className)} aria-label={t("dashboard.onboarding.ariaLabel")}>

      <div className="flex items-center justify-between gap-4">

        <h2 className={landingSectionTitle}>{t("dashboard.onboarding.title")}</h2>

        <p className="font-mono text-sm font-semibold tabular-nums text-neutral-900">{progressPct}%</p>

      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200/80">

        <div

          className="h-full rounded-full bg-neutral-900 transition-all duration-500"

          style={{ width: `${progressPct}%` }}

          role="progressbar"

          aria-valuenow={progressPct}

          aria-valuemin={0}

          aria-valuemax={100}

        />

      </div>

    </section>

  );

}

