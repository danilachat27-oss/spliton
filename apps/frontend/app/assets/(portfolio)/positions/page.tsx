import { PositionsPageContent } from "@/components/dashboard/assets/positions-page-content";
import { pageMeta } from "@/lib/i18n/page-metadata";

export const metadata = pageMeta("meta.positions.title", "meta.positions.description");

export default function AssetsPositionsPage() {
  return (
    <div className="pb-6">
      <PositionsPageContent />
    </div>
  );
}
