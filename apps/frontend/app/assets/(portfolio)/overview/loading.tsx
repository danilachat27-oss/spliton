import { PortfolioOverviewSkeleton } from "@/components/dashboard/assets/portfolio-overview-skeleton";

export default function AssetsOverviewLoading() {
  return (
    <div className="py-6 sm:py-8">
      <PortfolioOverviewSkeleton />
    </div>
  );
}