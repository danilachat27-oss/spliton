"use client";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  message: string;
  className?: string;
  compact?: boolean;
};

export function EmptyState({ message, className, compact = false }: EmptyStateProps) {
  return (
    <p
      className={cn(
        compact
          ? "rounded-xl bg-neutral-50/90 px-3 py-6 text-center text-xs text-neutral-500 ring-1 ring-neutral-100"
          : "rounded-2xl bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500 ring-1 ring-neutral-100",
        className,
      )}
    >
      {message}
    </p>
  );
}
