"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchCalculatorConfig,
  isCalculatorLiveEnabled,
  type CalculatorConfig,
} from "@/services/calculator.service";

export function useCalculatorConfig() {
  const live = isCalculatorLiveEnabled();
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!live) {
      setConfig(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setConfig(await fetchCalculatorConfig());
    } catch (e) {
      setConfig(null);
      setError(e instanceof Error ? e.message : "Не удалось загрузить калькулятор");
    } finally {
      setLoading(false);
    }
  }, [live]);

  useEffect(() => {
    void load();
  }, [load]);

  return { live, config, loading, error, reload: load };
}
