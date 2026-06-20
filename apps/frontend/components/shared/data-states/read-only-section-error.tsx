"use client";

import { useReadOnlySectionError } from "@/hooks/use-read-only-section-error";

import { SectionUnavailableState } from "./section-unavailable-state";

type ReadOnlySectionErrorProps = {
  sectionId: string;
  error: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "light" | "dark" | "admin";
  compact?: boolean;
  className?: string;
  title?: string;
  description?: string;
};

/** Neutral unavailable state for read-only data loads; reports backend outages to the global notice. */
export function ReadOnlySectionError({
  sectionId,
  error,
  onRetry,
  retryLabel,
  variant = "light",
  compact = false,
  className,
  title,
  description,
}: ReadOnlySectionErrorProps) {
  useReadOnlySectionError(sectionId, error, onRetry);

  if (!error) return null;

  return (
    <SectionUnavailableState
      title={title}
      description={description}
      onRetry={onRetry}
      retryLabel={retryLabel}
      variant={variant}
      compact={compact}
      className={className}
    />
  );
}
