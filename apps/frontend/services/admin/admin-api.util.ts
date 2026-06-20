import {
  ADMIN_LIST_MAX_PAGE_SIZE,
  type AdminListQuery,
  type PaginatedResponse,
} from "@/features/admin/api/types";

/** Имитация сетевой задержки для mock-сервисов. TODO: убрать при подключении API. */
export async function adminMockDelay(ms = 280): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch all pages respecting backend pageSize limit (max 100). */
export async function fetchAllAdminPaginatedItems<T>(
  fetchPage: (query: AdminListQuery) => Promise<PaginatedResponse<T>>,
  query?: Omit<AdminListQuery, "page" | "pageSize">,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const res = await fetchPage({
      ...query,
      page,
      pageSize: ADMIN_LIST_MAX_PAGE_SIZE,
    });
    items.push(...res.items);
    total = res.total;
    if (res.items.length === 0 || items.length >= total || !res.hasMore) {
      break;
    }
    page += 1;
  }

  return items;
}
