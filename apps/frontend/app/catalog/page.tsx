import { Suspense } from "react";

import { DashboardCatalogPage } from "@/components/dashboard/dashboard-catalog-page";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CatalogCardsSkeleton } from "@/features/catalog/ui/catalog-skeleton";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync("meta.catalog.title", "meta.catalog.description");
}

export default function CatalogRoutePage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader sticky={false} flushBottom />
      </div>
      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<CatalogCardsSkeleton count={4} />}>
          <DashboardCatalogPage />
        </Suspense>
      </div>
    </div>
  );
}
