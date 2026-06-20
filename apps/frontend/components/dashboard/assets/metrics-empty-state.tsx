"use client";

import Link from "next/link";

import { assetsCardClass, assetsPrimaryButtonClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function MetricsEmptyState() {
  const { t } = useI18n();

  return (
    <section className={cn(assetsCardClass, "py-12 text-center sm:py-14")}>
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
        {t("assets.metrics.emptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
        {t("assets.metrics.emptyBody")}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href={ROUTES.dashboardCatalog} className={assetsPrimaryButtonClass}>
          {t("overview.openCatalog")}
        </Link>
      </div>
    </section>
  );
}
