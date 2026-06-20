import { AnalyticsOverviewSection } from "@/features/admin/sections/analytics/analytics-overview-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsPage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsOverview">
      <AnalyticsOverviewSection />
    </AdminAnalyticsGuard>
  );
}
