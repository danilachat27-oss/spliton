"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import {
  getAdminDataCache,
  setAdminDataCache,
} from "@/features/admin/lib/admin-data-cache";

type UseAdminListState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useAdminList<T>(loader: () => Promise<T[]>): UseAdminListState<T> {
  const pathname = usePathname();
  const cacheKey = `list:${pathname}`;
  const cached = getAdminDataCache<T[]>(cacheKey);

  const [data, setData] = React.useState<T[]>(cached ?? []);
  const [loading, setLoading] = React.useState(!cached);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    const snapshot = getAdminDataCache<T[]>(cacheKey);
    if (snapshot) {
      setData(snapshot);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    loader()
      .then((rows) => {
        if (!cancelled) {
          setAdminDataCache(cacheKey, rows);
          setData(rows);
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
  }, [loader, tick, cacheKey]);

  const reload = React.useCallback(() => setTick((n) => n + 1), []);

  return { data, loading, error, reload };
}
