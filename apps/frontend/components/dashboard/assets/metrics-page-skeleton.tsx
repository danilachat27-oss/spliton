"use client";

export function MetricsPageSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-10" aria-hidden>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-50" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
