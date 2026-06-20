"use client";

import { useI18n } from "@/components/providers/i18n-provider";

export function PositionsSummaryCards({
  total,
  activeReleases,
  totalUnits,
  averageShare,
}: {
  total: string;
  activeReleases: string;
  totalUnits: string;
  averageShare: string;
}) {
  const { t } = useI18n();

  const cards = [
    { label: t("positions.widgets.summaryTotal"), value: total },
    { label: t("positions.widgets.summaryActiveReleases"), value: activeReleases },
    { label: t("positions.widgets.summaryTotalUnits"), value: totalUnits },
    { label: t("positions.widgets.summaryAverageShare"), value: averageShare },
  ];

  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {cards.map((item) => (
        <article
          key={item.label}
          className="rounded-3xl bg-neutral-50/90 px-5 py-5 ring-1 ring-neutral-100 sm:px-6 sm:py-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{item.label}</p>
          <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-2xl">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
