import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SplitonLoadingView } from "@/components/ui/spliton-loader";

export default function AnalyticsReleaseDetailLoading() {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-black">
      <div className="sticky top-0 z-120 shrink-0 bg-black">
        <DashboardHeader />
      </div>
      <SplitonLoadingView
        variant="dark"
        size="lg"
        minHeight="min-h-0 flex-1"
        labelKey="common.loading.releaseAnalytics"
        className="bg-black"
      />
    </div>
  );
}
