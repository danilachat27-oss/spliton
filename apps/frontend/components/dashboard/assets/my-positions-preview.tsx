"use client";

import Link from "next/link";

import { positionPreviews } from "@/components/dashboard/assets/assets-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";

export function MyPositionsPreview() {
  const { t } = useI18n();

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-neutral-900">{t("positions.title")}</h3>
        <Link
          href={ROUTES.dashboardPositions}
          className="text-xs font-medium uppercase tracking-wide text-neutral-500 transition hover:text-neutral-900"
        >
          {t("positions.preview.allLink")}
        </Link>
      </div>

      {positionPreviews.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">{t("positions.preview.emptyInReleases")}</p>
      ) : (
        <div className="mt-3 divide-y divide-neutral-200">
          {positionPreviews.slice(0, 5).map((item) => (
            <article key={item.id} className="grid grid-cols-[1.4fr_0.9fr_0.9fr] gap-3 py-2.5 text-sm">
              <p className="text-neutral-900">{item.release}</p>
              <p className="text-neutral-600">{item.units}</p>
              <p className="text-neutral-900">{item.value}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
