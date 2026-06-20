"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { activityItems } from "@/components/my-assets/overview/mock-data";

export function ActivityFeed() {
  const { t } = useI18n();

  return (
    <section className="rounded-md border border-neutral-200 bg-white">
      <header className="border-b border-neutral-200 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold text-neutral-900">{t("assets.activity.title")}</h3>
      </header>

      <div className="hidden sm:grid sm:grid-cols-[120px_160px_minmax(180px,1fr)_140px_110px] sm:gap-3 sm:border-b sm:border-neutral-200 sm:px-5 sm:py-2.5 sm:text-[11px] sm:font-semibold sm:uppercase sm:tracking-[0.08em] sm:text-neutral-500">
        <span>{t("assets.activity.col.date")}</span>
        <span>{t("assets.activity.col.operation")}</span>
        <span>{t("assets.activity.col.direction")}</span>
        <span>{t("assets.activity.col.amount")}</span>
        <span>{t("assets.activity.col.status")}</span>
      </div>

      <div className="divide-y divide-neutral-200">
        {activityItems.map((item) => (
          <article
            key={item.id}
            className="grid gap-1.5 px-4 py-3 sm:grid-cols-[120px_160px_minmax(180px,1fr)_140px_110px] sm:items-center sm:gap-3 sm:px-5"
          >
            <p className="text-xs text-neutral-400 sm:text-[13px]">{item.date}</p>
            <p className="text-sm text-neutral-900 sm:text-[13px]">{item.type}</p>
            <p className="text-sm text-neutral-700 sm:text-[13px]">{item.target}</p>
            <p className="tabular-nums text-sm text-neutral-900 sm:text-[13px]">{item.amount}</p>
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-lime-700">{item.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
