"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

export function PositionsEmptyState() {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-2xl font-semibold text-neutral-900">{t("positions.title")}</h2>

      <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-neutral-300 text-neutral-500">
          !
        </div>
        <p className="text-xl font-semibold text-neutral-900">{t("positions.empty.inReleases")}</p>
        <p className="mt-1.5 max-w-xl text-sm text-neutral-500">{t("positions.empty.tableHint")}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`${ROUTES.dashboard}#deposit`}
            className="inline-flex h-10 items-center rounded-full bg-lime-600 px-4 text-sm font-semibold text-white transition hover:bg-lime-700"
          >
            {t("activity.depositUsdt")}
          </Link>
          <Link
            href={ROUTES.dashboardCatalog}
            className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            {t("positions.openCatalog")}
          </Link>
        </div>
      </div>
    </section>
  );
}
