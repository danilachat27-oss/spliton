"use client";

import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

export function NextStepsCard() {
  const { t } = useI18n();

  const steps = [
    {
      title: t("overview.nextSteps.catalog.title"),
      description: t("overview.nextSteps.catalog.description"),
      href: ROUTES.dashboardCatalog,
      action: t("overview.nextSteps.catalog.action"),
    },
    {
      title: t("overview.nextSteps.positions.title"),
      description: t("overview.nextSteps.positions.description"),
      href: ROUTES.dashboardPositions,
      action: t("overview.nextSteps.positions.action"),
    },
    {
      title: t("overview.nextSteps.secondary.title"),
      description: t("overview.nextSteps.secondary.description"),
      href: ROUTES.dashboardSecondaryMarket,
      action: t("overview.nextSteps.secondary.action"),
    },
  ];

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Actions</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">{t("overview.nextSteps.title")}</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {steps.map((step) => (
          <article key={step.title} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-900">{step.title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{step.description}</p>
            <Link
              href={step.href}
              className="mt-3 inline-flex h-9 items-center rounded-md border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-100"
            >
              {step.action}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
