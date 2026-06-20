export function CatalogBuyUnitsSkeleton() {
  return (
    <div className="min-h-0 bg-white text-zinc-950 antialiased" aria-hidden>
      <div className="border-b border-zinc-100 bg-white py-3.5 md:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="h-5 w-36 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
        </div>
      </div>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
          <div className="mb-5 flex gap-2">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-zinc-100" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="size-24 shrink-0 animate-pulse rounded-2xl bg-zinc-100 sm:size-28" />
                <div className="min-w-0 flex-1 space-y-3 pt-1">
                  <div className="h-7 w-3/4 max-w-sm animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-1/2 max-w-xs animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-50 ring-1 ring-zinc-100" />
                ))}
              </div>
              <div className="h-40 animate-pulse rounded-2xl bg-zinc-50 ring-1 ring-zinc-100" />
            </div>

            <div className="h-[420px] animate-pulse rounded-2xl bg-zinc-50 ring-1 ring-zinc-100" />
          </div>
        </div>
      </section>
    </div>
  );
}
