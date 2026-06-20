"use client";

import { useCallback } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { formatApiError, formatApiErrorWithMeta } from "@/lib/i18n/format-api-error";

/** Hook for localized API error messages in React components. */
export function useApiErrorMessage() {
  const { locale } = useI18n();

  const messageFor = useCallback(
    (err: unknown) => formatApiError(err, locale),
    [locale],
  );

  const messageWithMeta = useCallback(
    (err: unknown) => formatApiErrorWithMeta(err, locale),
    [locale],
  );

  return { messageFor, messageWithMeta, locale };
}
