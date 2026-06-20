import type { AdminLabelListItem } from "@/services/admin/adminLabels.service";

export type AdminLabelsListQuery = {
  search?: string;
  status?: string;
  releases?: string;
  sort?: string;
};

export function applyAdminLabelsListFilters(
  items: AdminLabelListItem[],
  query: AdminLabelsListQuery,
): AdminLabelListItem[] {
  let rows = items;

  if (query.status === "inactive") {
    rows = rows.filter((row) => !row.isActive);
  }

  if (query.releases === "with") {
    rows = rows.filter((row) => row.releaseCount > 0);
  } else if (query.releases === "without") {
    rows = rows.filter((row) => row.releaseCount === 0);
  }

  const sort = query.sort ?? "name_asc";
  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case "name_desc":
        return b.name.localeCompare(a.name, "ru");
      case "created_desc":
        return b.createdAt.localeCompare(a.createdAt);
      case "releases_desc":
        return b.releaseCount - a.releaseCount || a.name.localeCompare(b.name, "ru");
      case "name_asc":
      default:
        return a.name.localeCompare(b.name, "ru");
    }
  });

  return rows;
}