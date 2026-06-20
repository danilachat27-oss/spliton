"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { BackendUnavailableNotice } from "@/components/shared/data-states/backend-unavailable-notice";
import { isBackendUnavailableError } from "@/lib/api/classify-api-error";

type RetryHandler = () => void;

type BackendAvailabilityContextValue = {
  reportReadOnlyError: (sectionId: string, error: unknown, onRetry?: RetryHandler) => void;
  clearReadOnlyError: (sectionId: string) => void;
};

const BackendAvailabilityContext = createContext<BackendAvailabilityContextValue | null>(null);

type SectionFailure = {
  onRetry?: RetryHandler;
};

export function BackendAvailabilityProvider({ children }: { children: ReactNode }) {
  const [failures, setFailures] = useState<Record<string, SectionFailure>>({});

  const reportReadOnlyError = useCallback(
    (sectionId: string, error: unknown, onRetry?: RetryHandler) => {
      if (!error || !isBackendUnavailableError(error)) {
        setFailures((prev) => {
          if (!prev[sectionId]) return prev;
          const next = { ...prev };
          delete next[sectionId];
          return next;
        });
        return;
      }

      setFailures((prev) => {
        if (prev[sectionId]) return prev;
        return {
          ...prev,
          [sectionId]: { onRetry },
        };
      });
    },
    [],
  );

  const clearReadOnlyError = useCallback((sectionId: string) => {
    setFailures((prev) => {
      if (!prev[sectionId]) return prev;
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  }, []);

  const retryAll = useCallback(() => {
    const handlers = Object.values(failures)
      .map((entry) => entry.onRetry)
      .filter((handler): handler is RetryHandler => typeof handler === "function");

    if (handlers.length > 0) {
      handlers.forEach((handler) => handler());
      return;
    }

    window.location.reload();
  }, [failures]);

  const showGlobalNotice = Object.keys(failures).length > 0;

  const value = useMemo(
    () => ({ reportReadOnlyError, clearReadOnlyError }),
    [reportReadOnlyError, clearReadOnlyError],
  );

  return (
    <BackendAvailabilityContext.Provider value={value}>
      {showGlobalNotice ? <BackendUnavailableNotice onRetry={retryAll} /> : null}
      {children}
    </BackendAvailabilityContext.Provider>
  );
}

export function useBackendAvailability(): BackendAvailabilityContextValue {
  const ctx = useContext(BackendAvailabilityContext);
  if (!ctx) {
    throw new Error("useBackendAvailability must be used within BackendAvailabilityProvider");
  }
  return ctx;
}

export function useBackendAvailabilityOptional(): BackendAvailabilityContextValue | null {
  return useContext(BackendAvailabilityContext);
}
