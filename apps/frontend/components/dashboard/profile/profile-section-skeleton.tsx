"use client";

import { cn } from "@/lib/utils";

export function ProfileSectionSkeleton({
  variant = "cards",
  className,
  rows = 3,
}: {
  variant?: "cards" | "list" | "form" | "table";
  className?: string;
  rows?: number;
}) {
  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)} aria-busy="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true">
        <div className="h-10 animate-pulse rounded-xl bg-neutral-100" />
        <div className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
        <div className="h-32 animate-pulse rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-2 rounded-xl bg-neutral-50/80 p-3", className)} aria-busy="true">
        <div className="h-8 animate-pulse rounded-lg bg-neutral-100" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)} aria-busy="true">
      <div className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
      <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}
