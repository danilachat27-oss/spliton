import { Suspense } from "react";

import { ReleaseAnalyticsPage } from "@/components/dashboard/release-analytics-page";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync(
    "meta.analytics.releases.title",
    "meta.analytics.releases.description",
  );
}

export default function AnalyticsReleasesRoutePage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader />
      </div>
      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={<div className="h-full min-h-[320px] bg-black" aria-hidden />}>
          <ReleaseAnalyticsPage />
        </Suspense>
      </div>
    </div>
  );
}
