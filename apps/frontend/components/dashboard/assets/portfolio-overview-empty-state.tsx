"use client";

import Link from "next/link";
import { Wallet } from "@/lib/lucide";

import { assetsCardClass, assetsPrimaryButtonClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function PortfolioOverviewEmptyState() {
  const { t } = useI18n();

  return (
    <section className={cn(assetsCardClass, "py-12 text-center sm:py-14")}>
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
          <Wallet className="size-8" strokeWidth={1.25} aria-hidden />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
          {t("assets.overview.portfolioEmptyTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {t("assets.overview.portfolioEmptyBodyExtended")}
        </p>
        <Link
          href="/assets/payouts/deposit"
          className={cn(assetsPrimaryButtonClass, "mt-6 h-11 w-full max-w-xs")}
        >
          {t("overview.deposit")}
        </Link>
        <Link
          href={ROUTES.dashboardCatalog}
          className="mt-3 text-sm font-medium text-neutral-500 transition hover:text-neutral-800"
        >
          {t("overview.openCatalog")}
        </Link>
      </div>
    </section>
  );
}
