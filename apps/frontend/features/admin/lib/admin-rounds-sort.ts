import type { AdminRoundListItem } from "@/features/admin/mocks/admin-rounds.mock";

export type RoundSortOption = {
  value: string;
  labelKey: string;
};

export const ADMIN_ROUND_SORT_OPTIONS: RoundSortOption[] = [
  { value: "created_desc", labelKey: "admin.rounds.sort.createdDesc" },
  { value: "start_desc", labelKey: "admin.rounds.sort.startDesc" },
  { value: "start_asc", labelKey: "admin.rounds.sort.startAsc" },
  { value: "progress_desc", labelKey: "admin.rounds.sort.progressDesc" },
  { value: "raised_desc", labelKey: "admin.rounds.sort.raisedDesc" },
  { value: "target_desc", labelKey: "admin.rounds.sort.targetDesc" },
];

function roundNum(value: string | number | undefined): number {
  return Number(String(value ?? "").replace(/[^\d.-]/g, "")) || 0;
}

export function sortAdminRoundRows(
  rows: AdminRoundListItem[],
  sortValue: string,
): AdminRoundListItem[] {
  const next = [...rows];
  const str = (a: string, b: string) => a.localeCompare(b, "ru");
  const num = (a: string | number | undefined, b: string | number | undefined) =>
    roundNum(a) - roundNum(b);

  switch (sortValue) {
    case "start_asc":
      return next.sort((a, b) => str(a.startDate ?? "", b.startDate ?? ""));
    case "start_desc":
      return next.sort((a, b) => str(b.startDate ?? "", a.startDate ?? ""));
    case "progress_desc":
      return next.sort((a, b) => b.progressPct - a.progressPct);
    case "raised_desc":
      return next.sort((a, b) => num(b.raisedAmountUsdt, a.raisedAmountUsdt));
    case "target_desc":
      return next.sort((a, b) => num(b.raiseTargetUsdt, a.raiseTargetUsdt));
    case "created_desc":
    default:
      return next.sort((a, b) => str(b.id, a.id));
  }
}