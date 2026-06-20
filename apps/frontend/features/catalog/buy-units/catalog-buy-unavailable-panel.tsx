"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import {
  catalogBuyUnavailableCopy,
  type CatalogBuyPurchaseState,
} from "@/lib/catalog/buy-unavailable";

export function CatalogBuyUnavailablePanel({
  purchaseState,
}: {
  purchaseState: Exclude<CatalogBuyPurchaseState, "available">;
}) {
  const { t } = useI18n();
  const copy = catalogBuyUnavailableCopy(purchaseState, t);

  return (
    <div
      className="rounded-3xl border border-amber-200/80 bg-amber-50 p-6 text-sm text-amber-950"
      role="status"
      data-testid="buy-unavailable-panel"
    >
      <p className="text-[15px] font-semibold text-amber-950">{copy.title}</p>
      <p className="mt-2 leading-relaxed">{copy.description}</p>
      <Link
        href={ROUTES.dashboardCatalog}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-[13px] font-semibold text-white transition hover:bg-zinc-900"
      >
        {t("catalog.buy.unavailable.backToCatalog")}
      </Link>
    </div>
  );
}
