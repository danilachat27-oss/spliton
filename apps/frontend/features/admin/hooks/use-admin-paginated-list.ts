"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import type { AdminListQuery, PaginatedResponse } from "@/features/admin/api/types";
import {
  getAdminDataCache,
  setAdminDataCache,
} from "@/features/admin/lib/admin-data-cache";

type UseAdminPaginatedListState<T> = {
  data: PaginatedResponse<T>;
  loading: boolean;
  error: string | null;
  query: AdminListQuery;
  setQuery: React.Dispatch<React.SetStateAction<AdminListQuery>>;
  reload: () => void;
};

const EMPTY_PAGE = <T,>(): PaginatedResponse<T> => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  hasMore: false,
});

function cacheKeyFor(pathname: string, query: AdminListQuery): string {
  return `paginated:${pathname}:${JSON.stringify(query)}`;
}

export function useAdminPaginatedList<T>(
  loader: (query: AdminListQuery) => Promise<PaginatedResponse<T>>,
  initialQuery?: AdminListQuery,
): UseAdminPaginatedListState<T> {
  const pathname = usePathname();
  const [query, setQuery] = React.useState<AdminListQuery>({
    page: 1,
    pageSize: 20,
    ...initialQuery,
  });
  const cacheKey = cacheKeyFor(pathname, query);
  const cached = getAdminDataCache<PaginatedResponse<T>>(cacheKey);

  const [data, setData] = React.useState<PaginatedResponse<T>>(cached ?? EMPTY_PAGE());
  const [loading, setLoading] = React.useState(!cached);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const key = cacheKeyFor(pathname, query);
    const snapshot = getAdminDataCache<PaginatedResponse<T>>(key);
    if (snapshot) {
      setData(snapshot);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    loader(query)
      .then((res) => {
        if (!cancelled) {
          setAdminDataCache(key, res);
          setData(res);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить данные");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loader, query, tick, pathname]);

  const reload = React.useCallback(() => setTick((n) => n + 1), []);

  return { data, loading, error, query, setQuery, reload };
}
