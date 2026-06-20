"use client";

import { useCallback, useEffect, useState } from "react";

import { getWalletDataSource } from "@/lib/public-env";
import {
  fetchPublicPlatformFees,
  type PublicPlatformFees,
} from "@/services/platform-fees.service";

export function usePublicPlatformFees() {
  const preferLive = getWalletDataSource() === "live";
  const [fees, setFees] = useState<PublicPlatformFees | null>(null);
  const [loading, setLoading] = useState(preferLive);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!preferLive) {
      setFees(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setFees(await fetchPublicPlatformFees());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки тарифов");
      setFees(null);
    } finally {
      setLoading(false);
    }
  }, [preferLive]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live: preferLive, fees, loading, error, reload: load };
}
