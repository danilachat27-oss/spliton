"use client";

import Link from "next/link";

import { positionPreviews } from "@/components/dashboard/assets/assets-mock-data";
import { assetsCardClass, assetsOutlineButtonClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { ROUTES, assetsSellUnitsPath } from "@/constants/routes";
import { cn } from "@/lib/utils";

const statusTone: Record<string, string> = {
  Active: "bg-blue-50 text-blue-950",
  "Open round": "bg-neutral-100 text-neutral-800",
  Secondary: "bg-neutral-50 text-neutral-800",
  Closed: "bg-neutral-100/80 text-neutral-600",
};

const POSITION_STATUS_KEYS: Record<string, string> = {
  Active: "positions.widgets.status.active",
  "Open round": "positions.widgets.status.openRound",
  Secondary: "positions.widgets.status.secondary",
  Closed: "positions.widgets.status.closed",
};

export function TopPositionsCard({
  rows,
  live = false,
  loading = false,
  compact = false,
}: {
  rows?: typeof positionPreviews;
  live?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const previewRowsResolved = (rows ?? (live ? [] : positionPreviews)).slice(0, 5);
  const sectionClass = compact ? assetsCardClass : cn(assetsCardClass, "sm:px-6 sm:py-6");

  if (live && loading && previewRowsResolved.length === 0) {
    return (
      <section className={sectionClass}>
        <div className="h-48 animate-pulse rounded-xl bg-neutral-50" />
      </section>
    );
  }

  if (live && previewRowsResolved.length === 0) {
    return (
      <section className={sectionClass} aria-label={t("positions.widgets.topTableAria")}>
        <h2 className="text-base font-semibold tracking-tight text-neutral-900">
          {compact ? t("overview.portfolioSection") : t("positions.widgets.topTableTitle")}
        </h2>
        <EmptyState message={t("assets.overview.portfolioEmptyBody")} />
      </section>
    );
  }

  return (
    <section className={sectionClass} aria-label={t("positions.widgets.topTableAria")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
          {compact ? t("overview.portfolioSection") : t("positions.widgets.topTableTitle")}
        </h2>
        {compact ? (
          <Link href={ROUTES.dashboardPositions} className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900">
            {t("positions.preview.allLink")}
          </Link>
        ) : null}
      </div>

      {!compact ? (
        <p className="max-w-xl text-sm leading-relaxed text-neutral-500">
          {live ? t("positions.widgets.topTableSubtitleLive") : t("positions.widgets.topTableSubtitleMock")}
        </p>
      ) : null}

      <ul className={cn("divide-y divide-neutral-100 lg:hidden", compact ? "block" : "hidden")}>
        {previewRowsResolved.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[11px] font-bold uppercase text-neutral-500">
                {row.release.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900">{row.release}</p>
                <p className="truncate text-xs text-neutral-500">
                  {row.artist} · {row.units} UNT
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-sm font-semibold tabular-nums text-neutral-900">{row.value}</p>
              <p className="text-xs tabular-nums text-neutral-500">{row.share}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className={cn("overflow-x-auto rounded-xl bg-neutral-50/80", compact ? "hidden lg:block" : "block")}>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-neutral-500">
            <tr className="border-b border-neutral-200/80">
              <th className="px-4 py-3.5 pl-5 text-[10px] font-semibold uppercase tracking-[0.12em]">{t("positions.widgets.tableRelease")}</th>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{t("positions.widgets.topTableArtist")}</th>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{t("positions.widgets.tableUnits")}</th>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{t("positions.widgets.tableStatus")}</th>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{t("positions.widgets.tableShare")}</th>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{t("positions.widgets.tableValue")}</th>
              <th className="px-4 py-3.5 pr-5 text-[10px] font-semibold uppercase tracking-[0.12em]">{t("positions.widgets.tableAction")}</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {previewRowsResolved.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-neutral-100 transition-colors hover:bg-neutral-50/80",
                  i === previewRowsResolved.length - 1 && "border-b-0",
                )}
              >
                <td className="px-4 py-3.5 pl-5 align-top">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-bold uppercase text-neutral-500">
                      {row.release.slice(0, 2)}
                    </div>
                    <span className="font-medium text-neutral-900">{row.release}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top text-neutral-600">{row.artist}</td>
                <td className="px-4 py-3.5 align-top font-mono tabular-nums text-neutral-700">{row.units}</td>
                <td className="px-4 py-3.5 align-top">
                  <span
                    className={cn(
                      "inline-flex rounded-lg px-2 py-1 text-[11px] font-semibold",
                      statusTone[row.status] ?? statusTone.Closed,
                    )}
                  >
                    {t(POSITION_STATUS_KEYS[row.status] ?? POSITION_STATUS_KEYS.Closed!)}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-top font-mono tabular-nums text-neutral-700">{row.share}</td>
                <td className="px-4 py-3.5 align-top font-mono font-semibold tabular-nums text-neutral-900">{row.value}</td>
                <td className="px-4 py-3.5 pr-5 align-top">
                  {row.catalogReleaseId ? (
                    <Link
                      href={assetsSellUnitsPath(row.catalogReleaseId)}
                      className={assetsOutlineButtonClass}
                    >
                      {t("positions.widgets.sellUnt")}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={assetsOutlineButtonClass}
                    >
                      {t("positions.widgets.openRelease")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
