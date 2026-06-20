import { PortfolioOverviewSkeleton } from "@/components/dashboard/assets/portfolio-overview-skeleton";

export default function AssetsSellUnitsLoading() {
  return (
    <div className="space-y-10 pb-8 sm:space-y-12">
      <PortfolioOverviewSkeleton />
    </div>
  );
}
