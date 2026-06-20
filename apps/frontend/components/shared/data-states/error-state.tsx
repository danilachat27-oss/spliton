"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { RetryButton } from "./retry-button";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel,
  className,
  compact = false,
  children,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        compact
          ? "rounded-xl border border-rose-200/80 bg-rose-50/90 px-3 py-2.5 text-xs text-rose-900"
          : "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900",
        className,
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <>
          {" "}
          <RetryButton onClick={onRetry} label={retryLabel} />
        </>
      ) : null}
      {children}
    </div>
  );
}
