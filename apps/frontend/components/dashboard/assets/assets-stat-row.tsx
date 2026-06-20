import { assetsStats, type AssetsStat } from "@/components/dashboard/assets/assets-mock-data";
import { useI18n } from "@/components/providers/i18n-provider";

type Props = {
  stats?: AssetsStat[] | null;
  /** live-режим: при отсутствии `stats` не показываем mock-значения */
  live?: boolean;
};

const STAT_LABEL_KEYS = [
  "assets.widgets.stat.activeReleases",
  "assets.widgets.stat.totalPositions",
  "assets.widgets.stat.totalUnits",
  "assets.widgets.stat.largestShare",
] as const;

export function AssetsStatRow({ stats, live = false }: Props) {
  const { t } = useI18n();

  const safeStats = stats ?? null;
  if (live && (!safeStats || safeStats.length === 0)) {
    return (
      <section aria-label={t("assets.widgets.statsAria")}>
        <p>{t("assets.overview.insufficientData")}</p>
      </section>
    );
  }

  const rows = (safeStats ?? assetsStats).slice(0, STAT_LABEL_KEYS.length);

  return (
    <section aria-label={t("assets.widgets.statsAria")}>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {rows.map((item, i) => (
          <article key={i} className="rounded-2xl bg-neutral-50/90 px-4 py-4 ring-1 ring-neutral-100 sm:px-5 sm:py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              {t(STAT_LABEL_KEYS[i]!)}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums tracking-tight text-neutral-900 sm:text-xl">
              {item.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
