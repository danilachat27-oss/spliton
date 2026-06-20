import { ActivityPageContent } from "@/components/dashboard/assets/activity-page-content";
import { pageMeta } from "@/lib/i18n/page-metadata";

export const metadata = pageMeta("meta.activity.title", "meta.activity.description");

export default function AssetsActivityPage() {
  return (
    <div className="pb-6">
      <ActivityPageContent />
    </div>
  );
}
