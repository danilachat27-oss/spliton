"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

export function CatalogBuyNotFoundScreen() {
  const { t } = useI18n();

  return (
    <div
      className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center"
      data-testid="catalog-buy-not-found"
    >
      <h1 className="text-xl font-semibold text-zinc-900">{t("catalog.buy.notFound.title")}</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{t("catalog.buy.notFound.body")}</p>
      <Link
        href={ROUTES.dashboardCatalog}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-zinc-900"
        data-testid="catalog-buy-not-found-cta"
      >
        {t("catalog.buy.notFound.cta")}
      </Link>
    </div>
  );
}
