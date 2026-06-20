"use client";

export function PortfolioOverviewSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4" aria-hidden>
      <div className="rounded-2xl bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="h-4 w-44 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 h-10 w-40 animate-pulse rounded-lg bg-neutral-100" />
        <div className="mt-3 h-4 w-52 animate-pulse rounded bg-neutral-100" />
        <div className="mt-5 flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 flex-1 animate-pulse rounded-full bg-neutral-100 sm:flex-none sm:w-28" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="h-5 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-50" />
          ))}
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
