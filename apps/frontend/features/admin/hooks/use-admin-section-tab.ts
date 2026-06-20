"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useClientSearchParam } from "@/features/admin/hooks/use-client-search-param";

/**
 * Табы раздела с синхронизацией `?tab=` в URL (как вторичный рынок в кабинете).
 */
export function useAdminSectionTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
  paramName = "tab",
): [T, (tab: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const param = useClientSearchParam(paramName);

  const resolved = React.useMemo(() => {
    if (param && validTabs.includes(param as T)) return param as T;
    return defaultTab;
  }, [param, validTabs, defaultTab]);

  const [tab, setTabState] = React.useState<T>(resolved);

  React.useEffect(() => {
    setTabState(resolved);
  }, [resolved]);

  const setTab = React.useCallback(
    (next: T) => {
      setTabState(next);
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : "",
      );
      if (next === defaultTab) params.delete(paramName);
      else params.set(paramName, next);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [router, pathname, paramName, defaultTab],
  );

  return [tab, setTab];
}
