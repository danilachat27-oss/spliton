import { AnalyticsRevenueSection } from "@/features/admin/sections/analytics/analytics-revenue-section";
import { AdminAnalyticsGuard } from "@/features/admin/analytics/components/admin-analytics-layout";

export default function AdminAnalyticsRevenuePage() {
  return (
    <AdminAnalyticsGuard sectionId="analyticsRevenue">
      <AnalyticsRevenueSection />
    </AdminAnalyticsGuard>
  );
}
