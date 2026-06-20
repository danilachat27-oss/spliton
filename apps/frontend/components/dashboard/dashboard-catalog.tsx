"use client";

import Link from "next/link";
import { ArrowRight } from "@/lib/lucide";
import { useCallback, useEffect, useState } from "react";

import { CatalogTrackCard } from "@/components/dashboard/catalog-track-card";
import { ROUTES } from "@/constants/routes";
import { catalogItems } from "@/lib/catalog-mock";
import type { CatalogItem } from "@/lib/catalog-mock";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { cn } from "@/lib/utils";
import { isLiveCatalogEnabled, loadLiveCatalogItems } from "@/services/catalog.service";

const mockPreviewItems = catalogItems.slice(0, 4);

function CatalogPreviewSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[280px] animate-pulse rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}

export function DashboardCatalogSection({ className }: { className?: string }) {
  const live = isLiveCatalogEnabled();
  const [items, setItems] = useState<CatalogItem[]>(live ? [] : mockPreviewItems);
  const [loading, setLoading] = useState(live);
  const [fetchError, setFetchError] = useState<unknown>(null);

  const load = useCallback(() => {
    if (!live) {
      setItems(mockPreviewItems);
      setLoading(false);
      setFetchError(null);
      return;
    }

    setLoading(true);
    setFetchError(null);

    void loadLiveCatalogItems({ page: 1, pageSize: 4, sort: "progress_desc" })
      .then((next) => {
        setItems(next.items.slice(0, 4));
      })
      .catch((err) => {
        setItems([]);
        setFetchError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [live]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section
      id="catalog"
      className={cn("scroll-mt-24 border-t border-white/10 pb-12 md:pb-16 lg:pb-[4.5rem]", className)}
      aria-labelledby="dash-catalog-heading"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-10 sm:px-6 sm:pt-12 md:pt-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12 xl:gap-16">
          <div className="max-w-lg lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Каталог</p>
            <h2
              id="dash-catalog-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-[2.75rem] lg:leading-[1.08]"
            >
              Выберите проект для входа
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 md:text-base md:leading-7">
              Те же карточки, что в каталоге: быстрый вход в релиз, покупка UNT и переход ко всем позициям на
              площадке.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.dashboardCatalog}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Открыть каталог
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
              <Link
                href={ROUTES.dashboardCatalog}
                className="inline-flex h-11 items-center justify-center rounded-full px-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                Смотреть все
              </Link>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            {!live ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                Демо-карточки каталога
              </p>
            ) : null}

            {loading ? (
              <CatalogPreviewSkeleton />
            ) : fetchError ? (
              <ReadOnlySectionError
                sectionId="dashboard-catalog-preview"
                error={fetchError}
                onRetry={load}
                variant="dark"
              />
            ) : items.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-zinc-400">
                Пока нет доступных релизов в каталоге.
              </p>
            ) : (
              items.map((item) => <CatalogTrackCard key={item.id} item={item} variant="card" size="default" />)
            )}
            <Link
              href={ROUTES.dashboardCatalog}
              className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-zinc-400 transition hover:text-[#d4f570]"
            >
              Перейти в полный каталог
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** @deprecated Используйте DashboardCatalogSection на лендинге кабинета. */
export function DashboardCatalog({ className }: { className?: string }) {
  return <DashboardCatalogSection className={className} />;
}
