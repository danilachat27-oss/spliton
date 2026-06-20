"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  fetchEligibility,
  fetchLegalCenter,
  LEGAL_API_PATHS,
  type ConsentSource,
  type EligibilityResult,
  type MissingConsentItem,
} from "@/services/legal.service";

const ELIGIBILITY_PATH: Record<ConsentSource, string | null> = {
  REGISTER: null,
  LOGIN: null,
  PRIMARY_PURCHASE: LEGAL_API_PATHS.eligibilityPrimary,
  SECONDARY_TRADE: LEGAL_API_PATHS.eligibilitySecondary,
  WITHDRAWAL: LEGAL_API_PATHS.eligibilityWithdrawal,
  PROFILE: null,
};

const MISSING_KEY: Record<
  ConsentSource,
  keyof Awaited<ReturnType<typeof fetchLegalCenter>>["missingConsents"] | null
> = {
  REGISTER: null,
  LOGIN: null,
  PRIMARY_PURCHASE: "primaryPurchase",
  SECONDARY_TRADE: "secondaryTrade",
  WITHDRAWAL: "withdrawal",
  PROFILE: null,
};

export function useLegalConsentGate(source: ConsentSource, enabled: boolean) {
  const { authorizedFetch } = useAuth();
  const [missingItems, setMissingItems] = useState<MissingConsentItem[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const pendingAction = useRef<(() => void | Promise<void>) | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setMissingItems([]);
      setEligibility(null);
      setCheckError(false);
      setIsChecking(false);
      return;
    }

    const eligibilityPath = ELIGIBILITY_PATH[source];
    const missingKey = MISSING_KEY[source];
    setIsChecking(true);
    setCheckError(false);

    let eligibilityFailed = false;
    let legalCenterFailed = false;

    const tasks: Promise<void>[] = [];

    if (eligibilityPath) {
      tasks.push(
        fetchEligibility(eligibilityPath, authorizedFetch)
          .then(setEligibility)
          .catch(() => {
            setEligibility(null);
            eligibilityFailed = true;
          }),
      );
    } else {
      setEligibility(null);
    }

    if (missingKey) {
      tasks.push(
        fetchLegalCenter(authorizedFetch)
          .then((center) => setMissingItems(center.missingConsents[missingKey] ?? []))
          .catch(() => {
            setMissingItems([]);
            legalCenterFailed = true;
          }),
      );
    } else {
      setMissingItems([]);
    }

    try {
      await Promise.all(tasks);
    } finally {
      setIsChecking(false);
    }

    if (eligibilityFailed || legalCenterFailed) {
      setCheckError(true);
    }
  }, [authorizedFetch, enabled, source]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasBlockingEligibility = Boolean(eligibility && !eligibility.allowed);

  const canProceed = useMemo(() => {
    if (!enabled) return true;
    if (isChecking || checkError) return false;
    if (hasBlockingEligibility) return false;
    return true;
  }, [checkError, enabled, hasBlockingEligibility, isChecking]);

  const onConsentAccepted = useCallback(() => {
    setConsentOpen(false);
    void refresh().then(() => {
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action) void action();
    });
  }, [refresh]);

  const dismissConsent = useCallback(() => {
    pendingAction.current = null;
    setConsentOpen(false);
  }, []);

  const requestProceed = useCallback(
    (action: () => void | Promise<void>): boolean => {
      if (!enabled) {
        void action();
        return true;
      }
      if (isChecking || checkError) {
        return false;
      }
      if (eligibility && !eligibility.allowed) {
        return false;
      }
      if (missingItems.length > 0) {
        pendingAction.current = action;
        setConsentOpen(true);
        return false;
      }
      void action();
      return true;
    },
    [checkError, eligibility, enabled, isChecking, missingItems.length],
  );

  return {
    missingItems,
    eligibility,
    consentOpen,
    setConsentOpen,
    isChecking,
    checkError,
    canProceed,
    refresh,
    onConsentAccepted,
    dismissConsent,
    requestProceed,
    hasBlockingEligibility,
  };
}
