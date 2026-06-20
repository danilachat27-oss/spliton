import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.constants';

export type ResolvedPagination = {
  page: number;
  pageSize: number;
  skip: number;
};

/** Clamps page size to [1, MAX_PAGE_SIZE]. */
export function clampPageSize(pageSize?: number): number {
  const raw = pageSize ?? DEFAULT_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(raw)));
}

export function resolvePagination(
  page?: number,
  pageSize?: number,
): ResolvedPagination {
  const p = Math.max(1, Math.floor(page ?? 1));
  const ps = clampPageSize(pageSize);
  return { page: p, pageSize: ps, skip: (p - 1) * ps };
}
