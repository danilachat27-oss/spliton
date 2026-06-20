"use client";

import Link from "next/link";
import { Eye } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import { tf } from "@/lib/i18n/widget-messages";

export function AssetsSummaryCard() {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <span>{t("assets.widgets.summaryTotalValue")}</span>
        <Eye className="size-3.5" />
      </div>

      <div className="mt-2 flex items-end gap-2">
        <p className="text-[3rem] font-semibold tracking-tight text-neutral-900">0,00</p>
        <span className="pb-1.5 text-base text-neutral-500">USDT</span>
      </div>

      <p className="mt-1 text-sm text-neutral-500">{tf(t("assets.widgets.summaryTodayChange"), { amount: "0,00 USDT" })}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`${ROUTES.dashboard}#deposit`}
          className="inline-flex h-10 items-center rounded-full bg-lime-600 px-4 text-sm font-semibold text-white transition hover:bg-lime-700"
        >
          {t("nav.deposit")}
        </Link>
        <Link
          href={ROUTES.dashboardCatalog}
          className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
        >
          {t("nav.catalog")}
        </Link>
        <Link
          href={ROUTES.dashboardActivity}
          className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
        >
          {t("assets.widgets.summaryOperations")}
        </Link>
      </div>
    </section>
  );
}
