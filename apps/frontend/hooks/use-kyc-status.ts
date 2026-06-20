"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { localizedApiError } from "@/lib/api/localized-error";
import type { KycStatusResponse } from "@/lib/kyc/kyc-status-adapter";
import { isLiveAccountEnabled } from "@/lib/public-env";
import {
  fetchKycStatus,
  startKycVerification,
  submitKycManual,
} from "@/services/kyc.service";

export function useKycStatus() {
  const { authorizedFetch, isAuthenticated } = useAuth();
  const live = isLiveAccountEnabled() && isAuthenticated;

  const [data, setData] = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchKycStatus(authorizedFetch);
      setData(res);
    } catch (e) {
      setData(null);
      setError(localizedApiError(e));
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, live]);

  useEffect(() => {
    void load();
  }, [load]);

  const start = useCallback(
    async (countryCode?: string) => {
      if (!live) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await startKycVerification(authorizedFetch, countryCode);
        setData(res);
      } catch (e) {
        setError(localizedApiError(e));
      } finally {
        setSubmitting(false);
      }
    },
    [authorizedFetch, live],
  );

  const submitManual = useCallback(
    async (body: { countryCode: string; documentType: string; documentReference: string }) => {
      if (!live) return;
      setSubmitting(true);
      setError(null);
      try {
        const res = await submitKycManual(authorizedFetch, body);
        setData(res);
      } catch (e) {
        setError(localizedApiError(e));
      } finally {
        setSubmitting(false);
      }
    },
    [authorizedFetch, live],
  );

  return { live, data, loading, error, submitting, reload: load, start, submitManual };
}
