import { AssetsMetricsContent } from "@/components/dashboard/assets/assets-metrics-content";
import { pageMeta } from "@/lib/i18n/page-metadata";

export const metadata = pageMeta("meta.metrics.title", "meta.metrics.description");

export default function AssetsMetricsPage() {
  return (
    <div className="pb-6">
      <AssetsMetricsContent />
    </div>
  );
}
