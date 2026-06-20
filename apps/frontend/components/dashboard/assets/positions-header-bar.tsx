"use client";

import { Search } from "@/lib/lucide";
import { useMemo } from "react";

import { AssetsFilterField, AssetsFilterSelect } from "@/components/dashboard/assets/assets-filter-field";
import { AssetsUnderlineTabs } from "@/components/dashboard/assets/assets-underline-tabs";
import { assetsFilterInputClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { POSITIONS_GENRE_ALL, POSITIONS_STATUS_ALL } from "@/hooks/use-assets-positions-page";
import { cn } from "@/lib/utils";

const STATUS_VALUES = ["Active", "Open round", "Secondary", "Closed"] as const;

export function PositionsHeaderBar({
  query,
  onQuery,
  status,
  onStatus,
  genre,
  onGenre,
  genreOptions = [],
  sort,
  onSort,
  disabled,
}: {
  query: string;
  onQuery: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  genre: string;
  onGenre: (value: string) => void;
  genreOptions?: string[];
  sort: string;
  onSort: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  const statusTabs = useMemo(
    () => [
      { id: POSITIONS_STATUS_ALL, label: t("activity.tab.all") },
      ...STATUS_VALUES.map((v) => ({
        id: v,
        label: t(`positions.widgets.status.${v === "Open round" ? "openRound" : v.toLowerCase()}`),
      })),
    ],
    [t],
  );

  const genreFilterOptions = useMemo(
    () => [
      { value: POSITIONS_GENRE_ALL, label: t("positions.filterAllGenres") },
      ...genreOptions.map((g) => ({ value: g, label: g })),
    ],
    [genreOptions, t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "value_desc", label: t("positions.sort.valueDesc") },
      { value: "value_asc", label: t("positions.sort.valueAsc") },
      { value: "units_desc", label: t("positions.sort.unitsDesc") },
      { value: "units_asc", label: t("positions.sort.unitsAsc") },
      { value: "newest", label: t("positions.sort.newest") },
      { value: "updated", label: t("positions.sort.updated") },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <AssetsUnderlineTabs
        value={status}
        onChange={onStatus}
        items={statusTabs}
        disabled={disabled}
        ariaLabel={t("positions.filtersLabel")}
      />

      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <AssetsFilterField label={t("positions.filters.genreLabel")}>
          <AssetsFilterSelect value={genre} options={genreFilterOptions} onSelect={onGenre} disabled={disabled} />
        </AssetsFilterField>

        <AssetsFilterField label={t("positions.filters.sortLabel")}>
          <AssetsFilterSelect value={sort} options={sortOptions} onSelect={onSort} disabled={disabled} />
        </AssetsFilterField>

        <AssetsFilterField label={t("positions.searchPlaceholder")} className="min-w-[12rem] flex-[1.4]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              disabled={disabled}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={t("positions.searchPlaceholder")}
              className={cn(assetsFilterInputClass, "pl-9")}
            />
          </div>
        </AssetsFilterField>
      </div>
    </div>
  );
}
