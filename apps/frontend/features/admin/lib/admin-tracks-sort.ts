import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";

export type TrackSortOption = {
  value: string;
  labelKey: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export const ADMIN_TRACK_SORT_OPTIONS: TrackSortOption[] = [
  { value: "all", labelKey: "admin.tracks.sort.newest" },
  { value: "oldest", labelKey: "admin.tracks.sort.oldest", sortBy: "createdAt", sortDir: "asc" },
  { value: "title_asc", labelKey: "admin.tracks.sort.titleAsc", sortBy: "title", sortDir: "asc" },
  { value: "title_desc", labelKey: "admin.tracks.sort.titleDesc", sortBy: "title", sortDir: "desc" },
  {
    value: "raise_desc",
    labelKey: "admin.tracks.sort.raiseDesc",
    sortBy: "raiseTargetUsdt",
    sortDir: "desc",
  },
  {
    value: "raise_asc",
    labelKey: "admin.tracks.sort.raiseAsc",
    sortBy: "raiseTargetUsdt",
    sortDir: "asc",
  },
  {
    value: "hard_cap_desc",
    labelKey: "admin.tracks.sort.hardCapDesc",
    sortBy: "hardCapUsdt",
    sortDir: "desc",
  },
  {
    value: "hard_cap_asc",
    labelKey: "admin.tracks.sort.hardCapAsc",
    sortBy: "hardCapUsdt",
    sortDir: "asc",
  },
  {
    value: "price_desc",
    labelKey: "admin.tracks.sort.priceDesc",
    sortBy: "primaryUnitPrice",
    sortDir: "desc",
  },
  {
    value: "price_asc",
    labelKey: "admin.tracks.sort.priceAsc",
    sortBy: "primaryUnitPrice",
    sortDir: "asc",
  },
  {
    value: "pool_desc",
    labelKey: "admin.tracks.sort.poolDesc",
    sortBy: "holderSharePct",
    sortDir: "desc",
  },
  {
    value: "pool_asc",
    labelKey: "admin.tracks.sort.poolAsc",
    sortBy: "holderSharePct",
    sortDir: "asc",
  },
  {
    value: "sold_desc",
    labelKey: "admin.tracks.sort.soldDesc",
    sortBy: "soldUnits",
    sortDir: "desc",
  },
  {
    value: "sold_asc",
    labelKey: "admin.tracks.sort.soldAsc",
    sortBy: "soldUnits",
    sortDir: "asc",
  },
  {
    value: "total_units_desc",
    labelKey: "admin.tracks.sort.totalUnitsDesc",
    sortBy: "totalUnits",
    sortDir: "desc",
  },
  {
    value: "total_units_asc",
    labelKey: "admin.tracks.sort.totalUnitsAsc",
    sortBy: "totalUnits",
    sortDir: "asc",
  },
  {
    value: "promo_desc",
    labelKey: "admin.tracks.sort.promoDesc",
    sortBy: "promoBudgetUsdt",
    sortDir: "desc",
  },
  {
    value: "updated_desc",
    labelKey: "admin.tracks.sort.updatedDesc",
    sortBy: "updatedAt",
    sortDir: "desc",
  },
];

export function resolveTrackSort(value: string): {
  sortBy?: string;
  sortDir: "asc" | "desc";
} {
  const option = ADMIN_TRACK_SORT_OPTIONS.find((o) => o.value === value);
  return {
    sortBy: option?.sortBy,
    sortDir: option?.sortDir ?? "desc",
  };
}

function trackNum(value: string | undefined): number {
  return Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;
}

export function compareAdminTracks(
  a: AdminTrackListItem,
  b: AdminTrackListItem,
  sortBy?: string,
  sortDir: "asc" | "desc" = "desc",
): number {
  const dir = sortDir === "asc" ? 1 : -1;
  const num = (x: string | undefined, y: string | undefined) => (trackNum(x) - trackNum(y)) * dir;
  const str = (x: string, y: string) => x.localeCompare(y, "ru") * dir;

  switch (sortBy) {
    case "title":
      return str(a.title, b.title);
    case "raiseTargetUsdt":
      return num(a.raiseTargetUsdt, b.raiseTargetUsdt);
    case "hardCapUsdt":
      return num(a.hardCapUsdt, b.hardCapUsdt);
    case "primaryUnitPrice":
      return num(a.primaryUnitPrice, b.primaryUnitPrice);
    case "holderSharePct":
      return num(a.holderSharePct, b.holderSharePct);
    case "soldUnits":
      return num(a.soldUnits, b.soldUnits);
    case "totalUnits":
      return num(a.totalUnits, b.totalUnits);
    case "promoBudgetUsdt":
      return num(a.promoBudgetUsdt, b.promoBudgetUsdt);
    case "updatedAt":
      return str(a.updatedAt ?? a.createdAt, b.updatedAt ?? b.createdAt);
    case "createdAt":
    default:
      return str(a.createdAt, b.createdAt);
  }
}

export function sortAdminTrackRows(
  rows: AdminTrackListItem[],
  sortValue: string,
): AdminTrackListItem[] {
  const { sortBy, sortDir } = resolveTrackSort(sortValue);
  const next = [...rows];
  next.sort((a, b) => compareAdminTracks(a, b, sortBy, sortDir));
  return next;
}
