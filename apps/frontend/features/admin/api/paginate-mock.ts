import type { AdminListQuery, PaginatedResponse } from "./types";

export function paginateMock<T>(
  items: T[],
  query?: AdminListQuery,
): PaginatedResponse<T> {
  const page = Math.max(1, query?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 20));
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    total: items.length,
    page,
    pageSize,
    hasMore: start + slice.length < items.length,
  };
}
