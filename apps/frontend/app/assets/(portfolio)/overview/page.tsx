import { AssetsOverviewContent } from "@/components/dashboard/assets/assets-overview-content";
import { pageMetaAsync } from "@/lib/i18n/page-metadata";

export async function generateMetadata() {
  return pageMetaAsync("meta.overview.title", "meta.overview.description");
}

export default function AssetsOverviewPage() {
  return (
    <div className="pb-6">
      <AssetsOverviewContent />
    </div>
  );
}
