"use client";

import { cn } from "@/lib/utils";

export function CatalogCardsSkeleton({
  count = 6,
  variant = "grid",
}: {
  count?: number;
  variant?: "grid" | "list";
}) {
  const items = Array.from({ length: count }, (_, i) => i);
  const isList = variant === "list";

  return (
    <div
      className={cn(
        isList ? "flex flex-col gap-3" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
      )}
      aria-hidden
    >
      {items.map((i) => (
        <div
          key={`catalog-skeleton-${i}`}
          className={cn(
            "animate-pulse rounded-2xl bg-[#0c0c0e] ring-1 ring-white/[0.06]",
            isList ? "h-[132px]" : "h-[360px]",
          )}
        />
      ))}
    </div>
  );
}

export function CatalogStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={`stat-skeleton-${i}`}
          className="h-20 animate-pulse rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]"
        />
      ))}
    </div>
  );
}
