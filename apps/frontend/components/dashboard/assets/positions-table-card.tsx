"use client";

import type { PositionPreviewItem } from "@/components/dashboard/assets/assets-mock-data";
import { PositionActionsModal } from "@/components/dashboard/assets/position-actions-modal";
import { assetsCardClass, assetsTableCellClass, assetsTableHeadClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/i18n/formatters";
import { cn } from "@/lib/utils";

const statusClass: Record<PositionPreviewItem["status"], string> = {
  Active: "text-[#3d7a00]",
  "Open round": "text-neutral-700",
  Secondary: "text-neutral-700",
  Closed: "text-neutral-400",
};

const POSITION_STATUS_KEYS: Record<PositionPreviewItem["status"], string> = {
  Active: "positions.widgets.status.active",
  "Open round": "positions.widgets.status.openRound",
  Secondary: "positions.widgets.status.secondary",
  Closed: "positions.widgets.status.closed",
};

function getOwnedUnits(row: PositionPreviewItem): number {
  if (typeof row.heldUnits === "number" && Number.isFinite(row.heldUnits)) return row.heldUnits;
  return Number(row.units.replace(/\s/g, ""));
}

export function PositionsTableCard({
  rows,
  loading = false,
  live = false,
  compact = false,
}: {
  rows: PositionPreviewItem[];
  loading?: boolean;
  live?: boolean;
  compact?: boolean;
}) {
  const { t, locale } = useI18n();

  if (loading) {
    return (
      <section className={assetsCardClass}>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={cn(assetsCardClass, compact && "py-4")} aria-label={t("positions.widgets.tableAria")}>
      {!compact ? (
        <h2 className="mb-4 text-base font-semibold text-neutral-900">{t("positions.widgets.tableTitle")}</h2>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr>
              <th className={assetsTableHeadClass}>{t("positions.widgets.tableRelease")}</th>
              <th className={assetsTableHeadClass}>{t("positions.widgets.tableUnits")}</th>
              <th className={assetsTableHeadClass}>{t("positions.widgets.tableStatus")}</th>
              <th className={assetsTableHeadClass}>{t("positions.widgets.tableShare")}</th>
              <th className={assetsTableHeadClass}>{t("positions.widgets.tableValue")}</th>
              <th className={cn(assetsTableHeadClass, "text-right")}>{t("positions.widgets.tableAction")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                id={`position-${row.id}`}
                className="scroll-mt-28 hover:bg-neutral-50/80"
              >
                <td className={assetsTableCellClass}>
                  <p className="font-medium text-neutral-900">{row.release}</p>
                  <p className="truncate text-xs text-neutral-500">{row.artist}</p>
                </td>
                <td className={cn(assetsTableCellClass, "font-mono tabular-nums text-neutral-800")}>
                  {formatNumber(getOwnedUnits(row), locale)}
                </td>
                <td className={cn(assetsTableCellClass, "text-sm", statusClass[row.status])}>
                  {t(POSITION_STATUS_KEYS[row.status])}
                </td>
                <td className={cn(assetsTableCellClass, "font-mono tabular-nums text-neutral-800")}>{row.share}</td>
                <td className={cn(assetsTableCellClass, "font-mono font-medium tabular-nums text-neutral-900")}>{row.value}</td>
                <td className={cn(assetsTableCellClass, "text-right")}>
                  <PositionActionsModal row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
