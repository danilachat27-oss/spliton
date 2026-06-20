"use client";

import { useEffect, useRef } from "react";

import { useBackendAvailabilityOptional } from "@/components/providers/backend-availability-provider";

type RetryHandler = () => void;

/** Registers backend-unavailable read errors for the global notice. */
export function useReadOnlySectionError(
  sectionId: string,
  error: unknown,
  onRetry?: RetryHandler,
): void {
  const availability = useBackendAvailabilityOptional();
  const onRetryRef = useRef(onRetry);
  onRetryRef.current = onRetry;

  useEffect(() => {
    if (!availability) return;

    if (!error) {
      availability.clearReadOnlyError(sectionId);
      return;
    }

    availability.reportReadOnlyError(sectionId, error, () => onRetryRef.current?.());
    return () => availability.clearReadOnlyError(sectionId);
  }, [availability, sectionId, error]);
}
