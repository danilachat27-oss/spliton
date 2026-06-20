import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReleaseParametersScreen } from "@/components/release-parameters/release-parameters-screen";
import { criticalPageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return criticalPageMetaAsync(
    "meta.catalog.releaseParameters.title",
    "meta.catalog.releaseParameters.description",
  );
}

export default function CatalogReleaseParametersPage() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader />
      </div>
      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
        <ReleaseParametersScreen />
      </div>
    </div>
  );
}
